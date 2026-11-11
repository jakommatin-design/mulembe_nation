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
    let callerCounty: string | null = null;
    let callerSubcountyZone: string | null = null;
    let callerWard: string | null = null;
    let callerAreaId: number | null = null;
    let callerMember: any = null;

    if (userId) {
      let callerRows = await query<any>(
        "SELECT id, full_name, email, role, county, county_leader_county, subcounty_admin_zone, ward_leader_ward, area_leader_area_id FROM members WHERE clerk_id = ? LIMIT 1",
        [userId]
      );

      // If not linked yet, check via Clerk email
      if (callerRows.length === 0) {
        const clerkUser = await currentUser();
        const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
        if (userEmail) {
          callerRows = await query<any>(
            "SELECT id, full_name, email, role, county, county_leader_county, subcounty_admin_zone, ward_leader_ward, area_leader_area_id FROM members WHERE email = ? LIMIT 1",
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
        callerCounty = callerRows[0].county_leader_county || callerRows[0].county || "Mombasa";
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
      county, county_leader_county, subcounty, ward, area_id, area_name,
      profession, membership_no, role, subcounty_admin_zone,
      ward_leader_ward, area_leader_area_id, status, created_at, avatar_url, bio
    `;

    // ── 0. Fetch Current Caller Profile (scope=me) ───────────────────
    if (scope === "me") {
      if (!userId || !callerMember) {
        return NextResponse.json({ success: false, message: "Unauthorized or unlinked member profile." }, { status: 401 });
      }
      return NextResponse.json({
        success: true,
        member: callerMember,
      });
    }

    // ── 1. Enforce Area Leader Scope ──────────────────────────────────
    if (scope === "area" || callerRole === "area_leader") {
      if (!userId) {
        return NextResponse.json({ success: false, message: "Unauthorized: Please log in." }, { status: 401 });
      }

      const isAreaLeader = callerRole === "area_leader" && callerAreaId;
      const isWardLeader = callerRole === "ward_leader";
      const isHigherAdmin = callerRole === "national_leader" || callerRole === "super_admin" || callerRole === "subcounty_admin";

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
      const isHigherAdmin = callerRole === "national_leader" || callerRole === "super_admin" || callerRole === "subcounty_admin";

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

      if (callerRole !== "subcounty_admin" && callerRole !== "super_admin" && callerRole !== "national_leader") {
        return NextResponse.json({ success: false, message: "Forbidden: Subcounty Leader access required." }, { status: 403 });
      }

      let enforcedZone = callerSubcountyZone;
      if (callerRole === "super_admin" || callerRole === "national_leader") {
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

    // ── 3.5 Enforce County Leader Scope ────────────────────────────────
    if (scope === "county" || callerRole === "county_leader") {
      if (!userId) {
        return NextResponse.json({ success: false, message: "Unauthorized: Please log in." }, { status: 401 });
      }

      const isCountyLeader = callerRole === "county_leader";
      const isHigherAdmin = callerRole === "national_leader" || callerRole === "super_admin";

      if (!isCountyLeader && !isHigherAdmin) {
        return NextResponse.json({ success: false, message: "Forbidden: County Leader access required." }, { status: 403 });
      }

      let enforcedCounty = isCountyLeader ? callerCounty : (county || "all");

      let countSql = "SELECT COUNT(*) AS total FROM members WHERE 1=1";
      let dataSql = `SELECT ${selectFields} FROM members WHERE 1=1`;
      const params: any[] = [];
      const countParams: any[] = [];

      if (enforcedCounty && enforcedCounty !== "all") {
        countSql += " AND county = ?";
        dataSql += " AND county = ?";
        countParams.push(enforcedCounty);
        params.push(enforcedCounty);
      }

      if (subcounty && subcounty !== "all") {
        countSql += " AND (subcounty = ? OR residential_zone = ?)";
        dataSql += " AND (subcounty = ? OR residential_zone = ?)";
        countParams.push(subcounty, subcounty);
        params.push(subcounty, subcounty);
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
        assignedCounty: enforcedCounty || "All Counties",
      });
    }

    // ── 4. Standard Query (Leaders Only Access) ──────────────────────
    const isLeader = [
      "area_leader",
      "ward_leader",
      "subcounty_admin",
      "county_leader",
      "super_admin",
      "national_leader",
    ].includes(callerRole);

    if (!isLeader) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: The Member Directory is reserved for leadership only.",
        },
        { status: 403 }
      );
    }

    let sql = `SELECT ${selectFields} FROM members WHERE 1=1`;
    let countSql = "SELECT COUNT(*) AS total FROM members WHERE 1=1";
    const params: any[] = [];
    const countParams: any[] = [];

    if (county && county !== "all") {
      sql += " AND county = ?";
      countSql += " AND county = ?";
      params.push(county);
      countParams.push(county);
    }

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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized: Please log in." }, { status: 401 });
    }

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

    let callerRows = await query<any>(
      "SELECT id, full_name, email, role, county, county_leader_county, subcounty_admin_zone, ward_leader_ward, area_leader_area_id FROM members WHERE clerk_id = ? LIMIT 1",
      [userId]
    );

    if (callerRows.length === 0) {
      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
      if (email) {
        callerRows = await query<any>(
          "SELECT id, full_name, email, role, county, county_leader_county, subcounty_admin_zone, ward_leader_ward, area_leader_area_id FROM members WHERE email = ? LIMIT 1",
          [email.toLowerCase().trim()]
        );
      }
    }

    const callerRole = callerRows[0]?.role || "member";
    const callerCounty = callerRows[0]?.county_leader_county || callerRows[0]?.county || "Mombasa";
    const callerSubcounty = callerRows[0]?.subcounty_admin_zone;
    const callerWard = callerRows[0]?.ward_leader_ward;
    const callerAreaId = callerRows[0]?.area_leader_area_id ? Number(callerRows[0].area_leader_area_id) : null;

    if (callerRole === "member") {
      return NextResponse.json({ success: false, message: "Forbidden: Leadership permissions required to update member status." }, { status: 403 });
    }

    // Verify target member is within jurisdiction if not national / super_admin
    if (callerRole !== "national_leader" && callerRole !== "super_admin") {
      const target = await query<any>("SELECT id, county, subcounty, ward, area_id FROM members WHERE id = ? LIMIT 1", [id]);
      if (target.length === 0) return NextResponse.json({ success: false, message: "Target member not found." }, { status: 404 });
      const t = target[0];

      if (callerRole === "county_leader" && t.county && t.county.toLowerCase() !== callerCounty.toLowerCase()) {
        return NextResponse.json({ success: false, message: "Forbidden: Member is outside your county." }, { status: 403 });
      }
      if (callerRole === "subcounty_admin" && t.subcounty && callerSubcounty && t.subcounty.toLowerCase() !== callerSubcounty.toLowerCase()) {
        return NextResponse.json({ success: false, message: "Forbidden: Member is outside your subcounty." }, { status: 403 });
      }
      if (callerRole === "ward_leader" && t.ward && callerWard && t.ward.toLowerCase() !== callerWard.toLowerCase()) {
        return NextResponse.json({ success: false, message: "Forbidden: Member is outside your ward." }, { status: 403 });
      }
      if (callerRole === "area_leader" && callerAreaId && Number(t.area_id) !== callerAreaId) {
        return NextResponse.json({ success: false, message: "Forbidden: Member is outside your area." }, { status: 403 });
      }
    }

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
