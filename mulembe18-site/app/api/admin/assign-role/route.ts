import { NextResponse } from "next/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { query, initDatabaseSchema } from "@/lib/db";
import { sendRoleAssignmentNotification } from "@/lib/notifications";

/* ── POST /api/admin/assign-role ─────────────────────────────────── */
// National Leaders & Super Admins can assign all roles nationwide.
// Subcounty Admins can assign Ward Leaders within their subcounty.
// Ward Leaders can assign Area Leaders within their ward.

const VALID_ROLES = ["member", "area_leader", "ward_leader", "subcounty_admin", "county_leader", "super_admin", "national_leader"];

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Not authenticated." }, { status: 401 });
    }

    await initDatabaseSchema();

    const adminCountRows = await query<any>("SELECT COUNT(*) AS count FROM members WHERE role = 'super_admin'");
    const superAdminCount = Number(adminCountRows[0]?.count || 0);

    let callerRows = await query<any>(
      "SELECT id, full_name, email, role, county, county_leader_county, subcounty_admin_zone, ward_leader_ward FROM members WHERE clerk_id = ? LIMIT 1",
      [userId]
    );

    if (callerRows.length === 0) {
      const clerkUser = await currentUser();
      const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
      if (userEmail) {
        callerRows = await query<any>(
          "SELECT id, full_name, email, role, county, county_leader_county, subcounty_admin_zone, ward_leader_ward FROM members WHERE email = ? LIMIT 1",
          [userEmail.toLowerCase().trim()]
        );
        if (callerRows.length > 0) {
          await query("UPDATE members SET clerk_id = ? WHERE id = ?", [userId, callerRows[0].id]);
        }
      }
    }

    let callerRole = callerRows[0]?.role ?? "member";
    const callerCounty = callerRows[0]?.county_leader_county || callerRows[0]?.county || "Mombasa";
    const callerSubcounty = callerRows[0]?.subcounty_admin_zone;
    const callerWard = callerRows[0]?.ward_leader_ward;

    // Bootstrap initial super admin if none exists
    if (superAdminCount === 0) {
      callerRole = "super_admin";
      if (callerRows.length > 0) {
        await query("UPDATE members SET role = 'super_admin' WHERE id = ?", [callerRows[0].id]);
      }
    }

    const body = await req.json();
    const { targetMemberId, newRole, county, subcountyZone, ward, areaId } = body;

    if (!targetMemberId || typeof targetMemberId !== "number") {
      return NextResponse.json({ success: false, message: "targetMemberId (number) is required." }, { status: 400 });
    }
    if (!newRole || !VALID_ROLES.includes(newRole)) {
      return NextResponse.json(
        { success: false, message: `newRole must be one of: ${VALID_ROLES.join(", ")}.` },
        { status: 400 }
      );
    }

    // Permission checks based on hierarchy
    if (callerRole === "national_leader" || callerRole === "super_admin") {
      // National leader & Super admin can assign any role across all counties
    } else if (callerRole === "county_leader") {
      // County leader can assign subcounty_admin, ward_leader, area_leader, or member in their county
      if (newRole === "national_leader" || newRole === "super_admin" || newRole === "county_leader") {
        return NextResponse.json(
          { success: false, message: "Forbidden: County leaders cannot appoint national or county leaders." },
          { status: 403 }
        );
      }
    } else if (callerRole === "subcounty_admin") {
      // Subcounty admin can only assign ward_leader, area_leader, or demote to member within their subcounty
      if (newRole !== "ward_leader" && newRole !== "area_leader" && newRole !== "member") {
        return NextResponse.json(
          { success: false, message: "Forbidden: Subcounty admins can only appoint Ward Leaders, Area Leaders or Members." },
          { status: 403 }
        );
      }
      if (subcountyZone && callerSubcounty && subcountyZone.toLowerCase() !== callerSubcounty.toLowerCase()) {
        return NextResponse.json(
          { success: false, message: "Forbidden: You cannot assign leadership outside your subcounty." },
          { status: 403 }
        );
      }
    } else if (callerRole === "ward_leader") {
      // Ward leader can only assign area_leader or demote to member within their ward
      if (newRole !== "area_leader" && newRole !== "member") {
        return NextResponse.json(
          { success: false, message: "Forbidden: Ward leaders can only appoint Area Leaders." },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: "Forbidden: Leadership permissions required to assign roles." },
        { status: 403 }
      );
    }

    // Role-specific validation
    if (newRole === "county_leader" && !county) {
      return NextResponse.json({ success: false, message: "county name is required for county_leader role." }, { status: 400 });
    }
    if (newRole === "subcounty_admin" && !subcountyZone) {
      return NextResponse.json({ success: false, message: "subcountyZone is required for subcounty_admin role." }, { status: 400 });
    }
    if (newRole === "ward_leader" && !ward) {
      return NextResponse.json({ success: false, message: "ward name is required for ward_leader role." }, { status: 400 });
    }

    const targetRows = await query<any>("SELECT id, clerk_id, full_name, email, phone, county, ward FROM members WHERE id = ? LIMIT 1", [targetMemberId]);
    if (targetRows.length === 0) {
      return NextResponse.json({ success: false, message: "Member not found." }, { status: 404 });
    }
    const target = targetRows[0];

    // Enforce county leader jurisdiction
    if (callerRole === "county_leader" && target.county && target.county.toLowerCase() !== callerCounty.toLowerCase()) {
      return NextResponse.json({ success: false, message: "Forbidden: Target member is outside your county." }, { status: 403 });
    }

    // If appointing area_leader, link to areas table as well
    if (newRole === "area_leader" && areaId) {
      const areaRows = await query<any>("SELECT * FROM areas WHERE id = ? LIMIT 1", [areaId]);
      if (areaRows.length > 0) {
        const area = areaRows[0];
        // Enforce ward leader boundary
        if (callerRole === "ward_leader" && callerWard && area.ward.toLowerCase() !== callerWard.toLowerCase()) {
          return NextResponse.json({ success: false, message: "Forbidden: Area is not in your ward." }, { status: 403 });
        }
        await query(
          "UPDATE areas SET area_leader_member_id = ?, area_leader_name = ?, area_leader_phone = ?, area_leader_email = ? WHERE id = ?",
          [target.id, target.full_name, target.phone, target.email, areaId]
        );
      }
    }

    // Apply update to members
    await query(
      `UPDATE members
       SET role = ?,
           county_leader_county = ?,
           subcounty_admin_zone = ?,
           ward_leader_ward = ?,
           area_leader_area_id = ?
       WHERE id = ?`,
      [
        newRole,
        newRole === "county_leader" ? county || target.county : null,
        newRole === "subcounty_admin" ? subcountyZone : null,
        newRole === "ward_leader" ? ward : null,
        newRole === "area_leader" ? areaId || null : null,
        targetMemberId,
      ]
    );

    // Sync role to Clerk metadata
    if (target.clerk_id) {
      try {
        const client = await clerkClient();
        await client.users.updateUserMetadata(target.clerk_id, {
          publicMetadata: {
            role: newRole,
          },
        });
      } catch (clerkErr) {
        console.warn("[Assign Role] Clerk metadata update warning:", clerkErr);
      }
    }

    // Trigger role assignment notification via Email and SMS
    sendRoleAssignmentNotification({
      name: target.full_name,
      email: target.email,
      phone: target.phone,
      newRole,
      jurisdiction: ward || subcountyZone || (newRole === "national_leader" ? "All 47 Counties" : null),
    }).catch((err) => console.warn("[Assign Role] Notification error:", err));

    return NextResponse.json({
      success: true,
      message: `Role updated to '${newRole}' for ${target.full_name}.`,
    });
  } catch (error: any) {
    console.error("[Assign Role API] Error:", error?.message || error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to assign role." },
      { status: 500 }
    );
  }
}
