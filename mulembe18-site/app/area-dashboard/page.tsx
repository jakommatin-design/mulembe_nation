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
  RefreshCw,
  ArrowLeft,
  ShieldAlert,
  Building,
  UserCheck,
  Download,
  MapPin,
  Crown,
  Edit,
  Save,
  Compass,
  Info,
} from "lucide-react";

export default function AreaDashboardPage() {
  const { user, isLoaded } = useUser();

  const [areaDetails, setAreaDetails] = useState<any | null>(null);
  const [loadingArea, setLoadingArea] = useState(true);

  // Members state
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Edit area form
  const [isEditingArea, setIsEditingArea] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", contactInfo: "" });
  const [savingArea, setSavingArea] = useState(false);

  const [callerRole, setCallerRole] = useState<string>("member");
  const [assignedAreaId, setAssignedAreaId] = useState<number | null>(null);
  const [forbidden, setForbidden] = useState(false);

  // Fetch area members and area info
  const fetchAreaMembers = useCallback(async () => {
    setLoadingMembers(true);
    setForbidden(false);

    try {
      const params = new URLSearchParams({
        scope: "area",
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search.trim()) params.append("search", search.trim());
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/members?${params.toString()}`);
      if (res.status === 403) {
        setForbidden(true);
        setLoadingMembers(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setMembers(data.members || []);
        setTotalMembers(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setCallerRole(data.callerRole || "member");

        if (data.assignedAreaId) {
          setAssignedAreaId(data.assignedAreaId);
          // Fetch area details
          const areaRes = await fetch(`/api/areas?id=${data.assignedAreaId}`);
          const areaData = await areaRes.json();
          if (areaData.success && areaData.areas?.[0]) {
            const a = areaData.areas[0];
            setAreaDetails(a);
            setEditForm({
              name: a.name || "",
              description: a.description || "",
              contactInfo: a.contact_info || "",
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to load area members:", err);
    } finally {
      setLoadingMembers(false);
      setLoadingArea(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    if (isLoaded) {
      fetchAreaMembers();
    }
  }, [isLoaded, fetchAreaMembers]);

  // Update area details
  const handleUpdateAreaDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaDetails) return;
    setSavingArea(true);
    try {
      const res = await fetch("/api/areas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: areaDetails.id,
          name: editForm.name,
          description: editForm.description,
          contactInfo: editForm.contactInfo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Area details updated successfully!");
        setIsEditingArea(false);
        setAreaDetails({
          ...areaDetails,
          name: editForm.name,
          description: editForm.description,
          contact_info: editForm.contactInfo,
        });
      } else {
        alert(data.message || "Failed to update area details.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSavingArea(false);
    }
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
              The Area Leader Portal is reserved for appointed Area Leaders, Ward Leaders, and Administrators. Your account has not been designated as an Area Leader.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-full bg-[#0D6E38] hover:bg-[#09522a] text-white font-bold text-xs shadow-md transition-all"
            >
              <ArrowLeft size={14} />
              <span>Return to Member Dashboard</span>
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
                title="Back to Dashboard"
              >
                <ArrowLeft size={16} />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-extrabold text-[#18221B]" style={{ fontFamily: "var(--font-outfit)" }}>
                    Area Leadership Portal
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-100 text-[#0D6E38]">
                    <MapPin size={10} /> Area Leader
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                  <MapPin size={11} className="text-[#0D6E38]" />
                  <span>
                    Designated Area: <strong className="text-gray-900">{areaDetails?.name || "Local Area"}</strong> ({areaDetails?.ward || "Ward"})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={fetchAreaMembers}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw size={15} className={loadingMembers ? "animate-spin text-[#0D6E38]" : ""} />
              </button>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* Banner with Area Info */}
        <div className="bg-gradient-to-r from-[#0D6E38] via-[#09522a] to-[#043419] rounded-3xl p-6 sm:p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200/90 block">
                Grassroots Representation · Area Tier
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
                {areaDetails?.name ? `${areaDetails.name} Area Console` : "Area Leader Console"}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                You oversee local members registered in <strong>{areaDetails?.name || "your area"}</strong> under {areaDetails?.ward} Ward, {areaDetails?.subcounty} Subcounty. You can update your area profile and manage member contacts.
              </p>
            </div>

            <div className="flex-shrink-0">
              <button
                onClick={() => setIsEditingArea(!isEditingArea)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-[#0D6E38] hover:bg-emerald-50 text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Edit size={14} />
                <span>{isEditingArea ? "Close Profile Editor" : "Edit Area Info"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Area Profile Editor (Collapsible) */}
        {isEditingArea && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm animate-fade-in">
            <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
              <Edit size={15} className="text-[#0D6E38]" />
              <span>Update Area Profile Details</span>
            </h3>
            <form onSubmit={handleUpdateAreaDetails} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Area Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#0D6E38] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Contact Info / Help Desk</label>
                  <input
                    type="text"
                    value={editForm.contactInfo}
                    onChange={(e) => setEditForm({ ...editForm, contactInfo: e.target.value })}
                    placeholder="e.g. 0712 345678 or Area Desk location"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#0D6E38] outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Description / Key Landmarks</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Key estates, roads, boundaries covered by this area..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#0D6E38] outline-hidden"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingArea(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingArea}
                  className="px-5 py-2 rounded-xl bg-[#0D6E38] hover:bg-[#09522a] text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Save size={13} />
                  <span>{savingArea ? "Saving Changes..." : "Save Details"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Registered in Area</div>
            <div className="text-2xl font-black text-[#18221B] mt-1" style={{ fontFamily: "var(--font-outfit)" }}>
              {totalMembers}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Local members</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Verified Members</div>
            <div className="text-2xl font-black text-[#0D6E38] mt-1" style={{ fontFamily: "var(--font-outfit)" }}>
              {members.filter((m) => m.status === "Verified").length}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">KYC approved</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Parent Jurisdiction</div>
            <div className="text-sm font-black text-gray-800 mt-1">
              {areaDetails?.ward} Ward
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">{areaDetails?.subcounty} Subcounty</div>
          </div>
        </div>

        {/* Member Registry */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                placeholder="Search area members by name, phone, clan, or ID..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-gray-50/50 focus:bg-white focus:border-[#0D6E38] outline-hidden"
              />
            </div>

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

          {/* Members Table */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
            {loadingMembers ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-3 border-[#0D6E38] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : members.length === 0 ? (
              <div className="py-16 text-center">
                <Users size={28} className="text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-bold">No members found registered in this area.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Member Name</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Sub-Clan</th>
                      <th className="py-3 px-4">Profession</th>
                      <th className="py-3 px-4">Joined</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">{m.full_name}</div>
                          <div className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md inline-block mt-0.5 font-bold">
                            {m.membership_no || `MLB-${m.id}`}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 space-y-0.5">
                          {m.phone && <div className="font-mono text-gray-700">{m.phone}</div>}
                          {m.email && <div className="text-[11px] text-gray-400 truncate max-w-[150px]">{m.email}</div>}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-800">{m.sub_clan}</td>
                        <td className="py-3.5 px-4 text-gray-500">{m.profession || "Community Member"}</td>
                        <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                          {m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              m.status === "Verified" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {m.status || "Verified"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex items-center justify-between text-xs">
                <span className="text-gray-500 text-[11px]">
                  Page {page} of {totalPages} ({totalMembers} members)
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1 rounded-lg border border-gray-200 bg-white disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-1 rounded-lg border border-gray-200 bg-white disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

