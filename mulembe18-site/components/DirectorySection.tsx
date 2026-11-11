"use client";
import { useState, useEffect } from "react";
import { Search, ChevronRight, X, Phone, Mail, MapPin, ShieldCheck, Users, UserPlus } from "lucide-react";
import Link from "next/link";

interface Member {
  id?: number;
  initials?: string;
  name: string;
  clan: string;
  area: string;
  profession: string;
  field: string;
  joined: string;
  status: string;
  phone?: string;
  email?: string;
  bio?: string;
  bg?: string;
  text?: string;
}

const clansList = [
  "All",
  "Bukusu",
  "Maragoli",
  "Samia",
  "Wanga",
  "Tiriki",
  "Idakho",
  "Isukha",
  "Marama",
  "Banyore",
  "Kabras",
  "Batsotso",
  "Tachoni",
  "Kisa",
  "Marachi",
  "Khayo",
  "Nyore",
  "Gisu",
];

export default function DirectorySection() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedClan, setSelectedClan] = useState("All");
  const [activeMember, setActiveMember] = useState<Member | null>(null);

  useEffect(() => {
    async function loadMembers() {
      try {
        setLoading(true);
        const res = await fetch("/api/members");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.members)) {
            const mapped: Member[] = data.members.map((m: any) => {
              const initials = (m.full_name || "M")
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();
              return {
                id: m.id,
                initials,
                name: m.full_name,
                clan: m.sub_clan,
                area: m.residential_zone,
                profession: m.profession || "Community Member",
                field: m.field || "General",
                joined: m.created_at ? new Date(m.created_at).getFullYear().toString() : "2025",
                status: m.status || "Verified",
                phone: m.phone,
                email: m.email,
                bio: m.bio || "Active registered member of the Mulembe18 Coastal Chapter.",
                bg: "bg-emerald-100/90 border-[#DDA71D]",
                text: "text-emerald-800",
              };
            });
            setMembers(mapped);
          }
        }
      } catch (err) {
        console.warn("Failed to load members from database", err);
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, []);

  const filtered = members.filter((m) => {
    const matchesClan = selectedClan === "All" || m.clan.toLowerCase() === selectedClan.toLowerCase();
    const matchesSearch = [m.name, m.clan, m.area, m.profession, m.field].some((v) =>
      v?.toLowerCase().includes(query.toLowerCase())
    );
    return matchesClan && matchesSearch;
  });

  return (
    <section id="directory" className="py-16 bg-white relative overflow-hidden" aria-labelledby="directory-heading">
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-[#E6E0D5]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D6E38] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Community Registry
            </span>
            <h2
              id="directory-heading"
              className="text-3xl sm:text-4xl font-extrabold text-[#18221B] mt-2 tracking-tight"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Member Directory
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Registered and verified Luhya members residing across Kenya.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#0D6E38] text-xs font-bold">
              {loading ? "Checking database..." : `${members.length} Registered Members`}
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl mb-8 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="relative lg:col-span-5">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, profession, clan, or area..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/90 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#0D6E38] focus:border-[#0D6E38] outline-none transition"
              />
            </div>

            {/* Clan quick tabs */}
            <div className="lg:col-span-7 flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {clansList.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedClan(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    selectedClan === c
                      ? "bg-[#0D6E38] text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/60 animate-pulse space-y-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* Members Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((m) => (
              <div
                key={m.id || m.name}
                className="glass-card rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-gray-200"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-base font-extrabold shadow-sm ${m.bg} ${m.text}`}
                      style={{ fontFamily: "var(--font-outfit)" }}
                    >
                      {m.initials}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#0D6E38]">
                      {m.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-[#18221B] text-base mt-3" style={{ fontFamily: "var(--font-outfit)" }}>
                    {m.name}
                  </h3>

                  <div className="text-xs font-semibold text-[#0D6E38] flex items-center gap-1.5 mt-1">
                    <span>Clan: {m.clan}</span>
                    <span className="text-gray-300">•</span>
                    <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      <MapPin size={11} />
                      <span>{m.area}</span>
                    </span>
                  </div>

                  <div className="mt-2.5 text-xs text-gray-600 flex items-center gap-1.5 flex-wrap">
                    <span className="bg-gray-100 rounded-md px-2 py-0.5 text-gray-800 font-semibold text-[11px]">
                      {m.field}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-700">{m.profession}</span>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 font-medium">Joined {m.joined}</span>
                  <button
                    onClick={() => setActiveMember(m)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0D6E38] hover:text-[#0a4d29] transition-colors"
                  >
                    View Details <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-16 bg-gray-50/80 rounded-2xl border border-dashed border-gray-300 p-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0D6E38] flex items-center justify-center mx-auto mb-3">
                  <Users size={24} />
                </div>
                <p className="text-base font-bold text-gray-800">
                  {query || selectedClan !== "All"
                    ? "No members match this specific filter"
                    : "No registered members listed yet"}
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  {query || selectedClan !== "All"
                    ? "Try resetting your search filters or selecting another clan category."
                    : "New registrations from the member portal appear automatically once authenticated."}
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                  {(query || selectedClan !== "All") && (
                    <button
                      onClick={() => {
                        setQuery("");
                        setSelectedClan("All");
                      }}
                      className="px-4 py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-colors"
                    >
                      Reset Filters
                    </button>
                  )}
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 rounded-full bg-[#0D6E38] hover:bg-[#0a4d29] text-white text-xs font-bold transition-colors shadow-sm inline-flex items-center gap-1.5"
                  >
                    <UserPlus size={14} />
                    <span>Open Member Portal</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Support Banner */}
        <div className="mt-10 p-5 rounded-2xl bg-amber-50/80 border border-[#DDA71D]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-2xl bg-[#DDA71D]/20 text-[#DDA71D] flex items-center justify-center font-bold text-lg flex-shrink-0">
              <Users size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#18221B]">Mulembe Unity — Sub-Community Coordinator</p>
              <p className="text-xs text-gray-600">Need to update your clan directory record or verify your membership status?</p>
            </div>
          </div>
          <a
            href="/#contact"
            className="px-4 py-2 rounded-full bg-[#0D6E38] hover:bg-[#0a4d29] text-white text-xs font-bold transition-colors whitespace-nowrap shadow-sm"
          >
            Contact Secretariat
          </a>
        </div>
      </div>

      {/* Member Profile Modal */}
      {activeMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-white/50 relative space-y-4">
            <button
              onClick={() => setActiveMember(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-lg font-extrabold shadow-sm ${activeMember.bg} ${activeMember.text}`}
              >
                {activeMember.initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#18221B]" style={{ fontFamily: "var(--font-outfit)" }}>
                    {activeMember.name}
                  </h3>
                  <ShieldCheck size={16} className="text-[#0D6E38]" />
                </div>
                <p className="text-xs text-emerald-800 font-semibold">
                  Sub-tribe: {activeMember.clan} • {activeMember.area}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 text-xs text-gray-700 leading-relaxed">
              {activeMember.bio}
            </div>

            <div className="space-y-2 text-xs text-gray-600">
              <p className="flex items-center gap-2">
                <MapPin size={13} className="text-[#0D6E38]" />
                <span>Residence Zone: {activeMember.area}, Mombasa County</span>
              </p>
              {activeMember.phone && (
                <p className="flex items-center gap-2">
                  <Phone size={13} className="text-[#0D6E38]" />
                  <span>Contact: {activeMember.phone}</span>
                </p>
              )}
              {activeMember.email && (
                <p className="flex items-center gap-2">
                  <Mail size={13} className="text-[#0D6E38]" />
                  <span>Email: {activeMember.email}</span>
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setActiveMember(null)}
                className="w-full py-2.5 rounded-xl bg-[#0D6E38] hover:bg-[#0a4d29] text-white text-xs font-bold shadow-md transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
