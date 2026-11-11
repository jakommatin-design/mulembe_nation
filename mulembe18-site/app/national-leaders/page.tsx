import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { query, initDatabaseSchema } from "@/lib/db";
import { normalizeImageUrl } from "@/lib/image-utils";
import { Award, Users, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "National Leadership Council — Mulembe18 Kenya",
  description:
    "Meet the official National Leadership Committee and Council of Elders representing the 18 Luhya sub-communities across Kenya.",
};

const colorPalettes = [
  "bg-emerald-100/90 border-[#0D6E38] text-emerald-900",
  "bg-amber-100/90 border-[#DDA71D] text-amber-900",
  "bg-teal-100/90 border-teal-600 text-teal-900",
  "bg-emerald-100/90 border-[#0D6E38] text-emerald-900",
  "bg-purple-100/90 border-purple-500 text-purple-900",
  "bg-blue-100/90 border-[#0077B6] text-blue-900",
];

export default async function NationalLeadersPage() {
  await initDatabaseSchema();

  let leaders: any[] = [];
  try {
    const councilRows = await query<any>(
      `SELECT id, name, role, clan, bio, avatar_url, sort_order
       FROM leadership_members
       WHERE status = 'Active'
       ORDER BY sort_order ASC, id ASC`
    );

    const nationalMembers = await query<any>(
      `SELECT id, full_name AS name, 'National Leader' AS role, sub_clan AS clan, bio, avatar_url
       FROM members
       WHERE role = 'national_leader' AND status = 'Verified'
       ORDER BY id ASC`
    );

    leaders = [
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
  } catch (err) {
    console.warn("Failed to load national leaders:", err);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F2] text-[#18221B]">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-emerald-50/70 via-[#FBF8F2] to-white py-16 sm:py-24 border-b border-[#E6E0D5] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -translate-x-1/3" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#0D6E38]">
              <Award size={14} className="text-[#DDA71D]" />
              <span>Sovereign Governance</span>
            </div>

            <h1
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#18221B] tracking-tight leading-[1.15]"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              National Leadership <span className="text-[#0D6E38]">Council</span>
            </h1>

            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Serving the 18 Luhya sub-communities across Kenya. Dedicated to unity, transparent welfare protection, cultural identity preservation, and youth empowerment.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="px-6 py-2.5 rounded-full bg-[#0D6E38] hover:bg-[#0a4d29] text-white text-xs font-bold shadow-md transition-all inline-flex items-center gap-2"
              >
                <Users size={14} />
                <span>Join Mulembe18 Kenya</span>
              </Link>
              <Link
                href="/#about"
                className="px-5 py-2.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold transition-all shadow-xs"
              >
                <span>Learn About Our Clans</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Leaders Grid */}
        <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {leaders.map((leader, idx) => {
              const palette = colorPalettes[idx % colorPalettes.length];
              const initials = leader.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();

              return (
                <div
                  key={leader.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center text-center relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform" />

                  {/* Photo or Initials Avatar */}
                  <div className="relative mb-4">
                    {leader.avatar_url ? (
                      <img
                        src={leader.avatar_url}
                        alt={leader.name}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-md group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div
                        className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-md ${palette}`}
                        style={{ fontFamily: "var(--font-outfit)" }}
                      >
                        {initials}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs border-2 border-white">
                      <ShieldCheck size={14} />
                    </div>
                  </div>

                  {/* Name & Role */}
                  <div className="space-y-1 mb-3">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-[#0D6E38] transition-colors" style={{ fontFamily: "var(--font-outfit)" }}>
                      {leader.name}
                    </h3>
                    <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#0D6E38] text-xs font-extrabold uppercase tracking-wide">
                      {leader.role}
                    </div>
                  </div>

                  {/* Clan Badge */}
                  <div className="text-xs text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/80 font-medium mb-3">
                    Sub-Community: <span className="font-bold">{leader.clan}</span>
                  </div>

                  {/* Bio Description (if available) */}
                  {leader.bio ? (
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mt-1">
                      {leader.bio}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 italic mt-1">
                      Serving on the National Executive Council of Elders for Mulembe18 Kenya.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

