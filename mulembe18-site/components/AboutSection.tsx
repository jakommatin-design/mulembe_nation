"use client";
import { useState } from "react";
import {
  ArrowRight,
  Users,
  ShieldCheck,
  TrendingUp,
  Landmark,
  MapPin,
  Check,
  Sparkles,
  HeartHandshake,
  Music,
  Flame,
  CheckCircle2,
  X,
  CreditCard,
  QrCode,
  Shield,
  Phone,
  Mail,
  User,
} from "lucide-react";
import { BorderBeam } from "@/components/magicui/border-beam";

const luhyaClans = [
  "Bukusu",
  "Maragoli (AvaLogoli)",
  "Wanga",
  "Banyore (Abanyole)",
  "Idakho",
  "Isukha",
  "Samia",
  "Tachoni",
  "Kabras",
  "Tiriki",
  "Kisa",
  "Marama",
  "Tsotso",
  "Khayo",
  "Marachi",
  "Abanyala",
  "Batsotso",
  "Batura",
];

const coastalZones = [
  "Nyali",
  "Bamburi",
  "Mombasa Island",
  "Likoni Channel",
  "Changamwe",
  "Kisauni",
  "Mtwapa North",
  "Jomvu",
];

const corePillars = [
  {
    icon: Users,
    title: "Unity",
    subtitle: "Our Strength",
    description: "Uniting all 18 Luhya sub-communities under one sovereign, peaceful brotherhood.",
    accent: "bg-emerald-50 text-[#0D6E38] border-emerald-200",
  },
  {
    icon: Landmark,
    title: "Culture",
    subtitle: "Our Identity",
    description: "Preserving vibrant Isukuti rhythms, mother dialects, culinary heritage, and elder folklore.",
    accent: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    icon: ShieldCheck,
    title: "Support",
    subtitle: "Our Mission",
    description: "Immediate bereavement repatriation cover and medical transit ensuring no one mourns alone.",
    accent: "bg-emerald-50 text-[#0D6E38] border-emerald-200",
  },
  {
    icon: TrendingUp,
    title: "Growth",
    subtitle: "Our Future",
    description: "Professional networking, youth mentorship, maritime skills training, and clan enterprise.",
    accent: "bg-blue-50 text-blue-800 border-blue-200",
  },
];

