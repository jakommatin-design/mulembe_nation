import { NextResponse } from "next/server";
import { query, initDatabaseSchema } from "@/lib/db";
import { normalizeImageUrl } from "@/lib/image-utils";

/**
 * Public endpoint for National Leadership visibility
 * STRICT PRIVACY: Omits phone numbers and email addresses.
 */
export async function GET() {
  try {
    await initDatabaseSchema();

    // 1. Fetch leaders from leadership_members table (Executive Council)
    const councilRows = await query<any>(
      `SELECT id, name, role, clan, bio, avatar_url, sort_order
       FROM leadership_members
       WHERE status = 'Active'
       ORDER BY sort_order ASC, id ASC`
    );

    // 2. Fetch national leaders from members table (role = 'national_leader')
    const nationalMembers = await query<any>(
      `SELECT id, full_name AS name, 'National Leader' AS role, sub_clan AS clan, bio, avatar_url
       FROM members
       WHERE role = 'national_leader' AND status = 'Verified'
       ORDER BY id ASC`
    );

    const combined = [
      ...councilRows.map((l: any) => ({
        id: `council-${l.id}`,
        name: l.name,
        role: l.role,
        clan: l.clan,
        bio: l.bio || null,
        avatar_url: l.avatar_url ? normalizeImageUrl(l.avatar_url, "") : null,
      })),
      ...nationalMembers.map((m: any) => ({
        id: `member-${m.id}`,
        name: m.name,
        role: "National Council Member",
        clan: m.clan,
        bio: m.bio || null,
        avatar_url: m.avatar_url ? normalizeImageUrl(m.avatar_url, "") : null,
      })),
    ];

    return NextResponse.json({
      success: true,
      leaders: combined,
    });
  } catch (error: any) {
    console.error("[National Leaders API] Error:", error?.message || error);
    return NextResponse.json(
      { success: false, leaders: [], error: error?.message || "Failed to load national leaders." },
      { status: 500 }
    );
  }
}

