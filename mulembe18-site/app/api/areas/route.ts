import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { query, initDatabaseSchema } from "@/lib/db";

async function getCallerDetails(userId: string | null) {
  if (!userId) return null;
  let rows = await query<any>(
    "SELECT id, full_name, email, role, subcounty_admin_zone, ward_leader_ward, area_leader_area_id FROM members WHERE clerk_id = ? LIMIT 1",
    [userId]
  );
  if (rows.length === 0) {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
    if (email) {
      rows = await query<any>(
        "SELECT id, full_name, email, role, subcounty_admin_zone, ward_leader_ward, area_leader_area_id FROM members WHERE email = ? LIMIT 1",
        [email.toLowerCase().trim()]
      );
      if (rows.length > 0) {
        await query("UPDATE members SET clerk_id = ? WHERE id = ?", [userId, rows[0].id]);
      }
    }
  }

  // Check if any super admin exists in DB
  const adminCountRows = await query<any>("SELECT COUNT(*) AS count FROM members WHERE role = 'super_admin'");
  const superAdminCount = Number(adminCountRows[0]?.count || 0);

  if (rows.length > 0) {
    if (superAdminCount === 0) rows[0].role = "super_admin";
    return rows[0];
  } else if (superAdminCount === 0) {
    return { id: 0, role: "super_admin", full_name: "Initial Super Admin" };
  }
  return null;
}

/* ── GET /api/areas ───────────────────────────────────────────────── */
export async function GET(req: Request) {
  try {
    await initDatabaseSchema();
    const { searchParams } = new URL(req.url);
    const ward = searchParams.get("ward");
    const subcounty = searchParams.get("subcounty");
    const activeOnly = searchParams.get("activeOnly") !== "false";
    const areaId = searchParams.get("id");

    let sql = `
      SELECT a.*,
             (SELECT COUNT(*) FROM members m WHERE m.area_id = a.id) AS member_count
      FROM areas a
      WHERE 1=1
    `;
    const params: any[] = [];

    if (areaId) {
      sql += " AND a.id = ?";
      params.push(areaId);
    }

    if (ward && ward !== "all") {
      sql += " AND a.ward = ?";
      params.push(ward);
    }

    if (subcounty && subcounty !== "all") {
      sql += " AND a.subcounty = ?";
      params.push(subcounty);
    }

    if (activeOnly) {
      sql += " AND a.is_active = TRUE";
    }

    sql += " ORDER BY a.name ASC";

    const areas = await query<any>(sql, params);
    return NextResponse.json({ success: true, areas });
  } catch (error: any) {
    console.error("[Areas GET API] error:", error);
    return NextResponse.json({ success: false, areas: [], message: error?.message }, { status: 500 });
  }
}

