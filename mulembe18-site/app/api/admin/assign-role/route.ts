import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { query, initDatabaseSchema } from "@/lib/db";

/* ── POST /api/admin/assign-role ─────────────────────────────────── */
// Super Admins & Subcounty Admins can assign Ward Leaders.
// Ward Leaders can assign Area Leaders.
// Super Admins can assign all roles.

const VALID_ROLES = ["member", "area_leader", "ward_leader", "subcounty_admin", "super_admin"];

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
      "SELECT id, full_name, email, role, subcounty_admin_zone, ward_leader_ward FROM members WHERE clerk_id = ? LIMIT 1",
      [userId]
    );

    if (callerRows.length === 0) {
      const clerkUser = await currentUser();
      const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
      if (userEmail) {
        callerRows = await query<any>(
          "SELECT id, full_name, email, role, subcounty_admin_zone, ward_leader_ward FROM members WHERE email = ? LIMIT 1",
          [userEmail.toLowerCase().trim()]
        );
        if (callerRows.length > 0) {
          await query("UPDATE members SET clerk_id = ? WHERE id = ?", [userId, callerRows[0].id]);
        }
      }
    }

    let callerRole = callerRows[0]?.role ?? "member";
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
    const { targetMemberId, newRole, subcountyZone, ward, areaId } = body;

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
    if (callerRole === "super_admin") {
      // Super admin can assign any role
    } else if (callerRole === "subcounty_admin") {
      // Subcounty admin can only assign ward_leader or demote to member within their subcounty
      if (newRole !== "ward_leader" && newRole !== "member") {
        return NextResponse.json(
          { success: false, message: "Forbidden: Subcounty admins can only appoint Ward Leaders or Members." },
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
    if (newRole === "subcounty_admin" && !subcountyZone) {
      return NextResponse.json({ success: false, message: "subcountyZone is required for subcounty_admin role." }, { status: 400 });
    }
    if (newRole === "ward_leader" && !ward) {
      return NextResponse.json({ success: false, message: "ward name is required for ward_leader role." }, { status: 400 });
    }

    const targetRows = await query<any>("SELECT id, full_name, email, phone, ward FROM members WHERE id = ? LIMIT 1", [targetMemberId]);
    if (targetRows.length === 0) {
      return NextResponse.json({ success: false, message: "Member not found." }, { status: 404 });
    }
    const target = targetRows[0];

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
           subcounty_admin_zone = ?,
           ward_leader_ward = ?,
           area_leader_area_id = ?
       WHERE id = ?`,
      [
        newRole,
        newRole === "subcounty_admin" ? subcountyZone : null,
        newRole === "ward_leader" ? ward : null,
        newRole === "area_leader" ? areaId || null : null,
        targetMemberId,
      ]
    );

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
