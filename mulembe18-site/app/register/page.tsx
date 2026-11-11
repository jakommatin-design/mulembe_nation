"use client";

import { useState, useMemo, useEffect } from "react";
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
  Building2,
  Compass,
} from "lucide-react";
import { getCounties, getSubcounties, getWards, KENYA_COUNTIES, isValidCounty } from "@/lib/locations";

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
  "Badura",
  "Banyala Ba Ndombi",
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
    county: "Mombasa",
    subcounty: "Nyali",
    ward: "Frere Town",
    areaId: "",
    areaName: "",
    subClan: "Bukusu",
    profession: "",
  });

  const [availableAreas, setAvailableAreas] = useState<any[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);

  // Available subcounties for selected county
  const availableSubcounties = useMemo(() => {
    return getSubcounties(form.county);
  }, [form.county]);

  // Available wards for selected subcounty
  const availableWards = useMemo(() => {
    return getWards(form.subcounty, form.county);
  }, [form.subcounty, form.county]);

  // Whenever county changes, reset subcounty and ward
  const handleCountyChange = (newCounty: string) => {
    const subcounties = getSubcounties(newCounty);
    const firstSub = subcounties[0] || "";
    const wards = getWards(firstSub, newCounty);
    const firstWard = wards[0] || "";
    setForm((prev) => ({
      ...prev,
      county: newCounty,
      subcounty: firstSub,
      ward: firstWard,
      areaId: "",
      areaName: "",
    }));
  };

  // Whenever subcounty changes, reset ward to the first ward in that subcounty
  const handleSubcountyChange = (newSubcounty: string) => {
    const wards = getWards(newSubcounty, form.county);
    const newWard = wards[0] || "";
    setForm((prev) => ({
      ...prev,
      subcounty: newSubcounty,
      ward: newWard,
      areaId: "",
      areaName: "",
    }));
  };

  // Whenever ward changes, fetch uploaded areas in that ward
  useEffect(() => {
    if (!form.ward) {
      setAvailableAreas([]);
      return;
    }

    let isMounted = true;
    setLoadingAreas(true);

    fetch(`/api/areas?ward=${encodeURIComponent(form.ward)}&activeOnly=true`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.success && Array.isArray(data.areas)) {
            setAvailableAreas(data.areas);
          } else {
            setAvailableAreas([]);
          }
        }
      })
      .catch(() => {
        if (isMounted) setAvailableAreas([]);
      })
      .finally(() => {
        if (isMounted) setLoadingAreas(false);
      });

    return () => {
      isMounted = false;
    };
  }, [form.ward]);

  // Prefill when Clerk user is already authenticated
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: prev.email || user.primaryEmailAddress?.emailAddress || "",
        phone: prev.phone || user.primaryPhoneNumber?.phoneNumber || "",
      }));
    }
  }, [isLoaded, isSignedIn, user]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<null | {
    membershipNo: string;
    fullName: string;
    county: string;
    subcounty: string;
    ward: string;
    areaName: string;
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
      newErrors.fullName = "Please provide your full legal name (at least 2 characters).";
    }

    if (!form.email && !form.phone) {
      newErrors.contact = "Either an email address or mobile phone number is required.";
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (form.phone) {
      const cleanPhone = form.phone.replace(/\s+/g, "");
      if (!/^(\+?254|0)[17]\d{8}$/.test(cleanPhone)) {
        newErrors.phone = "Enter a valid Kenyan mobile number (e.g. 0712 345678).";
      }
    }

    // Only validate password if user is not already logged in with Clerk
    if (!isSignedIn) {
      if (!form.password) {
        newErrors.password = "A password is required for your account login.";
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
    }

    if (!form.county || !isValidCounty(form.county)) {
      newErrors.county = "Please select a valid Kenyan county.";
    }

    if (!form.subcounty) {
      newErrors.subcounty = "Please provide your subcounty.";
    }

    if (!form.ward) {
      newErrors.ward = "Please provide your ward.";
    }

    if (!form.subClan) {
      newErrors.subClan = "Please select your ancestral Luhya sub-community / clan.";
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
      const selectedAreaObj = availableAreas.find((a) => String(a.id) === String(form.areaId));

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          confirmPassword: form.confirmPassword,
          county: form.county,
          subcounty: form.subcounty,
          residentialZone: form.subcounty,
          ward: form.ward,
          areaId: form.areaId ? Number(form.areaId) : null,
          areaName: selectedAreaObj ? selectedAreaObj.name : (form.areaName || null),
          subClan: form.subClan,
          profession: form.profession || "Community Member",
          clerkId: user?.id || undefined,
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
        county: form.county,
        subcounty: form.subcounty,
        ward: form.ward,
        areaName: selectedAreaObj ? selectedAreaObj.name : "Unassigned (Select later)",
        subClan: form.subClan,
      });
    } catch (err: any) {
      setErrors({ form: err.message || "Network error. Please verify your connection." });
    } finally {
      setLoading(false);
    }
  };

  // Registration Success Card
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-gray-50 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-emerald-200/80 p-6 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-44 h-44 bg-emerald-100/60 rounded-full blur-2xl pointer-events-none" />

          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-[#0D6E38] mx-auto shadow-inner">
            <Sparkles size={34} />
          </div>

          <div className="text-center space-y-2">
            <span className="inline-block px-3 py-1 bg-emerald-100 text-[#0D6E38] rounded-full text-xs font-black uppercase tracking-wider">
              Registration Complete
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#18221B]" style={{ fontFamily: "var(--font-outfit)" }}>
              Mulembe, {registrationSuccess.fullName}!
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Your member profile has been registered and placed into the {registrationSuccess.ward} Ward community registry.
            </p>
          </div>

          {/* Membership Badge Card with Hierarchy */}
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
                <span className="text-[10px] text-emerald-200 block">Sub-Clan</span>
                <span className="font-bold text-white">{registrationSuccess.subClan}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 block">Subcounty</span>
                <span className="font-bold text-white">{registrationSuccess.subcounty}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 block">Ward Jurisdiction</span>
                <span className="font-bold text-white">{registrationSuccess.ward}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 block">Designated Area</span>
                <span className="font-bold text-emerald-100">{registrationSuccess.areaName}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {isSignedIn ? (
              <Link
                href="/dashboard"
                className="w-full py-4 rounded-full bg-[#0D6E38] hover:bg-[#09522a] text-white font-black text-sm shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <span>Go to Member Dashboard</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <SignInButton mode="modal">
                <button className="w-full py-4 rounded-full bg-[#0D6E38] hover:bg-[#09522a] text-white font-black text-sm shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <span>Sign In with Your New Account</span>
                  <ArrowRight size={16} />
                </button>
              </SignInButton>
            )}

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
                  Join Mulembe18 Kenya Chapter
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/90">
                  Register your clan affiliation and residential location (County &gt; Subcounty &gt; Ward &gt; Area).
                </p>
              </div>
            </div>
          </div>

          {/* Form Body - Mandatory Community & Location Affiliation */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5" noValidate>
            {errors.form && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-rose-500" />
                <span>{errors.form}</span>
              </div>
            )}

            {isSignedIn && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-[#0D6E38] font-bold">
                <CheckCircle2 size={16} />
                <span>Signed in as {user?.primaryEmailAddress?.emailAddress}</span>
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
                  Email Address <span className="text-rose-500">*</span>
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
                    disabled={Boolean(isSignedIn && user?.primaryEmailAddress?.emailAddress)}
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

            {/* LOCATION HIERARCHY: County > Subcounty > Ward > Area */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 border border-gray-200/90 space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-200/60">
                <Compass size={16} className="text-[#0D6E38]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-gray-700">
                  Residential Location Hierarchy
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* County */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    County <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Building2 size={15} />
                    </div>
                    <select
                      value={form.county}
                      onChange={(e) => handleCountyChange(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs bg-white focus:border-[#0D6E38] focus:ring-2 focus:ring-emerald-100 transition-all outline-hidden font-semibold ${
                        errors.county ? "border-rose-300 ring-2 ring-rose-100" : "border-gray-200"
                      }`}
                    >
                      <option value="">Select County (All 47 Counties)</option>
                      {KENYA_COUNTIES.map((c) => (
                        <option key={c} value={c}>
                          {c} County
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.county && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.county}</p>}
                </div>

                {/* Subcounty */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Subcounty <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <MapPin size={15} />
                    </div>
                    {availableSubcounties.length > 0 ? (
                      <select
                        value={form.subcounty}
                        onChange={(e) => handleSubcountyChange(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs bg-white focus:border-[#0D6E38] focus:ring-2 focus:ring-emerald-100 transition-all outline-hidden font-semibold ${
                          errors.subcounty ? "border-rose-300 ring-2 ring-rose-100" : "border-gray-200"
                        }`}
                      >
                        {availableSubcounties.map((sc) => (
                          <option key={sc} value={sc}>
                            {sc} Subcounty
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.subcounty}
                        onChange={(e) => handleSubcountyChange(e.target.value)}
                        placeholder="e.g. Subcounty / Constituency"
                        className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs bg-white focus:border-[#0D6E38] focus:ring-2 focus:ring-emerald-100 transition-all outline-hidden font-semibold ${
                          errors.subcounty ? "border-rose-300 ring-2 ring-rose-100" : "border-gray-200"
                        }`}
                      />
                    )}
                  </div>
                  {errors.subcounty && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.subcounty}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ward */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Ward <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Compass size={15} />
                    </div>
                    {availableWards.length > 0 ? (
                      <select
                        value={form.ward}
                        onChange={(e) => setForm({ ...form, ward: e.target.value, areaId: "", areaName: "" })}
                        className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs bg-white focus:border-[#0D6E38] focus:ring-2 focus:ring-emerald-100 transition-all outline-hidden font-semibold ${
                          errors.ward ? "border-rose-300 ring-2 ring-rose-100" : "border-gray-200"
                        }`}
                      >
                        {availableWards.map((w) => (
                          <option key={w} value={w}>
                            {w} Ward
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.ward}
                        onChange={(e) => setForm({ ...form, ward: e.target.value, areaId: "", areaName: "" })}
                        placeholder="e.g. Ward"
                        className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs bg-white focus:border-[#0D6E38] focus:ring-2 focus:ring-emerald-100 transition-all outline-hidden font-semibold ${
                          errors.ward ? "border-rose-300 ring-2 ring-rose-100" : "border-gray-200"
                        }`}
                      />
                    )}
                  </div>
                  {errors.ward && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.ward}</p>}
                </div>

                {/* Area (Dynamic / Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-gray-600">
                      Local Area / Estate <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    {loadingAreas && <span className="text-[10px] text-emerald-600 animate-pulse font-medium">Checking areas...</span>}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <MapPin size={15} />
                    </div>
                    <select
                      value={form.areaId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const match = availableAreas.find((a) => String(a.id) === selectedId);
                        setForm({
                          ...form,
                          areaId: selectedId,
                          areaName: match ? match.name : "",
                        });
                      }}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white focus:border-[#0D6E38] focus:ring-2 focus:ring-emerald-100 transition-all outline-hidden"
                    >
                      {availableAreas.length === 0 ? (
                        <option value="">Areas not yet available (register anyway)</option>
                      ) : (
                        <>
                          <option value="">Select your area (or choose later)</option>
                          {availableAreas.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Areas are designated by Ward Leaders. You can select or update your area anytime from your Member Dashboard.
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-Clan & Profession */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-gray-200 text-xs sm:text-sm bg-gray-50/50 focus:bg-white focus:border-[#0D6E38] focus:ring-2 focus:ring-emerald-100 transition-all outline-hidden font-semibold"
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
                    placeholder="e.g. Electrical Engineer, Teacher, Business"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-gray-200 text-xs sm:text-sm bg-gray-50/50 focus:bg-white focus:border-[#0D6E38] focus:ring-2 focus:ring-emerald-100 transition-all outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Password & Confirm Password (only shown if NOT already logged into Clerk) */}
            {!isSignedIn && (
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
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-full bg-[#0D6E38] hover:bg-[#09522a] disabled:bg-gray-400 text-white font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating & Linking Account...</span>
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