/* ── POST /api/areas (Single or Bulk Area Creation) ────────────────── */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await initDatabaseSchema();
    const caller = await getCallerDetails(userId);
    if (!caller) {
      return NextResponse.json({ success: false, message: "Caller account not found" }, { status: 403 });
    }

    const body = await req.json();
    const { areas: bulkAreas, name, ward, subcounty, county, description, contactInfo } = body;

    // Helper to validate and enforce leadership jurisdiction
    const enforceWardAccess = (targetWard: string, targetSubcounty: string, targetCounty?: string) => {
      if (caller.role === "super_admin" || caller.role === "national_leader") return true;
      if (caller.role === "county_leader") {
        const cCounty = caller.county_leader_county || caller.county || "Mombasa";
        return !targetCounty || targetCounty.toLowerCase() === cCounty.toLowerCase();
      }
      if (caller.role === "subcounty_admin") {
        return (
          caller.subcounty_admin_zone?.toLowerCase() === targetSubcounty.toLowerCase()
        );
      }
      if (caller.role === "ward_leader") {
        return (
          caller.ward_leader_ward?.toLowerCase() === targetWard.toLowerCase()
        );
      }
      return false;
    };

    // Bulk upload mode
    if (Array.isArray(bulkAreas) && bulkAreas.length > 0) {
      let createdCount = 0;
      for (const item of bulkAreas) {
        const areaName = (item.name || "").trim();
        const areaWard = (item.ward || ward || caller.ward_leader_ward || "").trim();
        const areaSubcounty = (item.subcounty || subcounty || caller.subcounty_admin_zone || "Mombasa").trim();
        const areaCounty = item.county || county || "Mombasa";

        if (!areaName || !areaWard || !areaSubcounty) continue;
        if (!enforceWardAccess(areaWard, areaSubcounty)) {
          continue; // skip unauthorized ward
        }

        await query(
          `INSERT INTO areas (name, ward, subcounty, county, description, contact_info, created_by_ward_leader_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            areaName,
            areaWard,
            areaSubcounty,
            areaCounty,
            item.description || "",
            item.contactInfo || item.contact_info || "",
            caller.id || null,
          ]
        );
        createdCount++;
      }

      return NextResponse.json({
        success: true,
        message: `Successfully created ${createdCount} areas.`,
        createdCount,
      });
    }

    // Single area create
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: "Area name is required." }, { status: 400 });
    }

    const targetWard = (ward || caller.ward_leader_ward || "").trim();
    const targetSubcounty = (subcounty || caller.subcounty_admin_zone || "Mombasa").trim();

    if (!targetWard) {
      return NextResponse.json({ success: false, message: "Ward is required for area creation." }, { status: 400 });
    }

    if (!enforceWardAccess(targetWard, targetSubcounty)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You can only create areas within your assigned ward." },
        { status: 403 }
      );
    }

    const insertResult: any = await query(
      `INSERT INTO areas (name, ward, subcounty, county, description, contact_info, created_by_ward_leader_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        targetWard,
        targetSubcounty,
        county || "Mombasa",
        description || "",
        contactInfo || "",
        caller.id || null,
      ]
    );

    return NextResponse.json({
      success: true,
      message: `Area '${name.trim()}' created successfully in ${targetWard} Ward.`,
      areaId: insertResult.insertId,
    });
  } catch (error: any) {
    console.error("[Areas POST API] error:", error);
    return NextResponse.json({ success: false, message: error?.message || "Failed to create area" }, { status: 500 });
  }
}

/* ── PUT /api/areas (Update Area, Deactivate, Assign Area Leader) ─── */
export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await initDatabaseSchema();
    const caller = await getCallerDetails(userId);
    if (!caller) {
      return NextResponse.json({ success: false, message: "Caller account not found" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, description, contactInfo, isActive, areaLeaderMemberId } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "Area ID is required." }, { status: 400 });
    }

    const existingRows = await query<any>("SELECT * FROM areas WHERE id = ? LIMIT 1", [id]);
    if (existingRows.length === 0) {
      return NextResponse.json({ success: false, message: "Area not found." }, { status: 404 });
    }
    const currentArea = existingRows[0];

    // Backend access enforcement
    const isSuperAdmin = caller.role === "super_admin";
    const isSubcountyAdmin = caller.role === "subcounty_admin" && caller.subcounty_admin_zone?.toLowerCase() === currentArea.subcounty.toLowerCase();
    const isWardLeader = caller.role === "ward_leader" && caller.ward_leader_ward?.toLowerCase() === currentArea.ward.toLowerCase();
    const isAreaLeader = caller.role === "area_leader" && Number(caller.area_leader_area_id) === Number(id);

    if (!isSuperAdmin && !isSubcountyAdmin && !isWardLeader && !isAreaLeader) {
      return NextResponse.json({ success: false, message: "Forbidden: You do not lead this area or ward." }, { status: 403 });
    }

    // Area Leader is only allowed to edit description, contactInfo, and name
    if (isAreaLeader && !isWardLeader && !isSuperAdmin && !isSubcountyAdmin) {
      await query(
        `UPDATE areas
         SET name = COALESCE(?, name),
             description = COALESCE(?, description),
             contact_info = COALESCE(?, contact_info)
         WHERE id = ?`,
        [name ? name.trim() : null, description ?? null, contactInfo ?? null, id]
      );
      return NextResponse.json({ success: true, message: "Area details updated by Area Leader." });
    }

    // Ward Leader / Admin can also assign Area Leader and deactivate area
    let leaderName = currentArea.area_leader_name;
    let leaderPhone = currentArea.area_leader_phone;
    let leaderEmail = currentArea.area_leader_email;

    if (areaLeaderMemberId !== undefined) {
      if (areaLeaderMemberId === null || areaLeaderMemberId === 0) {
        // Clear area leader
        if (currentArea.area_leader_member_id) {
          await query(
            "UPDATE members SET role = 'member', area_leader_area_id = NULL WHERE id = ?",
            [currentArea.area_leader_member_id]
          );
        }
        leaderName = null;
        leaderPhone = null;
        leaderEmail = null;
      } else {
        // Assign new area leader
        const targetMemberRows = await query<any>("SELECT id, full_name, phone, email FROM members WHERE id = ? LIMIT 1", [areaLeaderMemberId]);
        if (targetMemberRows.length > 0) {
          const target = targetMemberRows[0];
          leaderName = target.full_name;
          leaderPhone = target.phone;
          leaderEmail = target.email;

          // Promote member to area_leader and link area
          await query(
            "UPDATE members SET role = 'area_leader', area_leader_area_id = ?, area_id = ?, area_name = ? WHERE id = ?",
            [id, id, currentArea.name, target.id]
          );
        }
      }
    }

    // Edge case: if deactivating an area that has members
    if (isActive === false && currentArea.is_active === 1) {
      const memberCountRows = await query<any>("SELECT COUNT(*) AS count FROM members WHERE area_id = ?", [id]);
      const memberCount = Number(memberCountRows[0]?.count || 0);
      if (memberCount > 0) {
        // Log deactivation note
        await query(
          "INSERT INTO area_change_logs (member_id, old_area, new_area, changed_by, reason) VALUES (0, ?, ?, ?, ?)",
          [currentArea.name, "Deactivated Area", caller.full_name || "Leader", `Area deactivated with ${memberCount} members flagged`]
        );
      }
    }

    await query(
      `UPDATE areas
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           contact_info = COALESCE(?, contact_info),
           is_active = COALESCE(?, is_active),
           area_leader_member_id = ?,
           area_leader_name = ?,
           area_leader_phone = ?,
           area_leader_email = ?
       WHERE id = ?`,
      [
        name ? name.trim() : null,
        description ?? null,
        contactInfo ?? null,
        isActive !== undefined ? isActive : null,
        areaLeaderMemberId !== undefined ? (areaLeaderMemberId === 0 ? null : areaLeaderMemberId) : currentArea.area_leader_member_id,
        leaderName,
        leaderPhone,
        leaderEmail,
        id,
      ]
    );

    return NextResponse.json({ success: true, message: "Area updated successfully." });
  } catch (error: any) {
    console.error("[Areas PUT API] error:", error);
    return NextResponse.json({ success: false, message: error?.message || "Failed to update area" }, { status: 500 });
  }
}

