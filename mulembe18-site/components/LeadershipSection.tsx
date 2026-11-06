"use client";
import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { normalizeImageUrl } from "@/lib/image-utils";

export interface Leader {
  id?: number | string;
  name: string;
  role: string;
  clan: string;
  avatar_url?: string;
}

const colorPalettes = [
  "bg-emerald-100/90 border-[#0D6E38] text-emerald-900",
  "bg-amber-100/90 border-[#DDA71D] text-amber-900",
  "bg-teal-100/90 border-teal-600 text-teal-900",
  "bg-emerald-100/90 border-[#0D6E38] text-emerald-900",
  "bg-purple-100/90 border-purple-500 text-purple-900",
  "bg-blue-100/90 border-[#0077B6] text-blue-900",
];

export default function LeadershipSection() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leadership")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.leaders)) {
          setLeaders(
            data.leaders.map((l: any) => ({
              ...l,
              avatar_url: l.avatar_url ? normalizeImageUrl(l.avatar_url, "") : null,
            }))
          );
        }
      })
      .catch((err) => console.error("Error loading leadership:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="leadership" className="py-20 bg-[#FBF8F2] border-t border-[#E6E0D5] relative overflow-hidden" aria-labelledby="leadership-heading">
      {/* Background ambient accents */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-100/30 rounded-full blur-3xl pointer-events-none translate-x-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#0D6E38] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#0D6E38] animate-pulse" />
            <span style={{ fontFamily: "var(--font-kalam), cursive" }}>Governance &amp; Council</span>
          </div>

          <h2
            id="leadership-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#18221B] tracking-tight leading-[1.2]"
            style={{ fontFamily: "var(--font-kalam), var(--font-caveat), cursive" }}
          >
            <span>Executive </span>
            <span
              className="relative inline-block px-3.5 py-0.5 rounded-2xl bg-[#F6A623] text-[#1E252B] -rotate-1 font-extrabold shadow-xs my-1"
              style={{ borderRadius: "255px 25px 225px 25px/25px 225px 25px 255px" }}
            >
              Leadership Committee
            </span>
          </h2>

          {/* Cyan doodle underline */}
          <div className="flex justify-center -mt-1 mb-2">
            <svg
              className="w-56 h-3 pointer-events-none"
              style={{ height: "12px", width: "224px", maxHeight: "12px" }}
              viewBox="0 0 160 12"
              preserveAspectRatio="none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 4 8 Q 45 12 85 7 Q 125 3 156 9"
                stroke="#00AEEF"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-lg mx-auto">
            Dedicated servant leaders steering Mulembe18&apos;s community welfare, cultural preservation, and youth empowerment across Mombasa County.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-3 border-[#0D6E38] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-500 font-medium">Loading executive leadership from database...</p>
          </div>
        ) : leaders.length === 0 ? (
          <div className="py-12 text-center rounded-3xl bg-white border border-[#E6E0D5] p-8 max-w-md mx-auto space-y-2">
            <Users size={32} className="mx-auto text-gray-400" />
            <h4 className="font-bold text-sm text-gray-800">No Committee Members Listed</h4>
            <p className="text-xs text-gray-500">
              Elected officers added in the Secretariat admin console will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            {leaders.map((l, idx) => {
              const initials = l.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();
              const palette = colorPalettes[idx % colorPalettes.length];

              return (
                <div
                  key={l.id || l.name}
                  className="bg-white/90 backdrop-blur-sm p-4 rounded-3xl border border-[#E6E0D5] flex flex-col items-center hover:border-[#0D6E38]/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg group shadow-xs"
                >
                  {l.avatar_url ? (
                    <img
                      src={l.avatar_url}
                      alt={l.name}
                      className="w-16 h-16 mx-auto rounded-2xl object-cover mb-3 shadow-xs border-2 border-emerald-600 group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      className={`w-16 h-16 mx-auto rounded-2xl border-2 flex items-center justify-center font-extrabold text-xl mb-3 shadow-xs group-hover:scale-105 transition-transform duration-300 ${palette}`}
                      style={{ fontFamily: "var(--font-outfit)" }}
                    >
                      {initials}
                    </div>
                  )}
                  <h4 className="font-bold text-sm text-[#18221B] group-hover:text-[#0D6E38] transition-colors" style={{ fontFamily: "var(--font-outfit)" }}>
                    {l.name}
                  </h4>
                  <p className="text-[11px] font-semibold text-[#0D6E38] mt-0.5">{l.role}</p>
                  <span className="mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F7F4EE] text-gray-700 border border-[#E6E0D5]">
                    {l.clan} Clan
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
