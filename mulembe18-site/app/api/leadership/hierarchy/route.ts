import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { query, initDatabaseSchema } from "@/lib/db";

export async function GET(req: Request) {
  try {
    await initDatabaseSchema();
    const { searchParams } = new URL(req.url);

    let memberCounty = searchParams.get("county") || "Mombasa";
    let memberSubcounty = searchParams.get("subcounty");
    let memberWard = searchParams.get("ward");
    let memberAreaId = searchParams.get("areaId");

    // If caller is authenticated, default to their profile locations if not passed
    const { userId } = await auth();
    if (userId && (!memberSubcounty || !memberWard)) {
      let memberRows = await query<any>(
        "SELECT id, full_name, email, county, subcounty, residential_zone, ward, area_id, area_name FROM members WHERE clerk_id = ? LIMIT 1",
        [userId]
      );
      if (memberRows.length === 0) {
        const clerkUser = await currentUser();
        const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
        if (email) {
          memberRows = await query<any>(
            "SELECT id, full_name, email, county, subcounty, residential_zone, ward, area_id, area_name FROM members WHERE email = ? LIMIT 1",
            [email.toLowerCase().trim()]
          );
        }
      }

      if (memberRows.length > 0) {
        const m = memberRows[0];
        memberCounty = m.county || memberCounty;
        memberSubcounty = memberSubcounty || m.subcounty || m.residential_zone || "Nyali";
        memberWard = memberWard || m.ward;
        memberAreaId = memberAreaId || (m.area_id ? String(m.area_id) : null);
      }
    }

    // 1. County Leadership (Top executive leaders from leadership_members table)
    const countyLeaders = await query<any>(
      "SELECT name, role, phone, email, avatar_url, 'County Executive' AS level FROM leadership_members WHERE status = 'Active' ORDER BY sort_order ASC LIMIT 3"
    );

    // 2. Subcounty Leader
    let subcountyLeader = null;
    if (memberSubcounty) {
      const subRows = await query<any>(
        `SELECT id, full_name AS name, 'Subcounty Administrator' AS role, phone, email, avatar_url, subcounty_admin_zone
         FROM members
         WHERE (role = 'subcounty_admin' OR role = 'super_admin')
           AND (subcounty_admin_zone = ? OR residential_zone = ? OR subcounty = ?)
         ORDER BY (role = 'subcounty_admin') DESC LIMIT 1`,
        [memberSubcounty, memberSubcounty, memberSubcounty]
      );
      if (subRows.length > 0) {
        subcountyLeader = subRows[0];
      }
    }

    // 3. Ward Leader
    let wardLeader = null;
    if (memberWard) {
      const wardRows = await query<any>(
        `SELECT id, full_name AS name, 'Ward Leader' AS role, phone, email, avatar_url, ward_leader_ward AS ward
         FROM members
         WHERE role = 'ward_leader' AND ward_leader_ward = ?
         LIMIT 1`,
        [memberWard]
      );
      if (wardRows.length > 0) {
        wardLeader = wardRows[0];
      }
    }

    // 4. Area Leader
    let areaLeader = null;
    let currentAreaDetails = null;
    if (memberAreaId) {
      const areaRows = await query<any>(
        `SELECT id, name, ward, subcounty, description, contact_info,
                area_leader_name, area_leader_phone, area_leader_email, area_leader_member_id
         FROM areas WHERE id = ? LIMIT 1`,
        [memberAreaId]
      );
      if (areaRows.length > 0) {
        currentAreaDetails = areaRows[0];
        if (currentAreaDetails.area_leader_name) {
          areaLeader = {
            id: currentAreaDetails.area_leader_member_id,
            name: currentAreaDetails.area_leader_name,
            role: "Area Leader",
            phone: currentAreaDetails.area_leader_phone,
            email: currentAreaDetails.area_leader_email,
            areaName: currentAreaDetails.name,
          };
        }
      }
    }

    return NextResponse.json({
      success: true,
      hierarchy: {
        county: {
          level: "County",
          name: memberCounty || "Mombasa County",
          leaders: countyLeaders.length > 0 ? countyLeaders : [
            { name: "Executive Governing Council", role: "County Council", phone: "0722 000000", email: "secretariat@mulembe18.org" }
          ],
        },
        subcounty: {
          level: "Subcounty",
          name: memberSubcounty ? `${memberSubcounty} Subcounty` : "Unassigned Subcounty",
          isVacant: !subcountyLeader,
          leader: subcountyLeader || {
            name: "Position Vacant / To be appointed",
            role: "Subcounty Leader",
            phone: "—",
            email: "—",
            isVacant: true,
          },
        },
        ward: {
          level: "Ward",
          name: memberWard ? `${memberWard} Ward` : "Unassigned Ward",
          isVacant: !wardLeader,
          leader: wardLeader || {
            name: "Position Vacant / To be appointed",
            role: "Ward Leader",
            phone: "—",
            email: "—",
            isVacant: true,
          },
        },
        area: {
          level: "Area",
          name: currentAreaDetails ? currentAreaDetails.name : "No Area Selected",
          areaId: currentAreaDetails ? currentAreaDetails.id : null,
          description: currentAreaDetails ? currentAreaDetails.description : null,
          isVacant: !areaLeader,
          hasArea: Boolean(currentAreaDetails),
          leader: areaLeader || {
            name: currentAreaDetails ? "Position Vacant / To be appointed" : "No Area Selected",
            role: "Area Leader",
            phone: "—",
            email: "—",
            isVacant: true,
          },
        },
      },
    });
  } catch (error: any) {
    console.error("[Leadership Hierarchy API] error:", error);
    return NextResponse.json({ success: false, message: error?.message }, { status: 500 });
  }
}

