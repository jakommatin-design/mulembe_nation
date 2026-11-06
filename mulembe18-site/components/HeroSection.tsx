"use client";
import { ArrowRight, Sparkles } from "lucide-react";
import Marquee from "@/components/magicui/marquee";

const clans = [
  { name: "Bukusu", region: "Bungoma" },
  { name: "Maragoli", region: "Vihiga" },
  { name: "Samia", region: "Busia" },
  { name: "Wanga", region: "Mumias" },
  { name: "Tiriki", region: "Hamisi" },
  { name: "Idakho", region: "Ikolomani" },
  { name: "Isukha", region: "Shinyalu" },
  { name: "Marama", region: "Butere" },
  { name: "Banyore", region: "Emuhaya" },
  { name: "Kabras", region: "Malava" },
  { name: "Batsotso", region: "Lurambi" },
  { name: "Tachoni", region: "Webuye" },
  { name: "Kisa", region: "Khwisero" },
  { name: "Marachi", region: "Butula" },
  { name: "Khayo", region: "Nambale" },
  { name: "Nyore", region: "Luanda" },
  { name: "Gisu", region: "Mt. Elgon" },
  { name: "Nandi-Luhya", region: "Borderlands" },
];

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative bg-white text-[#1E252B] pt-14 sm:pt-20 lg:pt-24 pb-20 sm:pb-28 overflow-hidden"
    >
      {/* ==============================================================
          LAYER 1 (BACKWARD): DIAGONAL "MULEMBE NI NGUVU" WATERMARK
          ============================================================== */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden z-[1] scale-110 transform -rotate-[14deg]"
      >
        {/* Upper diagonal banner */}
        <div
          className="text-[#DDA71D] opacity-[0.35] font-black whitespace-nowrap text-[7vw] sm:text-[9vw] tracking-wider leading-none select-none"
          style={{ fontFamily: "var(--font-caveat), var(--font-kalam), cursive" }}
        >
          Mulembe Ni Nguvu • Unity is Strength
        </div>

        {/* Center massive diagonal watermark */}
        <div
          className="text-[#0D6E38] opacity-[0.25] font-black uppercase whitespace-nowrap text-[9vw] sm:text-[11vw] tracking-[0.25em] leading-none my-1 select-none"
          style={{ fontFamily: "var(--font-outfit), sans-serif" }}
        >
          Mulembe 18
        </div>

        {/* Lower diagonal banner */}
        <div
          className="text-[#DDA71D] opacity-[0.30] font-black whitespace-nowrap text-[6vw] sm:text-[8vw] tracking-widest leading-none select-none"
          style={{ fontFamily: "var(--font-caveat), var(--font-kalam), cursive" }}
        >
          Unity Is Strength • Mulembe Ni Nguvu
        </div>
      </div>

      {/* ==============================================================
          LAYER 2 (FORWARD): VIVID ISUKUTI CULTURAL CELEBRATION PHOTO
          ============================================================== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
        <img
          src="/images/isukuti.jpg"
          alt="Luhya Isukuti Traditional Cultural Drums &amp; Dance"
          className="w-full h-full object-cover scale-105 filter blur-[3px] sm:blur-[4px] opacity-80 brightness-[1.03] contrast-[1.05]"
        />
        {/* Gentle translucent tint: keeps the photo clearly visible while giving headline text maximum contrast */}
        <div className="absolute inset-0 bg-white/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-[#FBF8F2]/80" />
      </div>

      {/* ==============================================================
          LAYER 3: AMBIENT COLOR ACCENTS
          ============================================================== */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none opacity-40 blur-3xl z-[3]"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 10%, rgba(246,166,35,0.35) 0%, rgba(13,110,56,0.20) 50%, transparent 80%)",
        }}
      />

      {/* ==============================================================
          MAIN HERO CONTENT — ODOO INSPIRED PLAYFUL & BOLD TYPOGRAPHY
          ============================================================== */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">

        {/* Grand Headline: Odoo-style expressive handwriting with highlighter marker */}
        <h1
          className="text-4xl sm:text-6xl md:text-7xl lg:text-[84px] font-bold text-[#1E252B] tracking-tight leading-[1.12] sm:leading-[1.15] max-w-5xl mx-auto select-none"
          style={{ fontFamily: "var(--font-kalam), var(--font-caveat), cursive" }}
        >
          <span>One community on </span>
          <span className="relative inline-block mx-1 sm:mx-2 px-3 sm:px-5 py-0.5 sm:py-1 transform -rotate-1 group">
            {/* Odoo Warm Amber Highlighter Brush Background */}
            <span
              className="absolute inset-0 bg-[#F6A623] shadow-sm transform -rotate-1 rounded-2xl sm:rounded-3xl pointer-events-none"
              style={{
                borderRadius: "255px 25px 225px 25px/25px 225px 25px 255px",
              }}
            />
            <span className="relative z-10 text-[#1E252B] font-extrabold whitespace-nowrap">
              one platform.
            </span>
          </span>
          <br className="hidden sm:inline" />
          <span className="block mt-2 sm:mt-4">
            <span>Many Roots, </span>
            <span className="relative inline-block whitespace-nowrap">
              <span className="text-[#0D6E38]">Stronger Together!</span>
              {/* Odoo Hand-drawn Cyan / Blue Marker Doodle Underline */}
              <svg
                className="absolute -bottom-2 sm:-bottom-3 left-0 w-full pointer-events-none"
                style={{ height: "14px", width: "100%", maxHeight: "14px" }}
                viewBox="0 0 240 18"
                preserveAspectRatio="none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M 6 11 Q 65 17 125 10 Q 185 4 234 13"
                  stroke="#00AEEF"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d="M 16 13 Q 75 7 135 12 Q 195 16 228 10"
                  stroke="#38BDF8"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              </svg>
            </span>
          </span>
        </h1>

        {/* Script Accent: Mulembe Ni Nguvu Badge with whimsical hand-drawn feel */}
        <div className="mt-6 sm:mt-8 flex items-center justify-center gap-3">
          <div className="h-0.5 w-10 sm:w-16 bg-gradient-to-r from-transparent to-[#DDA71D]" />
          <span
            className="text-2xl sm:text-3xl text-[#DDA71D] font-bold tracking-wide"
            style={{ fontFamily: "var(--font-kalam), var(--font-caveat), cursive" }}
          >
            Mulembe Ni Nguvu — Unity is Strength
          </span>
          <div className="h-0.5 w-10 sm:w-16 bg-gradient-to-l from-transparent to-[#DDA71D]" />
        </div>

        {/* Mission Description */}
        <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mt-4 sm:mt-5 leading-relaxed font-normal">
          Uniting Luhya professionals, business leaders, families, students, and elders residing across
          Mombasa County through cultural preservation, transparent mutual welfare assistance,
          and coastal socio-economic solidarity.
        </p>

        {/* CTAs in Odoo Minimalist Pill Style */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-7 sm:pt-9 relative">
          <a
            href="#register"
            className="group relative inline-flex items-center gap-2.5 px-8 py-3.5 sm:px-9 sm:py-4 rounded-full bg-[#0D6E38] hover:bg-[#09522a] text-white font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
          >
            <span>Join Our Community</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </a>



          {/* Hand-drawn whimsical arrow pointing toward CTA */}
          <div className="hidden lg:block absolute -right-2 top-2 pointer-events-none select-none text-gray-400">
            <svg width="65" height="50" viewBox="0 0 65 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 5 5 C 25 2 55 10 45 35 M 45 35 L 36 28 M 45 35 L 53 26"
                stroke="#6B7280"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="text-xs text-gray-500 font-bold -ml-3"
              style={{ fontFamily: "var(--font-kalam), cursive" }}
            >
              Get started!
            </span>
          </div>
        </div>

        {/* Marquee Banner of all 18 Sub-Communities */}
        <div className="mt-14 sm:mt-16 pt-7 border-t border-gray-200">
          <div className="text-center mb-3.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
              The 18 Luhya Sub-Communities United at the Coast
            </span>
          </div>
          <Marquee pauseOnHover className="[--duration:32s] py-1.5">
            {clans.map((c) => (
              <div
                key={c.name}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 hover:border-[#0D6E38] hover:text-[#0D6E38] hover:bg-emerald-50/60 transition-colors cursor-default whitespace-nowrap shadow-xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#F6A623]" />
                <span>{c.name}</span>
                <span className="text-[10px] text-gray-400 font-normal">({c.region})</span>
              </div>
            ))}
          </Marquee>
        </div>
      </div>

      {/* Coastal Ocean Wave Divider transitioning gracefully to About Section */}
      <div className="hero-wave mt-10">
        <svg viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none" className="block w-full h-12 sm:h-16">
          <path d="M0,30 C320,90 480,15 800,60 C1120,105 1320,40 1440,55 L1440,120 L0,120 Z" fill="#FBF8F2" />
        </svg>
      </div>
    </section>
  );
}
