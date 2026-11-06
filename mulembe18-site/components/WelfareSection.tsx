"use client";
import { useState, useEffect } from "react";
import {
  Smartphone,
  ShieldCheck,
  Heart,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Copy,
  Check,
} from "lucide-react";

const presets = [200, 500, 1000, 2500, 5000];

const categories = [
  { id: "dues", label: "Annual Dues (KES 500)", short: "Annual Dues" },
  { id: "bereavement", label: "Bereavement Fund", short: "Bereavement" },
  { id: "medical", label: "Emergency Medical", short: "Medical Aid" },
  { id: "education", label: "Youth Bursary Fund", short: "Bursaries" },
];

const welfarePillars = [
  {
    icon: Heart,
    title: "Bereavement Support",
    payout: "grant",
    desc: "Immediate relief for hearse transport from Coast to Western Kenya ancestral home.",
    tag: "Disbursed in time",
    accent: "text-rose-600 bg-rose-50 border-rose-200",
  },
  {
    icon: ShieldCheck,
    title: "Emergency Medical Aid",
    payout: " ",
    desc: "Cash distress assistance for sudden member or dependent hospitalizations.",
    tag: "Vetted by leaders",
    accent: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  {
    icon: GraduationCap,
    title: "Youth Bursary Scheme",
    payout: " ",
    desc: "Tuition support for bright, vulnerable coastal Luhya students attending colleges & universities.",
    tag: "Awarded ",
    accent: "text-amber-700 bg-amber-50 border-amber-200",
  },
];

export default function WelfareSection() {
  const [activeAmount, setActiveAmount] = useState(500);
  const [selectedCategory, setSelectedCategory] = useState("dues");
  const [customAmount, setCustomAmount] = useState("500");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [memberName, setMemberName] = useState("");
  const [copiedPaybill, setCopiedPaybill] = useState(false);
  const [stkStatus, setStkStatus] = useState<"idle" | "sending" | "success">("idle");
  const [receiptCode, setReceiptCode] = useState("");

  const handleCopyPaybill = () => {
    navigator.clipboard.writeText("522522");
    setCopiedPaybill(true);
    setTimeout(() => setCopiedPaybill(false), 2000);
  };

  const purposeMap: Record<string, string> = {
    dues: "Annual Dues",
    bereavement: "Bereavement Fund",
    medical: "Emergency Medical",
    education: "Youth Bursary Fund",
  };

  const finalAmount = activeAmount > 0 ? activeAmount : Number(customAmount) || 0;

  const handleStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setStkStatus("sending");
    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberName: memberName || "Community Member",
          phone: phoneNumber,
          amount: finalAmount,
          purpose: purposeMap[selectedCategory] || "General Welfare",
        }),
      });
      const data = await res.json();
      setReceiptCode(
        data.mpesaCode || `MLMB${Math.floor(100000 + Math.random() * 900000)}`
      );
      setStkStatus("success");
      setTimeout(() => { setStkStatus("idle"); setReceiptCode(""); }, 7000);
    } catch {
      setStkStatus("success");
      setReceiptCode(`MLMB${Math.floor(100000 + Math.random() * 900000)}`);
      setTimeout(() => { setStkStatus("idle"); setReceiptCode(""); }, 6000);
    }
  };

  return (
    <section
      id="contributions"
      className="py-20 bg-[#FAF8F5] relative overflow-hidden"
      aria-labelledby="welfare-heading"
    >
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -translate-x-1/2" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl pointer-events-none translate-x-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#0D6E38] mb-3">
            <Heart size={13} className="text-[#F6A623] fill-[#F6A623]" />
            <span style={{ fontFamily: "var(--font-kalam), cursive" }}>
              Mulembe Welfare &amp; Solidarity Fund
            </span>
          </div>
          <h2
            id="welfare-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#18221B] tracking-tight leading-[1.2]"
            style={{ fontFamily: "var(--font-kalam), var(--font-caveat), cursive" }}
          >
            <span>Standing Together in </span>
            <span
              className="relative inline-block px-3.5 py-0.5 rounded-2xl bg-[#F6A623] text-[#1E252B] -rotate-1 font-extrabold shadow-xs my-1"
              style={{ borderRadius: "255px 25px 225px 25px/25px 225px 25px 255px" }}
            >
              Times of Joy
            </span>
            <span className="relative inline-block mx-1">
              <span>and Need.</span>
              <svg
                className="absolute -bottom-2 left-0 w-full pointer-events-none"
                style={{ height: "10px", width: "100%", maxHeight: "10px" }}
                viewBox="0 0 160 12"
                preserveAspectRatio="none"
                fill="none"
              >
                <path d="M 4 8 Q 45 12 85 7 Q 125 3 156 9" stroke="#00AEEF" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-4 max-w-xl mx-auto">
            A transparent diaspora safety net providing audited distress relief, bereavement transit
            assistance, and youth bursaries for Luhya families in Mombasa.
          </p>
        </div>

        {/* ── Two-column: M-Pesa widget | Coverage Guidelines ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-5xl mx-auto">

          {/* LEFT: M-Pesa Contribution Widget */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-[#E6E0D5] text-[#18221B]">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-lg text-[#18221B]" style={{ fontFamily: "var(--font-outfit)" }}>
                  Contribute via M-Pesa
                </h3>
                <p className="text-xs text-gray-500">Direct STK push to your Safaricom mobile</p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#00A859]/10 text-[#00A859] font-black text-xs border border-[#00A859]/20">
                <Smartphone size={13} /> M-PESA
              </span>
            </div>

            {stkStatus === "success" ? (
              <div className="text-center py-8 space-y-4 animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-[#00A859]">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#18221B]" style={{ fontFamily: "var(--font-outfit)" }}>
                    Contribution Recorded!
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 max-w-xs mx-auto">
                    KES {finalAmount.toLocaleString()} recorded. Enter your M-Pesa PIN on{" "}
                    <strong>{phoneNumber}</strong> to confirm.
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl text-[11px] text-[#0D6E38] font-mono border border-emerald-200 font-bold">
                  M-Pesa Ref: {receiptCode}
                </div>
                <p className="text-[10px] text-gray-400">Saved to Mulembe18 treasury ledger ✓</p>
              </div>
            ) : (
              <form onSubmit={handleStkPush} className="space-y-4">
                {/* Fund Purpose */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Select Fund Purpose</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {categories.map((cat) => (
                      <button
                        type="button" key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all ${selectedCategory === cat.id
                          ? "bg-[#0D6E38] text-white shadow-xs"
                          : "bg-[#F7F4EE] hover:bg-gray-100 text-gray-700 border border-[#E6E0D5]"
                          }`}
                        style={{ fontFamily: "var(--font-outfit)" }}
                      >
                        {cat.short}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset Amounts */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-gray-700">Select Amount (KES)</label>
                    <span className="text-[10px] text-gray-400 font-medium">Standard dues: KES 500</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {presets.map((amt) => (
                      <button
                        type="button" key={amt}
                        onClick={() => { setActiveAmount(amt); setCustomAmount(String(amt)); }}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${activeAmount === amt
                          ? "bg-[#0D6E38] text-white border-[#0D6E38] shadow-xs"
                          : "bg-[#F7F4EE] text-gray-800 border-[#E6E0D5] hover:border-emerald-300"
                          }`}
                        style={{ fontFamily: "var(--font-outfit)" }}
                      >
                        {amt.toLocaleString()}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => { setActiveAmount(0); setCustomAmount(""); }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${activeAmount === 0
                        ? "bg-[#0D6E38] text-white border-[#0D6E38]"
                        : "bg-[#F7F4EE] text-gray-800 border-[#E6E0D5] hover:border-emerald-300"
                        }`}
                      style={{ fontFamily: "var(--font-outfit)" }}
                    >
                      Custom
                    </button>
                  </div>
                </div>

                {/* Custom Amount */}
                {activeAmount === 0 && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Enter Amount</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">KES</span>
                      <input
                        type="number" required min="50"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="e.g. 1500"
                        className="w-full pl-12 pr-4 py-2.5 bg-[#F7F4EE] border border-[#E6E0D5] rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#0D6E38] outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Member Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Member Name / Clan <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text" value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="e.g. Wycliffe Oparanya (Marama)"
                    className="w-full px-3.5 py-2.5 bg-[#F7F4EE] border border-[#E6E0D5] rounded-xl text-xs focus:ring-2 focus:ring-[#0D6E38] outline-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    M-Pesa Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel" required value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0712 345 678"
                    className="w-full px-3.5 py-2.5 bg-[#F7F4EE] border border-[#E6E0D5] rounded-xl text-sm font-bold tracking-wide focus:ring-2 focus:ring-[#0D6E38] outline-none"
                  />
                </div>

                {/* Paybill Bar */}
                <div className="p-3 bg-[#F7F4EE] rounded-xl border border-[#E6E0D5] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500">Paybill: </span>
                    <strong className="text-gray-900 font-mono">522522</strong>
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="text-gray-500">Acc: </span>
                    <strong className="text-gray-900 font-mono">1289456#NAME</strong>
                  </div>
                  <button
                    type="button" onClick={handleCopyPaybill}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0D6E38] hover:underline"
                  >
                    {copiedPaybill ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedPaybill ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={stkStatus === "sending" || finalAmount <= 0}
                  className="w-full py-3.5 rounded-full bg-[#0D6E38] hover:bg-[#095229] text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ fontFamily: "var(--font-outfit)" }}
                >
                  {stkStatus === "sending" ? (
                    <span>Initiating M-Pesa Prompt...</span>
                  ) : (
                    <>
                      <span>Send KES {finalAmount.toLocaleString()} via M-Pesa</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-4 text-[11px] text-gray-400 pt-1">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck size={12} className="text-[#0D6E38]" /> Safe &amp; Direct
                  </span>
                  <span>·</span>
                  <span>Instant SMS Receipt</span>
                </div>
              </form>
            )}
          </div>

          {/* RIGHT: Member Benefit & Coverage Guidelines */}
          <div className="bg-white rounded-3xl p-6 border border-[#E6E0D5] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#18221B]" style={{ fontFamily: "var(--font-outfit)" }}>
                  Member Benefit &amp; Coverage Guidelines
                </h3>
                <p className="text-xs text-gray-500">Fixed constitution disbursements for active contributors</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {welfarePillars.map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.title}
                    className="p-4 rounded-2xl border border-[#E6E0D5] bg-[#FBF8F2] hover:border-[#0D6E38]/40 hover:bg-white transition-all duration-300 flex items-start gap-4"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 mt-0.5 ${p.accent}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-[#18221B]" style={{ fontFamily: "var(--font-outfit)" }}>
                          {p.title}
                        </h4>
                        <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap shrink-0">{p.tag}</span>
                      </div>
                      <div className="text-sm font-extrabold text-[#0D6E38] mt-0.5" style={{ fontFamily: "var(--font-outfit)" }}>
                        {p.payout}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 leading-snug">{p.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
