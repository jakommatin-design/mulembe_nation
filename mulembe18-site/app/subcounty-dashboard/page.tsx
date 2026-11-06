"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  ShieldAlert,
  Building,
  UserCheck,
  Clock,
  Download,
  MapPin,
  Crown,
} from "lucide-react";

const subcountiesList = [
  "All",
  "Nyali",
  "Bamburi",
  "Mombasa Island (Mvita)",
  "Likoni Channel",
  "Changamwe",
  "Kisauni",
  "Mtwapa North",
  "Jomvu",
];

export default function SubcountyDashboardPage() {
  const { user, isLoaded } = useUser();

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubcounty, setSelectedSubcounty] = useState("All");

  const [callerRole, setCallerRole] = useState<string>("member");
  const [assignedSubcounty, setAssignedSubcounty] = useState<string>("");
  const [forbidden, setForbidden] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const fetchSubcountyMembers = useCallback(async () => {
    setLoading(true);
    setForbidden(false);

    try {
      const params = new URLSearchParams({
        scope: "subcounty",
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search.trim()) params.append("search", search.trim());
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (selectedSubcounty !== "All") params.append("subcounty", selectedSubcounty);

      const res = await fetch(`/api/members?${params.toString()}`);
      if (res.status === 403) {
        setForbidden(true);
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setMembers(data.members || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setCallerRole(data.callerRole || "member");
        setAssignedSubcounty(data.assignedSubcounty || "");
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error("Failed to load subcounty members:", err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, selectedSubcounty]);

  useEffect(() => {
    if (isLoaded) {
      fetchSubcountyMembers();
    }
  }, [isLoaded, fetchSubcountyMembers]);

  const handleVerifyMember = async (id: number) => {
    setVerifyingId(id);
    try {
      const res = await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "Verified" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSubcountyMembers();
      } else {
        alert(data.message || "Failed to update member status.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleExportCSV = () => {
    if (members.length === 0) return;
    const headers = ["Membership No", "Full Name", "Email", "Phone", "Sub-Clan", "Subcounty", "Status", "Joined"];
    const rows = members.map((m) => [
      m.membership_no || `M18-${m.id}`,
      `"${m.full_name || ""}"`,
      m.email || "",
      `"${m.phone || ""}"`,
      m.sub_clan || "",
      m.residential_zone || "",
      m.status || "Verified",
      m.created_at ? new Date(m.created_at).toLocaleDateString() : "",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mulembe18_${(assignedSubcounty || "subcounty").toLowerCase()}_members.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (forbidden) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200 p-8 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 mx-auto bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
            <ShieldAlert size={36} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900" style={{ fontFamily: "var(--font-outfit)" }}>
              Access Restricted
            </h1>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              The Subcounty Leaders Dashboard is reserved for verified Subcounty Administrators and Governing Council members. Your current account does not have leadership permissions assigned for this subcounty.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-full bg-[#0D6E38] hover:bg-[#09522a] text-white font-bold text-xs shadow-md transition-all"
            >
              <ArrowLeft size={14} />
              <span>Return to Member Dashboard</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center py-2.5 px-5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-xs transition-colors"
            >
              Mulembe18 Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                title="Back to Member Dashboard"
              >
                <ArrowLeft size={16} />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-extrabold text-[#18221B]" style={{ fontFamily: "var(--font-outfit)" }}>
                    Subcounty Leaders Portal
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-100 text-[#0D6E38]">
                    {callerRole === "super_admin" ? (
                      <>
                        <Crown size={10} /> Super Admin
                      </>
                    ) : (
                      <>
                        <Building size={10} /> Subcounty Leader
                      </>
                    )}
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                  <MapPin size={11} className="text-[#0D6E38]" />
                  <span>
                    Assigned Jurisdiction: <strong className="text-gray-900">{assignedSubcounty || "Loading..."}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchSubcountyMembers}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                title="Refresh Registry"
              >
                <RefreshCw size={15} className={loading ? "animate-spin text-[#0D6E38]" : ""} />
              </button>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* Banner with Subcounty Scope Notification */}
        <div className="bg-gradient-to-r from-[#0D6E38] via-[#0b5c2f] to-[#084523] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="max-w-2xl relative z-10 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200/90 block">
              Decentralized Governance · Coast Chapter
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
              {assignedSubcounty ? `${assignedSubcounty} Subcounty Registry` : "Subcounty Member Registry"}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              {callerRole === "super_admin"
                ? "Super Administrator Access: You have unrestricted oversight over all Mombasa subcounties and can audit or assign local leadership."
                : `Secured Administrative Scope: You are authorized to review and verify members registered within the ${assignedSubcounty} jurisdiction. Other subcounties are protected by server-side role partitioning.`}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 relative z-10">
            <button
              onClick={handleExportCSV}
              disabled={members.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#0D6E38] hover:bg-emerald-50 disabled:opacity-50 text-xs font-bold shadow-sm transition-all"
            >
              <Download size={14} />
              <span>Export Subcounty CSV ({total})</span>
            </button>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Registered</div>
            <div className="text-2xl font-black text-[#18221B] mt-1" style={{ fontFamily: "var(--font-outfit)" }}>
              {total}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">In this jurisdiction</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Active / Verified</div>
            <div className="text-2xl font-black text-[#0D6E38] mt-1" style={{ fontFamily: "var(--font-outfit)" }}>
              {members.filter((m) => m.status === "Verified").length}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">KYC approved</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Pending Review</div>
            <div className="text-2xl font-black text-amber-600 mt-1" style={{ fontFamily: "var(--font-outfit)" }}>
              {members.filter((m) => m.status !== "Verified").length}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Awaiting check</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Page Info</div>
            <div className="text-2xl font-black text-[#DDA71D] mt-1" style={{ fontFamily: "var(--font-outfit)" }}>
              {page} <span className="text-sm font-semibold text-gray-400">/ {totalPages}</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">10 records / page</div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search size={15} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, phone, or membership number..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-gray-50/50 focus:bg-white focus:border-[#0D6E38] focus:ring-2 focus:ring-emerald-100 transition-all outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="py-2 px-3 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:bg-white focus:border-[#0D6E38] outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="Verified">Verified Only</option>
                <option value="Pending">Pending Only</option>
              </select>
            </div>

            {/* Super admin can switch subcounties */}
            {callerRole === "super_admin" && (
              <select
                value={selectedSubcounty}
                onChange={(e) => {
                  setSelectedSubcounty(e.target.value);
                  setPage(1);
                }}
                className="py-2 px-3 rounded-xl border border-gray-200 text-xs bg-emerald-50 text-[#0D6E38] font-bold focus:bg-white focus:border-[#0D6E38] outline-hidden"
              >
                {subcountiesList.map((sc) => (
                  <option key={sc} value={sc}>
                    {sc === "All" ? "Filter: All Subcounties" : sc}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-3 border-[#0D6E38] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400 font-medium">Querying verified subcounty members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 mx-auto mb-3">
                <Users size={24} />
              </div>
              <h3 className="text-sm font-bold text-gray-800">No Members Found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                No member records match your query in this subcounty. New registrations under this zone will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Member Info</th>
                    <th className="py-3 px-4">Contact Details</th>
                    <th className="py-3 px-4">Sub-Clan & Zone</th>
                    <th className="py-3 px-4">Join Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 text-sm">{m.full_name}</div>
                        <div className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md inline-block mt-0.5 font-bold">
                          {m.membership_no || `M18-${m.id}`}
                        </div>
                        {m.profession && <div className="text-[10px] text-gray-400 mt-0.5">{m.profession}</div>}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 space-y-1">
                        {m.phone && (
                          <div className="flex items-center gap-1.5 text-gray-700 font-mono">
                            <Phone size={12} className="text-[#0D6E38]" />
                            <a href={`tel:${m.phone}`} className="hover:underline">
                              {m.phone}
                            </a>
                          </div>
                        )}
                        {m.email && (
                          <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                            <Mail size={12} className="text-gray-400" />
                            <a href={`mailto:${m.email}`} className="hover:underline truncate max-w-[180px] inline-block">
                              {m.email}
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Clan & Zone */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-800">{m.sub_clan || "Luhya"}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={11} className="text-gray-400" />
                          <span>{m.residential_zone || assignedSubcounty}</span>
                        </div>
                      </td>

                      {/* Join Date */}
                      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-gray-400" />
                          <span>{m.created_at ? new Date(m.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            m.status === "Verified"
                              ? "bg-emerald-100 text-[#0D6E38]"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {m.status === "Verified" ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                          <span>{m.status || "Verified"}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {m.status !== "Verified" ? (
                          <button
                            type="button"
                            onClick={() => handleVerifyMember(m.id)}
                            disabled={verifyingId === m.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0D6E38] hover:bg-[#09522a] text-white text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            <UserCheck size={12} />
                            <span>{verifyingId === m.id ? "Verifying..." : "Verify"}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">Up to date</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="border-t border-gray-100 px-4 py-3.5 bg-gray-50/50 flex items-center justify-between gap-3 text-xs">
              <span className="text-gray-500 text-[11px]">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} members
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 text-gray-600 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>

                <span className="px-2 font-bold text-gray-700 text-xs">
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 text-gray-600 transition-colors cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

