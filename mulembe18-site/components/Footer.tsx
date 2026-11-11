"use client";
import { useState } from "react";
import { MapPin, Phone, Mail, Clock, CheckCircle2 } from "lucide-react";

const quickLinks = [
  { href: "#about", label: "About Mulembe18" },
  { href: "/national-leaders", label: "National Leaders" },
  { href: "#events", label: "Events & Cultural Day" },
  { href: "#contributions", label: "Welfare & Bereavement" },
  { href: "#news", label: "News & Communiqués" },
  { href: "#leadership", label: "Leadership Council" },
  { href: "#gallery", label: "Gallery & Moments" },
];

const subCommunities = [
  "Bukusu", "Maragoli", "Samia", "Wanga", "Tiriki", "Idakho",
  "Isukha", "Marama", "Banyore", "Kabras", "Batsotso", "Tachoni",
  "Kisa", "Marachi", "Khayo", "Nyore", "Gisu", "Nandi",
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubscribed(true);
  };

  return (
    <footer id="contact" className="bg-[#082f1a] text-white pt-16 pb-12 overflow-hidden relative" aria-label="Site Footer">
      {/* Kitenge watermark background exactly as used in the Direct Dispatch card */}
      <div className="absolute inset-0 kitenge-watermark opacity-15 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Newsletter Row */}
        <div className="pb-12 border-b border-emerald-800/60 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 flex items-center gap-4 flex-wrap">
            <div
              className="text-3xl sm:text-4xl text-[#DDA71D] font-bold tracking-wider"
              style={{ fontFamily: "var(--font-caveat)" }}
            >
              Mulembe Ni Nguvu
            </div>
          </div>
          <div className="lg:col-span-7 flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3 w-full">
            <div>
              <p className="text-xs font-semibold text-emerald-200">Subscribe to Our Newsletter</p>
              <p className="text-xs text-emerald-400">Get the latest updates, events and community news.</p>
            </div>
            {subscribed ? (
              <div className="px-4 py-2 bg-emerald-800 border border-emerald-700 rounded-lg text-xs text-emerald-200 font-semibold flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Thank you for subscribing!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex w-full sm:w-auto gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="px-4 py-2 text-xs rounded-lg bg-emerald-950/60 border border-emerald-700 text-white placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-[#DDA71D] w-full sm:w-60"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#DDA71D] hover:bg-[#F5C842] text-[#082f1a] text-xs font-bold transition-colors whitespace-nowrap shadow-sm"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Main Footer Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 py-12 border-b border-emerald-800/60">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-[#DDA71D]/60 flex items-center justify-center p-0.5 overflow-hidden shadow-md">
                <img
                  src="/images/logo.png"
                  alt="Mulembe18 Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white" style={{ fontFamily: "var(--font-outfit)" }}>
                  mulembe<span className="text-[#DDA71D]">18</span>
                </span>
                <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Kenya Chapter</div>
              </div>
            </div>
            <p className="text-xs text-emerald-200/80 leading-relaxed max-w-sm">
              Mulembe18 is the unifying welfare and cultural association for Luhya community members resident across Kenya.
            </p>
            {/* Socials */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href="#"
                aria-label="Facebook"
                className="w-8 h-8 rounded-full bg-emerald-900 hover:bg-[#DDA71D] hover:text-[#082f1a] flex items-center justify-center text-emerald-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="X / Twitter"
                className="w-8 h-8 rounded-full bg-emerald-900 hover:bg-[#DDA71D] hover:text-[#082f1a] flex items-center justify-center text-emerald-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="w-8 h-8 rounded-full bg-emerald-900 hover:bg-[#DDA71D] hover:text-[#082f1a] flex items-center justify-center text-emerald-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="w-8 h-8 rounded-full bg-emerald-900 hover:bg-[#DDA71D] hover:text-[#082f1a] flex items-center justify-center text-emerald-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="WhatsApp"
                className="w-8 h-8 rounded-full bg-emerald-900 hover:bg-[#00A859] hover:text-white flex items-center justify-center text-emerald-300 transition-colors text-sm font-bold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.11.547 4.094 1.505 5.816L0 24l6.347-1.48A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.003-1.368l-.36-.213-3.763.877.895-3.664-.234-.376A9.818 9.818 0 1112 21.818z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-bold text-sm text-[#DDA71D] uppercase tracking-wider" style={{ fontFamily: "var(--font-outfit)" }}>Quick Links</h4>
            <ul className="space-y-2 text-xs text-emerald-200/80">
              {quickLinks.map(({ href, label }) => (
                <li key={href}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
              ))}
            </ul>
          </div>

          {/* 18 Sub-Communities */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-bold text-sm text-[#DDA71D] uppercase tracking-wider" style={{ fontFamily: "var(--font-outfit)" }}>18 Sub-Communities</h4>
            <div className="grid grid-cols-2 gap-1 text-xs text-emerald-200/80">
              {subCommunities.map((s) => (
                <span key={s}>• {s}</span>
              ))}
            </div>
          </div>

          {/* Secretariat */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-bold text-sm text-[#DDA71D] uppercase tracking-wider" style={{ fontFamily: "var(--font-outfit)" }}>Secretariat Office</h4>
            <div className="space-y-2.5 text-xs text-emerald-200/80">
              <p className="flex items-center gap-2.5">
                <Phone size={13} className="text-[#DDA71D] flex-shrink-0" />
                <span>+254 712 345 678 / +254 733 123 456</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail size={13} className="text-[#DDA71D] flex-shrink-0" />
                <span>info@mulembe18.org</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Clock size={13} className="text-[#DDA71D] flex-shrink-0" />
                <span>Mon – Fri: 8:30 AM – 5:00 PM</span>
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-300/60 gap-4">
          <p>© 2025 Mulembe18 Community Welfare Association (Kenya Chapter). All Rights Reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-white transition-colors">Constitution &amp; By-Laws</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Member Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