/* ── DELETE /api/areas ────────────────────────────────────────────── */
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await initDatabaseSchema();
    const caller = await getCallerDetails(userId);
    if (!caller) {
      return NextResponse.json({ success: false, message: "Caller account not found" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "Area ID is required." }, { status: 400 });
    }

    const existingRows = await query<any>("SELECT * FROM areas WHERE id = ? LIMIT 1", [id]);
    if (existingRows.length === 0) {
      return NextResponse.json({ success: false, message: "Area not found." }, { status: 404 });
    }
    const currentArea = existingRows[0];

    const isSuperAdmin = caller.role === "super_admin";
    const isSubcountyAdmin = caller.role === "subcounty_admin" && caller.subcounty_admin_zone?.toLowerCase() === currentArea.subcounty.toLowerCase();
    const isWardLeader = caller.role === "ward_leader" && caller.ward_leader_ward?.toLowerCase() === currentArea.ward.toLowerCase();

    if (!isSuperAdmin && !isSubcountyAdmin && !isWardLeader) {
      return NextResponse.json({ success: false, message: "Forbidden: You cannot delete this area." }, { status: 403 });
    }

    // Edge case: Handle members in this area before deletion!
    const memberRows = await query<any>("SELECT id, full_name FROM members WHERE area_id = ?", [id]);
    for (const m of memberRows) {
      await query(
        "UPDATE members SET area_id = NULL, area_name = 'Unassigned (Area Decommissioned)' WHERE id = ?",
        [m.id]
      );
      await query(
        "INSERT INTO area_change_logs (member_id, old_area, new_area, changed_by, reason) VALUES (?, ?, ?, ?, ?)",
        [m.id, currentArea.name, "Unassigned (Area Decommissioned)", caller.full_name || "Leader", "Area deleted by Ward Leader"]
      );
    }

    await query("DELETE FROM areas WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: `Area '${currentArea.name}' deleted. ${memberRows.length} member(s) safely unassigned.`,
    });
  } catch (error: any) {
    console.error("[Areas DELETE API] error:", error);
    return NextResponse.json({ success: false, message: error?.message || "Failed to delete area" }, { status: 500 });
  }
}

