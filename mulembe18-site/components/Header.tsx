"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";

const navLinks = [
  { href: "/#home", label: "Home" },
  { href: "/#about", label: "About" },
  { href: "/#events", label: "Events" },
  { href: "/#contributions", label: "Welfare" },
  { href: "/#news", label: "News" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/#leadership", label: "Leadership" },
  { href: "/national-leaders", label: "National Leaders" },
  { href: "/#contact", label: "Contact" },
];

export default function Header() {
  const { isSignedIn, isLoaded } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("section[id], footer[id]");
      let current = "home";
      sections.forEach((s) => {
        const rect = s.getBoundingClientRect();
        if (rect.top <= 120) current = s.id;
      });
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = () => setMenuOpen(false);

  return (
    <>
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <a href="#home" className="flex items-center gap-3 group flex-shrink-0" aria-label="Mulembe18 Home">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-50 border-2 border-[#0D6E38]/30 flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform shadow-xs">
                <img
                  src="/images/logo.png"
                  alt="Mulembe18 Kenya Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline">
                  <span className="text-xl font-extrabold tracking-tight text-[#18221B]" style={{ fontFamily: "var(--font-outfit)" }}>mulembe</span>
                  <span className="text-xl font-black text-[#0D6E38]" style={{ fontFamily: "var(--font-outfit)" }}>18</span>
                </div>
              </div>
            </a>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs xl:text-sm font-semibold text-gray-600" aria-label="Main Navigation">
              {navLinks.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className={`px-2 xl:px-3 py-1.5 xl:py-2 rounded-lg transition-colors hover:text-[#0D6E38] whitespace-nowrap ${activeSection === href.replace("#", "") ? "text-[#0D6E38] font-bold" : ""
                    }`}
                >
                  {label}
                </a>
              ))}
            </nav>

            {/* CTAs */}
            <div className="flex items-center gap-2 xl:gap-3 flex-shrink-0">
              {!isLoaded ? (
                <div className="h-8 w-24 rounded-full bg-gray-200 animate-pulse" />
              ) : isSignedIn ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-[#0D6E38] hover:bg-[#09522a] rounded-full transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                  >
                    <span>Member Portal</span>
                  </Link>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8 border-2 border-[#0D6E38]/40",
                      },
                    }}
                  />
                </div>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <button className="px-2.5 xl:px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:text-[#0D6E38] transition-colors whitespace-nowrap cursor-pointer">
                      Sign in
                    </button>
                  </SignInButton>
                  <Link
                    href="/register"
                    className="px-3.5 xl:px-4 py-2 bg-[#0D6E38] hover:bg-[#09522a] text-white font-bold text-xs rounded-full shadow-xs hover:shadow-md transition-all transform hover:-translate-y-0.5 whitespace-nowrap flex-shrink-0"
                  >
                    Join Community
                  </Link>
                </>
              )}

              {/* Hamburger */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-700 hover:text-[#0D6E38] transition-colors ml-1"
                aria-label={menuOpen ? "Close Menu" : "Open Menu"}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown */}
          <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? "max-h-[600px] opacity-100 visible" : "max-h-0 opacity-0 invisible"}`}>
            <nav className="border-t border-gray-200 pb-4 pt-3 flex flex-col gap-1 bg-white" aria-label="Mobile Navigation">
              {navLinks.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  onClick={handleNavClick}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#0D6E38] rounded-lg transition-colors"
                >
                  {label}
                </a>
              ))}
              <div className="flex items-center gap-2 pt-2 px-4">
                {isSignedIn ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={handleNavClick}
                      className="flex-1 py-2 text-sm font-bold text-center text-[#0D6E38] border border-[#0D6E38]/30 rounded-full hover:bg-emerald-50 transition-colors"
                    >
                      Member Portal
                    </Link>
                    <UserButton />
                  </>
                ) : (
                  <>
                    <SignInButton mode="modal">
                      <button
                        onClick={handleNavClick}
                        className="flex-1 py-2 text-sm font-semibold text-center text-gray-700 border border-gray-300 rounded-full hover:border-[#0D6E38] transition-colors cursor-pointer"
                      >
                        Sign In
                      </button>
                    </SignInButton>
                    <Link
                      href="/register"
                      onClick={handleNavClick}
                      className="flex-1 py-2 text-sm font-bold text-center text-white bg-[#0D6E38] rounded-full hover:bg-[#09522a] transition-colors shadow-xs"
                    >
                      Join Now
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}

function MulembeLogo() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="46" fill="#0D6E38" />
      <path d="M50 18 A 20 20 0 0 1 70 38 L 30 38 A 20 20 0 0 1 50 18 Z" fill="#DDA71D" />
      <circle cx="50" cy="38" r="8" fill="#ffffff" />
      <path d="M22 62 C 35 52, 65 52, 78 62 C 68 76, 32 76, 22 62 Z" fill="#DDA71D" />
      <path d="M15 78 C 35 70, 65 70, 85 78 C 75 90, 25 90, 15 78 Z" fill="#0077B6" />
      <circle cx="36" cy="46" r="5" fill="#fff" />
      <circle cx="64" cy="46" r="5" fill="#fff" />
    </svg>
  );
}
