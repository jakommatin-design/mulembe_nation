import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { query, initDatabaseSchema } from "@/lib/db";

export async function GET(req: Request) {
  try {
    await initDatabaseSchema();
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope"); // "subcounty" | "admin" | undefined (public/directory)
    const clan = searchParams.get("clan");
    const subcounty = searchParams.get("subcounty");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const offset = (page - 1) * limit;

    // Check caller authentication
    const { userId } = await auth();
    let callerRole: string = "public";
    let callerSubcountyZone: string | null = null;
    let callerMember: any = null;

    if (userId) {
      const callerRows = await query<any>(
        "SELECT id, full_name, email, role, subcounty_admin_zone FROM members WHERE clerk_id = ? LIMIT 1",
        [userId]
      );
      if (callerRows.length > 0) {
        callerRole = callerRows[0].role || "member";
        callerSubcountyZone = callerRows[0].subcounty_admin_zone || null;
        callerMember = callerRows[0];
      }
    }

    // ── Enforce Subcounty Admin Access Control ────────────────────────
    if (scope === "subcounty" || callerRole === "subcounty_admin") {
      if (!userId) {
        return NextResponse.json(
          { success: false, message: "Unauthorized: Please log in." },
          { status: 401 }
        );
      }

      // If user is neither subcounty_admin nor super_admin, block access
      if (callerRole !== "subcounty_admin" && callerRole !== "super_admin") {
        return NextResponse.json(
          { success: false, message: "Forbidden: Subcounty Leader access required." },
          { status: 403 }
        );
      }

      // If subcounty_admin, strictly enforce their assigned subcounty zone!
      // They cannot view members outside their assigned subcounty, even if requested.
      let enforcedZone = callerSubcountyZone;
      if (callerRole === "super_admin") {
        // Super admin can inspect any subcounty or view all
        enforcedZone = subcounty || null;
      }

      let countSql = "SELECT COUNT(*) AS total FROM members WHERE 1=1";
      let dataSql = "SELECT id, full_name, email, phone, sub_clan, residential_zone, profession, membership_no, role, status, created_at, avatar_url, bio FROM members WHERE 1=1";
      const params: any[] = [];
      const countParams: any[] = [];

      if (enforcedZone && enforcedZone !== "all") {
        const zoneClause = " AND (residential_zone = ? OR sub_clan = ?)";
        countSql += zoneClause;
        dataSql += zoneClause;
        countParams.push(enforcedZone, enforcedZone);
        params.push(enforcedZone, enforcedZone);
      }

      if (status && status !== "all") {
        countSql += " AND status = ?";
        dataSql += " AND status = ?";
        countParams.push(status);
        params.push(status);
      }

      if (search && search.trim()) {
        const searchClause = " AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR membership_no LIKE ? OR profession LIKE ?)";
        const term = `%${search.trim()}%`;
        countSql += searchClause;
        dataSql += searchClause;
        countParams.push(term, term, term, term, term);
        params.push(term, term, term, term, term);
      }

      const totalResult = await query<any>(countSql, countParams);
      const total = Number(totalResult[0]?.total || 0);

      dataSql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const members = await query<any>(dataSql, params);

      return NextResponse.json({
        success: true,
        members,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        callerRole,
        assignedSubcounty: enforcedZone || "All Subcounties",
      });
    }

    // ── Standard Query (Admin or Public Directory) ─────────────────────
    let sql = "SELECT id, full_name, email, phone, sub_clan, residential_zone, profession, membership_no, role, subcounty_admin_zone, status, created_at, avatar_url, bio FROM members WHERE 1=1";
    let countSql = "SELECT COUNT(*) AS total FROM members WHERE 1=1";
    const params: any[] = [];
    const countParams: any[] = [];

    if (clan && clan !== "all") {
      sql += " AND sub_clan = ?";
      countSql += " AND sub_clan = ?";
      params.push(clan);
      countParams.push(clan);
    }

    if (subcounty && subcounty !== "all") {
      sql += " AND (residential_zone = ? OR sub_clan = ?)";
      countSql += " AND (residential_zone = ? OR sub_clan = ?)";
      params.push(subcounty, subcounty);
      countParams.push(subcounty, subcounty);
    }

    if (status && status !== "all") {
      sql += " AND status = ?";
      countSql += " AND status = ?";
      params.push(status);
      countParams.push(status);
    }

    if (search && search.trim()) {
      sql += " AND (full_name LIKE ? OR profession LIKE ? OR residential_zone LIKE ? OR membership_no LIKE ? OR email LIKE ? OR phone LIKE ?)";
      countSql += " AND (full_name LIKE ? OR profession LIKE ? OR residential_zone LIKE ? OR membership_no LIKE ? OR email LIKE ? OR phone LIKE ?)";
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term, term);
      countParams.push(term, term, term, term, term, term);
    }

    const totalResult = await query<any>(countSql, countParams);
    const total = Number(totalResult[0]?.total || 0);

    // If caller explicitly passed pagination params
    if (searchParams.has("page") || searchParams.has("limit")) {
      sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);
    } else {
      sql += " ORDER BY created_at DESC LIMIT 200";
    }

    const members = await query(sql, params);

    return NextResponse.json({
      success: true,
      members,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      callerRole,
      assignedSubcounty: callerSubcountyZone,
    });
  } catch (error: any) {
    console.error("[Members GET API] error:", error);
    await initDatabaseSchema();
    return NextResponse.json(
      { success: false, members: [], total: 0, message: error?.message || "Database connecting" },
      { status: 200 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      subClan,
      residentialZone,
      profession,
      field,
      clerkId,
      bio,
    } = body;

    if (!fullName || !phone || !subClan) {
      return NextResponse.json(
        { success: false, message: "Full Name, Phone, and Sub-Clan are required" },
        { status: 400 }
      );
    }

    const membershipNo = `M18-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    await initDatabaseSchema();

    await query(
      `INSERT INTO members (clerk_id, full_name, email, phone, sub_clan, residential_zone, profession, field, membership_no, bio, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'member', 'Verified')`,
      [
        clerkId || null,
        fullName.trim(),
        email ? email.toLowerCase().trim() : null,
        phone.replace(/\s/g, ""),
        subClan,
        residentialZone || "Mombasa",
        profession || "Community Member",
        field || "General",
        membershipNo,
        bio || "",
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Member registered successfully",
      membershipNo,
    });
  } catch (error: any) {
    console.error("[Members POST API] error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Registration failed" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, status, role, subClan, residentialZone, profession, subcountyAdminZone } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "Member ID is required" }, { status: 400 });
    }

    await initDatabaseSchema();

    await query(
      `UPDATE members
       SET status = COALESCE(?, status),
           role = COALESCE(?, role),
           sub_clan = COALESCE(?, sub_clan),
           residential_zone = COALESCE(?, residential_zone),
           profession = COALESCE(?, profession),
           subcounty_admin_zone = COALESCE(?, subcounty_admin_zone)
       WHERE id = ?`,
      [status, role, subClan, residentialZone, profession, subcountyAdminZone, id]
    );

    return NextResponse.json({ success: true, message: "Member updated successfully" });
  } catch (error: any) {
    console.error("[Members API] PUT error:", error?.message || error);
    return NextResponse.json({ success: false, message: error?.message || "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "Member ID is required" }, { status: 400 });
    }

    await initDatabaseSchema();
    await query("DELETE FROM members WHERE id = ?", [id]);

    return NextResponse.json({ success: true, message: "Member removed successfully" });
  } catch (error: any) {
    console.error("[Members API] DELETE error:", error?.message || error);
    return NextResponse.json({ success: false, message: error?.message || "Failed to delete member" }, { status: 500 });
  }
}
