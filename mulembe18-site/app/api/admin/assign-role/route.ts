import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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

    // 2. Verify caller is super_admin
    const callerRows = await query<any>(
      "SELECT role FROM members WHERE clerk_id = ? LIMIT 1",
      [userId]
    );
    const callerRole = callerRows[0]?.role ?? "member";
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

