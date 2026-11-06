import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { query, initDatabaseSchema } from "@/lib/db";

/* ── POST /api/admin/assign-role ─────────────────────────────────── */
// Only super_admins may call this endpoint.
// Body: { targetMemberId: number, newRole: string, subcountyZone?: string }

const VALID_ROLES = ["member", "subcounty_admin", "super_admin"];

export async function POST(req: Request) {
  try {
    // 1. Authenticate caller via Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Not authenticated." }, { status: 401 });
    }

    await initDatabaseSchema();

    // Check if any super admin exists in DB
    const adminCountRows = await query<any>("SELECT COUNT(*) AS count FROM members WHERE role = 'super_admin'");
    const superAdminCount = Number(adminCountRows[0]?.count || 0);

    // 2. Resolve caller
    let callerRows = await query<any>(
      "SELECT id, full_name, email, role FROM members WHERE clerk_id = ? LIMIT 1",
      [userId]
    );

    // If not found by clerk_id, try linking via email from Clerk
    if (callerRows.length === 0) {
      const clerkUser = await currentUser();
      const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
      if (userEmail) {
        callerRows = await query<any>(
          "SELECT id, full_name, email, role FROM members WHERE email = ? LIMIT 1",
          [userEmail.toLowerCase().trim()]
        );
        if (callerRows.length > 0) {
          await query("UPDATE members SET clerk_id = ? WHERE id = ?", [userId, callerRows[0].id]);
        }
      }
    }

    let callerRole = callerRows[0]?.role ?? "member";

    // Bootstrap: If no super_admin exists yet, grant super_admin to this caller!
    if (superAdminCount === 0) {
      callerRole = "super_admin";
      if (callerRows.length > 0) {
        await query("UPDATE members SET role = 'super_admin' WHERE id = ?", [callerRows[0].id]);
      } else {
        const clerkUser = await currentUser();
        const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || "admin@mulembe18.org";
        const fullName = `${clerkUser?.firstName || "System"} ${clerkUser?.lastName || "Admin"}`.trim();
        await query(
          `INSERT INTO members (clerk_id, full_name, email, phone, sub_clan, residential_zone, profession, membership_no, role, status)
           VALUES (?, ?, ?, '0700000000', 'Bukusu', 'Mombasa', 'Super Administrator', 'M18-ADMIN-01', 'super_admin', 'Verified')`,
          [userId, fullName, userEmail]
        );
      }
    }

    if (callerRole !== "super_admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden: only super_admins can assign roles." },
        { status: 403 }
      );
    }

    // 3. Parse and validate body
    const body = await req.json();
    const { targetMemberId, newRole, subcountyZone } = body;

    if (!targetMemberId || typeof targetMemberId !== "number") {
      return NextResponse.json({ success: false, message: "targetMemberId (number) is required." }, { status: 400 });
    }
    if (!newRole || !VALID_ROLES.includes(newRole)) {
      return NextResponse.json(
        { success: false, message: `newRole must be one of: ${VALID_ROLES.join(", ")}.` },
        { status: 400 }
      );
    }
    if (newRole === "subcounty_admin" && !subcountyZone) {
      return NextResponse.json(
        { success: false, message: "subcountyZone is required when assigning subcounty_admin role." },
        { status: 400 }
      );
    }

    // 4. Check target member exists
    const targetRows = await query<any>("SELECT id, full_name FROM members WHERE id = ? LIMIT 1", [targetMemberId]);
    if (targetRows.length === 0) {
      return NextResponse.json({ success: false, message: "Member not found." }, { status: 404 });
    }

    // 5. Apply role update
    await query(
      "UPDATE members SET role = ?, subcounty_admin_zone = ? WHERE id = ?",
      [newRole, newRole === "subcounty_admin" ? subcountyZone : null, targetMemberId]
    );

    return NextResponse.json({
      success: true,
      message: `Role updated to '${newRole}' for ${targetRows[0].full_name}.`,
    });
  } catch (error: any) {
    console.error("[Assign Role API] Error:", error?.message || error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to assign role." },
      { status: 500 }
    );
  }
}