export default function AboutSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [registeredMemberId, setRegisteredMemberId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    subClan: "Bukusu",
    residentialZone: "Nyali",
    profession: "",
    bio: "",
  });

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        setRegisteredMemberId(data.membershipNo || "M18-2025");
        setSubmitSuccess(true);
      } else {
        setErrorMessage(data.message || "Registration failed. Please check details.");
      }
    } catch (err: any) {
      setErrorMessage("Network error: " + (err?.message || "Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitSuccess(false);
    setRegisteredMemberId("");
    setErrorMessage("");
    setForm({
      fullName: "",
      phone: "",
      email: "",
      subClan: "Bukusu",
      residentialZone: "Nyali",
      profession: "",
      bio: "",
    });
    setModalOpen(false);
  };

  return (
    <section id="about" className="py-20 lg:py-28 bg-[#FBF8F2] relative overflow-hidden" aria-labelledby="about-heading">
      {/* Background ambient accents */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -translate-x-1/2" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl pointer-events-none translate-x-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2
            id="about-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#18221B] tracking-tight leading-[1.2]"
            style={{ fontFamily: "var(--font-kalam), var(--font-caveat), cursive" }}
          >
            <span>Our </span>
            <span className="relative inline-block">
              <span>Shared Roots</span>
              <svg
                className="absolute -bottom-2 left-0 w-full pointer-events-none"
                style={{ height: "10px", width: "100%", maxHeight: "10px" }}
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
            </span>
            <span> &amp; </span>
            <span
              className="relative inline-block px-4 py-1 -rotate-1 rounded-2xl bg-[#F6A623] text-[#1E252B] font-extrabold shadow-xs"
              style={{ borderRadius: "255px 25px 225px 25px/25px 225px 25px 255px" }}
            >
              Coast Journey
            </span>
          </h2>

          <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            <strong>mulembe18</strong> was founded as the premier umbrella body unifying all 18 Luhya sub-communities residing, working, and flourishing across Mombasa County. We provide a cultural haven, an unbroken welfare safety net, and an empowered diaspora ecosystem.
          </p>
        </div>

        {/* The Two Flagship Visual Feature Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

          {/* Card 1: Luhya Isukuti Dancers & Cultural Heritage */}
          <div className="glass-card-dark rounded-3xl overflow-hidden shadow-2xl relative border border-white/20 flex flex-col justify-between group min-h-[480px]">
            {/* Background Image: Isukuti Dancers */}
            <div className="absolute inset-0 z-0">
              <img
                src="/images/isukuti-dancers.jpg"
                alt="Luhya Isukuti Dancers Performing"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-90"
              />
              {/* Rich Emerald Gradient Overlay for supreme legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#082f1a] via-[#082f1a]/85 to-black/40" />
            </div>

            <BorderBeam size={200} duration={14} colorFrom="#DDA71D" colorTo="#0D6E38" />

            {/* Top Badges */}
            <div className="p-6 sm:p-8 relative z-10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-emerald-200 backdrop-blur-sm border border-white/10">
                  <span>18 Sub-Communities</span>
                </span>
              </div>
            </div>

            {/* Bottom Content */}
            <div className="p-6 sm:p-8 relative z-10 space-y-4 text-white">
              <h3 className="text-2xl sm:text-3xl font-extrabold leading-snug tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
                Bridging Western Kenya to Mombasa
              </h3>

              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-xl">
                Preserving the living customs, authentic drumbeats, vibrant dances, and indigenous dialects of all 18 Luhya sub-communities flourishing in Coastal Kenya. We connect respected clan elders with youth born in the diaspora so their ancestral roots remain evergreen.
              </p>

              {/* Location & Enclave Chips */}
            </div>
          </div>

          {/* Card 2: Luhya Bullfighting & Welfare Solidarity */}
          <div className="glass-card-dark rounded-3xl overflow-hidden shadow-2xl relative border border-white/20 flex flex-col justify-between group min-h-[480px]">
            {/* Background Image: Bullfighting Tradition */}
            <div className="absolute inset-0 z-0">
              <img
                src="/images/luhya-bullfighting.jpg"
                alt="Traditional Luhya Bullfighting Spectacle"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-90"
              />
              {/* Rich Emerald Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#082f1a] via-[#082f1a]/85 to-black/40" />
            </div>

            <BorderBeam size={200} duration={14} colorFrom="#00AEEF" colorTo="#DDA71D" />

            {/* Bottom Content */}
            <div className="p-6 sm:p-8 relative z-10 space-y-4 text-white">
              <h3 className="text-2xl sm:text-3xl font-extrabold leading-snug tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
                The Spirit of Strength, Kinship &amp; Mutual Protection
              </h3>

              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-xl">
                Just as traditional bullfighting exemplifies strength, courage, and collective pride, our community channels this energy into mutual protection. We guarantee 24-hour emergency bereavement transit to Western Kenya, hospitalization relief, and verified social solidarity.
              </p>

              {/* Welfare Protection Chips */}
              <div className="pt-2 flex flex-wrap gap-2">
                {[
                  "Bereavement Repatriation",
                  "Hospital Distress Fund",
                  "Elder Council Guidance",
                ].map((w) => (
                  <span
                    key={w}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-emerald-200 border border-white/15 backdrop-blur-md"
                  >
                    <Check size={11} className="text-[#DDA71D]" />
                    <span>{w}</span>
                  </span>
                ))}
              </div>
              {/* Top Badges */}
              <div className="p-6 sm:p-8 relative z-10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#00A859] text-white shadow-md">
                    <Flame size={12} />
                    <span>Unbroken Solidarity</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-emerald-200 backdrop-blur-sm border border-white/10">
                    <span>Welfare Shield</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 4 Core Pillars Strip (Clean, Uncluttered, Horizontal Layout) */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-[#18221B]" style={{ fontFamily: "var(--font-outfit)" }}>
              The Four Pillars of Mulembe18
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Guiding our collective growth, identity, and care across the Kenyan Coast.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {corePillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-[#E6E0D5] hover:border-[#0D6E38]/50 transition-all duration-300 hover:-translate-y-1 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs ${pillar.accent}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-[#18221B]" style={{ fontFamily: "var(--font-outfit)" }}>
                        {pillar.title}
                      </h4>
                      <span className="text-[11px] text-gray-500 font-semibold">{pillar.subtitle}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Membership Call to Action & Registration Initiation Card */}
        <div
          id="register"
          className="rounded-3xl p-6 sm:py-8 sm:px-10 text-white relative overflow-hidden border border-white/20 shadow-2xl bg-[#082f1a]"
        >
          {/* Background Image with Cultural Isukuti Drums - Made clearly visible */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <img
              src="/images/isukuti.jpg"
              onError={(e) => {
                e.currentTarget.src = "https://aipate.com/wp-content/uploads/2017/10/isukuti1.jpg";
              }}
              alt="Luhya Isukuti Drummers and Dancers"
              className="w-full h-full object-cover object-[center_35%] scale-105 filter brightness-105 contrast-105"
            />
            {/* Gradient overlay: dark on left for text legibility, translucent on right so drums are clearly visible */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#031b0e]/92 via-[#062b16]/75 to-[#082f1a]/35" />
          </div>

          <BorderBeam size={240} duration={16} colorFrom="#DDA71D" colorTo="#00A859" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
            <div className="lg:col-span-8 space-y-2.5">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight" style={{ fontFamily: "var(--font-outfit)" }}>
                Become a Verified Mulembe18 Member Today
              </h3>

              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-2xl">
                Gain your official Digital Membership Card, activate your emergency bereavement safety net cover, connect with verified members across all 18 sub-communities, and access community gatherings.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#DDA71D] flex-shrink-0" />
                  <span>Immediate Bereavement &amp; Medical Net</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#DDA71D] flex-shrink-0" />
                  <span>Verified Member ID &amp; Directory Profile</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#DDA71D] flex-shrink-0" />
                  <span>Discounted Passes to Annual Cultural Festival</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#DDA71D] flex-shrink-0" />
                  <span>Luhya Business &amp; Maritime Mentorship</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-center">
              <button
                onClick={() => setModalOpen(true)}
                className="w-full sm:w-auto px-7 py-3 sm:px-8 sm:py-3.5 rounded-full bg-[#DDA71D] hover:bg-[#F5C842] text-[#082f1a] font-extrabold text-xs sm:text-sm shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-2 group whitespace-nowrap"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                <span>Register as Member</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ==============================================================
          NEW MEMBER REGISTRATION MODAL FORM
          ============================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="glass-card bg-white max-w-xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/60 relative my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Close Button */}
            <button
              onClick={resetForm}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              aria-label="Close registration form"
            >
              <X size={16} />
            </button>

            {submitSuccess ? (
              /* Success / Membership ID Card Preview */
              <div className="text-center py-6 space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-[#0D6E38] shadow-sm">
                  <CheckCircle2 size={36} />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#0D6E38] uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Registration Approved
                  </span>
                  <h3 className="text-2xl font-black text-[#18221B]" style={{ fontFamily: "var(--font-outfit)" }}>
                    Welcome to Mulembe18!
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
                    Your membership details have been entered into the official Mombasa Chapter Registry and verified under your clan desk.
                  </p>
                </div>

                {/* Digital Card Preview */}
                <div className="glass-card-dark rounded-2xl p-6 text-white text-left relative overflow-hidden border border-white/20 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-white" style={{ fontFamily: "var(--font-outfit)" }}>
                        mulembe<span className="text-[#DDA71D]">18</span>
                      </span>
                      <span className="text-[9px] uppercase tracking-widest text-emerald-300 block">
                        Digital Membership Pass
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00A859] text-white">
                      Verified Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-emerald-300/80 uppercase">Member Name</span>
                      <div className="font-bold text-white text-sm truncate">{form.fullName}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-300/80 uppercase">Sub-Community</span>
                      <div className="font-bold text-[#DDA71D] truncate">{form.subClan}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-300/80 uppercase">Member Number</span>
                      <div className="font-mono font-bold text-emerald-200">{registeredMemberId}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-300/80 uppercase">Zone / Branch</span>
                      <div className="font-semibold text-white">{form.residentialZone}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <a
                    href="/dashboard"
                    className="px-6 py-2.5 rounded-full bg-[#0D6E38] hover:bg-[#0a4d29] text-white text-xs font-bold shadow-md transition-colors"
                  >
                    Go to Member Hub
                  </a>
                  <button
                    onClick={resetForm}
                    className="px-5 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* The Registration Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0D6E38] uppercase tracking-wider">
                    <User size={13} />
                    <span>New Member Enrollment</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#18221B]" style={{ fontFamily: "var(--font-outfit)" }}>
                    Register for Mulembe18 Membership
                  </h3>
                  <p className="text-xs text-gray-500">
                    Connect with your sub-community elders and secure your family's welfare safety net.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Full Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      placeholder="e.g. Godfrey Wanyonyi Shikuku"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0D6E38]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">
                        Mobile / M-Pesa Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="e.g. 0712 345 678"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0D6E38]"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">Email Address</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="e.g. godfrey@gmail.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0D6E38]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">
                        Luhya Sub-Community (Clan) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={form.subClan}
                        onChange={(e) => setForm({ ...form, subClan: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0D6E38]"
                      >
                        {luhyaClans.map((clan) => (
                          <option key={clan} value={clan}>
                            {clan}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">
                        Residential Zone in Coast <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={form.residentialZone}
                        onChange={(e) => setForm({ ...form, residentialZone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0D6E38]"
                      >
                        {coastalZones.map((zone) => (
                          <option key={zone} value={zone}>
                            {zone}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Profession / Occupation</label>
                    <input
                      type="text"
                      value={form.profession}
                      onChange={(e) => setForm({ ...form, profession: e.target.value })}
                      placeholder="e.g. Maritime Logistics Officer / Business Owner / Teacher"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0D6E38]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Brief Bio or Village of Origin</label>
                    <textarea
                      rows={2}
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      placeholder="e.g. Native of Kimilili, Bungoma; resident in Nyali, Mombasa since 2018."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0D6E38]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-[#0D6E38] hover:bg-[#0a4d29] text-white font-bold text-xs sm:text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting Registration to Clan Desk...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-gray-400 text-center mt-2">
                    By registering, you agree to uphold the peaceful solidarity principles of the Mulembe Constitution.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
