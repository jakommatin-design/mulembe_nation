import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { query, initDatabaseSchema } from "@/lib/db";

export async function GET(req: Request) {
  try {
    await initDatabaseSchema();
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope"); // "subcounty" | "ward" | "area" | "admin" | undefined (public)
    const clan = searchParams.get("clan");
    const county = searchParams.get("county");
    const subcounty = searchParams.get("subcounty");
    const ward = searchParams.get("ward");
    const areaId = searchParams.get("areaId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const offset = (page - 1) * limit;

    // Check caller authentication
    const { userId } = await auth();
    let callerRole: string = "public";
    let callerSubcountyZone: string | null = null;
    let callerWard: string | null = null;
    let callerAreaId: number | null = null;
    let callerMember: any = null;

    if (userId) {
      let callerRows = await query<any>(
        "SELECT id, full_name, email, role, subcounty_admin_zone, ward_leader_ward, area_leader_area_id FROM members WHERE clerk_id = ? LIMIT 1",
        [userId]
      );

      // If not linked yet, check via Clerk email
      if (callerRows.length === 0) {
        const clerkUser = await currentUser();
        const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
        if (userEmail) {
          callerRows = await query<any>(
            "SELECT id, full_name, email, role, subcounty_admin_zone, ward_leader_ward, area_leader_area_id FROM members WHERE email = ? LIMIT 1",
            [userEmail.toLowerCase().trim()]
          );
          if (callerRows.length > 0) {
            await query("UPDATE members SET clerk_id = ? WHERE id = ?", [userId, callerRows[0].id]);
          }
        }
      }

      // Check if DB has any super admins
      const adminCountRows = await query<any>("SELECT COUNT(*) AS count FROM members WHERE role = 'super_admin'");
      const superAdminCount = Number(adminCountRows[0]?.count || 0);

      if (callerRows.length > 0) {
        callerRole = callerRows[0].role || "member";
        callerSubcountyZone = callerRows[0].subcounty_admin_zone || null;
        callerWard = callerRows[0].ward_leader_ward || null;
        callerAreaId = callerRows[0].area_leader_area_id ? Number(callerRows[0].area_leader_area_id) : null;
        callerMember = callerRows[0];
      }

      // Bootstrap initial super admin if none exists
      if (superAdminCount === 0) {
        callerRole = "super_admin";
        if (callerRows.length > 0) {
          await query("UPDATE members SET role = 'super_admin' WHERE id = ?", [callerRows[0].id]);
        }
      }
    }

    const selectFields = `
      id, full_name, email, phone, sub_clan, residential_zone,
      county, subcounty, ward, area_id, area_name,
      profession, membership_no, role, subcounty_admin_zone,
      ward_leader_ward, area_leader_area_id, status, created_at, avatar_url, bio
    `;

    // ── 1. Enforce Area Leader Scope ──────────────────────────────────
    if (scope === "area" || callerRole === "area_leader") {
      if (!userId) {
        return NextResponse.json({ success: false, message: "Unauthorized: Please log in." }, { status: 401 });
      }

      const isAreaLeader = callerRole === "area_leader" && callerAreaId;
      const isWardLeader = callerRole === "ward_leader";
      const isHigherAdmin = callerRole === "super_admin" || callerRole === "subcounty_admin";

      if (!isAreaLeader && !isWardLeader && !isHigherAdmin) {
        return NextResponse.json({ success: false, message: "Forbidden: Area Leader access required." }, { status: 403 });
      }

      let enforcedAreaId = isAreaLeader ? callerAreaId : (areaId ? Number(areaId) : null);

      let countSql = "SELECT COUNT(*) AS total FROM members WHERE 1=1";
      let dataSql = `SELECT ${selectFields} FROM members WHERE 1=1`;
      const params: any[] = [];
      const countParams: any[] = [];

      if (enforcedAreaId) {
        countSql += " AND area_id = ?";
        dataSql += " AND area_id = ?";
        countParams.push(enforcedAreaId);
        params.push(enforcedAreaId);
      }

      if (status && status !== "all") {
        countSql += " AND status = ?";
        dataSql += " AND status = ?";
        countParams.push(status);
        params.push(status);
      }

      if (search && search.trim()) {
        const searchClause = " AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR membership_no LIKE ? OR area_name LIKE ?)";
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
        assignedAreaId: enforcedAreaId,
      });
    }

    // ── 2. Enforce Ward Leader Scope ──────────────────────────────────
    if (scope === "ward" || callerRole === "ward_leader") {
      if (!userId) {
        return NextResponse.json({ success: false, message: "Unauthorized: Please log in." }, { status: 401 });
      }

      const isWardLeader = callerRole === "ward_leader" && callerWard;
      const isHigherAdmin = callerRole === "super_admin" || callerRole === "subcounty_admin";

      if (!isWardLeader && !isHigherAdmin) {
        return NextResponse.json({ success: false, message: "Forbidden: Ward Leader access required." }, { status: 403 });
      }

      let enforcedWard = isWardLeader ? callerWard : (ward || null);

      let countSql = "SELECT COUNT(*) AS total FROM members WHERE 1=1";
      let dataSql = `SELECT ${selectFields} FROM members WHERE 1=1`;
      const params: any[] = [];
      const countParams: any[] = [];

      if (enforcedWard && enforcedWard !== "all") {
        countSql += " AND ward = ?";
        dataSql += " AND ward = ?";
        countParams.push(enforcedWard);
        params.push(enforcedWard);
      }

      if (areaId && areaId !== "all") {
        countSql += " AND area_id = ?";
        dataSql += " AND area_id = ?";
        countParams.push(areaId);
        params.push(areaId);
      }

      if (status && status !== "all") {
        countSql += " AND status = ?";
        dataSql += " AND status = ?";
        countParams.push(status);
        params.push(status);
      }

      if (search && search.trim()) {
        const searchClause = " AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR membership_no LIKE ? OR area_name LIKE ? OR profession LIKE ?)";
        const term = `%${search.trim()}%`;
        countSql += searchClause;
        dataSql += searchClause;
        countParams.push(term, term, term, term, term, term);
        params.push(term, term, term, term, term, term);
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
        assignedWard: enforcedWard || "All Wards",
      });
    }

    // ── 3. Enforce Subcounty Admin Access Control ─────────────────────
    if (scope === "subcounty" || callerRole === "subcounty_admin") {
      if (!userId) {
        return NextResponse.json({ success: false, message: "Unauthorized: Please log in." }, { status: 401 });
      }

      if (callerRole !== "subcounty_admin" && callerRole !== "super_admin") {
        return NextResponse.json({ success: false, message: "Forbidden: Subcounty Leader access required." }, { status: 403 });
      }

      let enforcedZone = callerSubcountyZone;
      if (callerRole === "super_admin") {
        enforcedZone = subcounty || null;
      }

      let countSql = "SELECT COUNT(*) AS total FROM members WHERE 1=1";
      let dataSql = `SELECT ${selectFields} FROM members WHERE 1=1`;
      const params: any[] = [];
      const countParams: any[] = [];

      if (enforcedZone && enforcedZone !== "all") {
        const zoneClause = " AND (residential_zone = ? OR subcounty = ? OR sub_clan = ?)";
        countSql += zoneClause;
        dataSql += zoneClause;
        countParams.push(enforcedZone, enforcedZone, enforcedZone);
        params.push(enforcedZone, enforcedZone, enforcedZone);
      }

      if (ward && ward !== "all") {
        countSql += " AND ward = ?";
        dataSql += " AND ward = ?";
        countParams.push(ward);
        params.push(ward);
      }

      if (status && status !== "all") {
        countSql += " AND status = ?";
        dataSql += " AND status = ?";
        countParams.push(status);
        params.push(status);
      }

      if (search && search.trim()) {
        const searchClause = " AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR membership_no LIKE ? OR profession LIKE ? OR area_name LIKE ?)";
        const term = `%${search.trim()}%`;
        countSql += searchClause;
        dataSql += searchClause;
        countParams.push(term, term, term, term, term, term);
        params.push(term, term, term, term, term, term);
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

    // ── 4. Standard Query (Public Directory or Super Admin) ───────────
    let sql = `SELECT ${selectFields} FROM members WHERE 1=1`;
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
      sql += " AND (residential_zone = ? OR subcounty = ? OR sub_clan = ?)";
      countSql += " AND (residential_zone = ? OR subcounty = ? OR sub_clan = ?)";
      params.push(subcounty, subcounty, subcounty);
      countParams.push(subcounty, subcounty, subcounty);
    }

    if (ward && ward !== "all") {
      sql += " AND ward = ?";
      countSql += " AND ward = ?";
      params.push(ward);
      countParams.push(ward);
    }

    if (areaId && areaId !== "all") {
      sql += " AND area_id = ?";
      countSql += " AND area_id = ?";
      params.push(areaId);
      countParams.push(areaId);
    }

    if (status && status !== "all") {
      sql += " AND status = ?";
      countSql += " AND status = ?";
      params.push(status);
      countParams.push(status);
    }

    if (search && search.trim()) {
      sql += " AND (full_name LIKE ? OR profession LIKE ? OR residential_zone LIKE ? OR membership_no LIKE ? OR email LIKE ? OR phone LIKE ? OR area_name LIKE ?)";
      countSql += " AND (full_name LIKE ? OR profession LIKE ? OR residential_zone LIKE ? OR membership_no LIKE ? OR email LIKE ? OR phone LIKE ? OR area_name LIKE ?)";
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term, term, term);
      countParams.push(term, term, term, term, term, term, term);
    }

    const totalResult = await query<any>(countSql, countParams);
    const total = Number(totalResult[0]?.total || 0);

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
      assignedWard: callerWard,
      assignedAreaId: callerAreaId,
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
      county,
      subcounty,
      ward,
      areaId,
      areaName,
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
      `INSERT INTO members (clerk_id, full_name, email, phone, sub_clan, residential_zone, county, subcounty, ward, area_id, area_name, profession, field, membership_no, bio, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'member', 'Verified')`,
      [
        clerkId || null,
        fullName.trim(),
        email ? email.toLowerCase().trim() : null,
        phone.replace(/\s/g, ""),
        subClan,
        residentialZone || subcounty || "Mombasa",
        county || "Mombasa",
        subcounty || residentialZone || "Nyali",
        ward || null,
        areaId ? Number(areaId) : null,
        areaName || null,
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
    const {
      id,
      status,
      role,
      subClan,
      residentialZone,
      county,
      subcounty,
      ward,
      areaId,
      areaName,
      profession,
      subcountyAdminZone,
      wardLeaderWard,
      areaLeaderAreaId,
    } = body;

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
           county = COALESCE(?, county),
           subcounty = COALESCE(?, subcounty),
           ward = COALESCE(?, ward),
           area_id = COALESCE(?, area_id),
           area_name = COALESCE(?, area_name),
           profession = COALESCE(?, profession),
           subcounty_admin_zone = COALESCE(?, subcounty_admin_zone),
           ward_leader_ward = COALESCE(?, ward_leader_ward),
           area_leader_area_id = COALESCE(?, area_leader_area_id)
       WHERE id = ?`,
      [
        status,
        role,
        subClan,
        residentialZone,
        county,
        subcounty,
        ward,
        areaId,
        areaName,
        profession,
        subcountyAdminZone,
        wardLeaderWard,
        areaLeaderAreaId,
        id,
      ]
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
