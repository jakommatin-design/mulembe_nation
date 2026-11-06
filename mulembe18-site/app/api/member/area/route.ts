import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { query, initDatabaseSchema } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized: Please sign in." }, { status: 401 });
    }

    await initDatabaseSchema();

    // Resolve member
    let memberRows = await query<any>(
      "SELECT id, full_name, email, area_id, area_name, ward, subcounty FROM members WHERE clerk_id = ? LIMIT 1",
      [userId]
    );

    if (memberRows.length === 0) {
      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
      if (email) {
        memberRows = await query<any>(
          "SELECT id, full_name, email, area_id, area_name, ward, subcounty FROM members WHERE email = ? LIMIT 1",
          [email.toLowerCase().trim()]
        );
        if (memberRows.length > 0) {
          await query("UPDATE members SET clerk_id = ? WHERE id = ?", [userId, memberRows[0].id]);
        }
      }
    }

    if (memberRows.length === 0) {
      return NextResponse.json({ success: false, message: "Member record not found." }, { status: 404 });
    }

    const member = memberRows[0];
    const body = await req.json();
    const { areaId, reason } = body;

    if (!areaId) {
      return NextResponse.json({ success: false, message: "areaId is required." }, { status: 400 });
    }

    // Verify area exists and is active
    const areaRows = await query<any>("SELECT id, name, ward, subcounty, is_active FROM areas WHERE id = ? LIMIT 1", [areaId]);
    if (areaRows.length === 0) {
      return NextResponse.json({ success: false, message: "Area not found." }, { status: 404 });
    }
    const targetArea = areaRows[0];

    const oldAreaName = member.area_name || "None / Unassigned";
    const newAreaName = targetArea.name;

    // Update member record (also align ward & subcounty if needed)
    await query(
      `UPDATE members
       SET area_id = ?,
           area_name = ?,
           ward = COALESCE(ward, ?),
           subcounty = COALESCE(subcounty, ?)
       WHERE id = ?`,
      [targetArea.id, targetArea.name, targetArea.ward, targetArea.subcounty, member.id]
    );

    // Record change log
    await query(
      `INSERT INTO area_change_logs (member_id, old_area, new_area, changed_by, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [
        member.id,
        oldAreaName,
        newAreaName,
        member.full_name || "Member Self-Service",
        reason || "Member updated their residential area",
      ]
    );

    return NextResponse.json({
      success: true,
      message: `Area updated to '${newAreaName}'.`,
      areaName: newAreaName,
      areaId: targetArea.id,
    });
  } catch (error: any) {
    console.error("[Member Area Update API] error:", error);
    return NextResponse.json({ success: false, message: error?.message || "Failed to update area" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await initDatabaseSchema();
    const memberRows = await query<any>(
      "SELECT id, area_id, area_name, ward, subcounty FROM members WHERE clerk_id = ? LIMIT 1",
      [userId]
    );

    if (memberRows.length === 0) {
      return NextResponse.json({ success: true, logs: [] });
    }

    const logs = await query<any>(
      "SELECT * FROM area_change_logs WHERE member_id = ? ORDER BY created_at DESC LIMIT 20",
      [memberRows[0].id]
    );

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, logs: [], message: error?.message }, { status: 500 });
  }
}

