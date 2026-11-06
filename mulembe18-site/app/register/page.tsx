"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Lock,
  User,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

const clans = [
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
  "Nandi-Luhya",
];

const subcounties = [
  "Nyali",
  "Bamburi",
  "Mombasa Island (Mvita)",
  "Likoni Channel",
  "Changamwe",
  "Kisauni",
  "Mtwapa North",
  "Jomvu",
];

export default function RegisterPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded, user } = useUser();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    subcounty: "Nyali",
    subClan: "Bukusu",
    profession: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<null | {
    membershipNo: string;
    fullName: string;
    subcounty: string;
    subClan: string;
  }>(null);

  // Password strength checker
  const passwordStrength = useMemo(() => {
    const pw = form.password;
    if (!pw) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    if (score <= 1) return { score, label: "Weak", color: "bg-rose-500" };
    if (score <= 2) return { score, label: "Fair", color: "bg-amber-500" };
    if (score === 3) return { score, label: "Good", color: "bg-blue-500" };
    return { score, label: "Strong", color: "bg-emerald-500" };
  }, [form.password]);

  // Client-side validator
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      newErrors.fullName = "Please provide your full legal or preferred name (at least 2 characters).";
    }

    if (!form.email && !form.phone) {
      newErrors.contact = "Either an email address or mobile phone number is required.";
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address (e.g., name@domain.com).";
    }

    if (form.phone) {
      const cleanPhone = form.phone.replace(/\s+/g, "");
      if (!/^(\+?254|0)[17]\d{8}$/.test(cleanPhone)) {
        newErrors.phone = "Enter a valid Kenyan mobile number (e.g., 0712 345678 or +254 712 345678).";
      }
    }

    if (!form.password) {
      newErrors.password = "A secure password is required.";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
    } else if (!/[A-Z]/.test(form.password)) {
      newErrors.password = "Password must contain at least one uppercase letter (A-Z).";
    } else if (!/[0-9]/.test(form.password)) {
      newErrors.password = "Password must contain at least one numeric digit (0-9).";
    }

    if (form.password && form.confirmPassword !== form.password) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (!form.subcounty) {
      newErrors.subcounty = "Please select your subcounty / coastal residential zone.";
    }

    if (!form.subClan) {
      newErrors.subClan = "Please select your ancestral Luhya sub-community.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          confirmPassword: form.confirmPassword,
          residentialZone: form.subcounty,
          subClan: form.subClan,
          profession: form.profession || "Community Member",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ form: data.message || "Registration encountered an issue. Please try again." });
        }
        return;
      }

      setRegistrationSuccess({
        membershipNo: data.membershipNo,
        fullName: form.fullName,
        subcounty: form.subcounty,
        subClan: form.subClan,
      });
    } catch (err: any) {
      setErrors({ form: err.message || "Network error. Please verify your connection." });
    } finally {
      setLoading(false);
    }
  };

  // If already logged in
  if (isLoaded && isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-emerald-100 p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center text-[#0D6E38]">
            <CheckCircle2 size={36} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#18221B]" style={{ fontFamily: "var(--font-outfit)" }}>
              Already Logged In!
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              You are currently signed in as <span className="font-bold text-[#0D6E38]">{user?.fullName || user?.primaryEmailAddress?.emailAddress}</span>.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-full bg-[#0D6E38] hover:bg-[#09522a] text-white font-bold text-sm shadow-md transition-all"
            >
              <span>Go to Member Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Registration Success Card
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-gray-50 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-emerald-200/80 p-6 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-44 h-44 bg-emerald-100/60 rounded-full blur-2xl pointer-events-none" />

          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-[#0D6E38] mx-auto shadow-inner">
            <Sparkles size={34} />
          </div>

          <div className="text-center space-y-2">
            <span className="inline-block px-3 py-1 bg-emerald-100 text-[#0D6E38] rounded-full text-xs font-black uppercase tracking-wider">
              Registration Successful
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#18221B]" style={{ fontFamily: "var(--font-outfit)" }}>
              Mulembe, {registrationSuccess.fullName}!
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Your member registry profile has been created and indexed under the Mombasa Coastal Chapter.
            </p>
          </div>

          {/* Membership Badge Card */}
          <div className="bg-gradient-to-br from-[#0D6E38] to-[#084523] text-white rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-600/60 pb-3">
              <div>
                <div className="text-[10px] text-emerald-200 uppercase font-semibold">Official Membership ID</div>
                <div className="text-xl sm:text-2xl font-mono font-black text-[#DDA71D]">{registrationSuccess.membershipNo}</div>
              </div>
              <ShieldCheck size={32} className="text-[#DDA71D]" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-emerald-200 block">Subcounty Chapter</span>
                <span className="font-bold text-white">{registrationSuccess.subcounty}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 block">Sub-Clan</span>
                <span className="font-bold text-white">{registrationSuccess.subClan}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <SignInButton mode="modal">
              <button className="w-full py-4 rounded-full bg-[#0D6E38] hover:bg-[#09522a] text-white font-black text-sm shadow-md hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer">
                <span>Sign In to Access Dashboard</span>
                <ArrowRight size={16} />
              </button>
            </SignInButton>

            <Link
              href="/"
              className="w-full py-3 rounded-full text-center block text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#0D6E38] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Mulembe18 Home</span>
          </Link>
        </div>

        {/* Card Header */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#0D6E38] via-[#09522a] to-[#043419] p-6 sm:p-8 text-white relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Users size={20} className="text-[#DDA71D]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
                  Join Mulembe18 Coastal Chapter
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/90">
                  Register your membership across the 18 Luhya sub-communities in Mombasa.
                </p>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5" noValidate>
            {errors.form && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-rose-500" />
                <span>{errors.form}</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. Wycliffe Wafula Barasa"
                  className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-xs sm:text-sm bg-gray-50/50 focus:bg-white transition-all outline-hidden ${
                    errors.fullName ? "border-rose-300 focus:border-rose-500 ring-2 ring-rose-100" : "border-gray-200 focus:border-[#0D6E38] focus:ring-2 focus:ring-emerald-100"
                  }`}
                />
              </div>
              {errors.fullName && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.fullName}</p>}
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Email Address <span className="text-gray-400 font-normal">(Optional if phone given)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@domain.com"
                    className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-xs sm:text-sm bg-gray-50/50 focus:bg-white transition-all outline-hidden ${
                      errors.email ? "border-rose-300 focus:border-rose-500 ring-2 ring-rose-100" : "border-gray-200 focus:border-[#0D6E38] focus:ring-2 focus:ring-emerald-100"
                    }`}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Mobile Phone <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone size={16} />
                  </div>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0712 345678"
                    className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-xs sm:text-sm bg-gray-50/50 focus:bg-white transition-all outline-hidden ${
                      errors.phone ? "border-rose-300 focus:border-rose-500 ring-2 ring-rose-100" : "border-gray-200 focus:border-[#0D6E38] focus:ring-2 focus:ring-emerald-100"
                    }`}
                  />
                </div>
                {errors.phone && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.phone}</p>}
              </div>
            </div>
            {errors.contact && <p className="text-[11px] text-rose-600 font-medium">{errors.contact}</p>}

            {/* Subcounty & Sub-Clan Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Subcounty / Coastal Zone <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <MapPin size={16} />
                  </div>
                  <select
                    value={form.subcounty}
                    onChange={(e) => setForm({ ...form, subcounty: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-gray-200 text-xs sm:text-sm bg-gray-50/50 focus:bg-white focus:border-[#0D6E38] focus:ring-2 focus:ring-emerald-100 transition-all outline-hidden"
                  >
                    {subcounties.map((sc) => (
                      <option key={sc} value={sc}>
                        {sc}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.subcounty && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.subcounty}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Luhya Sub-Community / Clan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Users size={16} />
                  </div>
                  <select
                    value={form.subClan}
                    onChange={(e) => setForm({ ...form, subClan: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-gray-200 text-xs sm:text-sm bg-gray-50/50 focus:bg-white focus:border-[#0D6E38] focus:ring-2 focus:ring-emerald-100 transition-all outline-hidden"
                  >
                    {clans.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.subClan && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.subClan}</p>}
              </div>
            </div>

            {/* Profession / Occupation */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Profession / Occupation <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Briefcase size={16} />
                </div>
                <input
                  type="text"
                  value={form.profession}
                  onChange={(e) => setForm({ ...form, profession: e.target.value })}
                  placeholder="e.g. Electrical Engineer, Maritime Officer, Teacher, Business"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-gray-200 text-xs sm:text-sm bg-gray-50/50 focus:bg-white focus:border-[#0D6E38] focus:ring-2 focus:ring-emerald-100 transition-all outline-hidden"
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border text-xs sm:text-sm bg-gray-50/50 focus:bg-white transition-all outline-hidden ${
                      errors.password ? "border-rose-300 focus:border-rose-500 ring-2 ring-rose-100" : "border-gray-200 focus:border-[#0D6E38] focus:ring-2 focus:ring-emerald-100"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500">{passwordStrength.label}</span>
                  </div>
                )}
                {errors.password && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Repeat password"
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border text-xs sm:text-sm bg-gray-50/50 focus:bg-white transition-all outline-hidden ${
                      errors.confirmPassword ? "border-rose-300 focus:border-rose-500 ring-2 ring-rose-100" : "border-gray-200 focus:border-[#0D6E38] focus:ring-2 focus:ring-emerald-100"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-full bg-[#0D6E38] hover:bg-[#09522a] disabled:bg-gray-400 text-white font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Membership...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Community Registration</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>

            <div className="pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500">
                Already registered with Mulembe18?{" "}
                <SignInButton mode="modal">
                  <button type="button" className="font-bold text-[#0D6E38] hover:underline cursor-pointer">
                    Sign in to your account
                  </button>
                </SignInButton>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

