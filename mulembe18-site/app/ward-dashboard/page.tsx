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
  Plus,
  PlusCircle,
  Edit,
  Trash2,
  Upload,
  UserPlus,
  Compass,
  FileSpreadsheet,
  X,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function WardDashboardPage() {
  const { user, isLoaded } = useUser();

  const [activeTab, setActiveTab] = useState<"areas" | "members">("areas");

  // Areas state
  const [areas, setAreas] = useState<any[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);

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
  const [selectedAreaFilter, setSelectedAreaFilter] = useState("all");

  // Caller auth & ward jurisdiction
  const [callerRole, setCallerRole] = useState<string>("member");
  const [assignedWard, setAssignedWard] = useState<string>("");
  const [assignedSubcounty, setAssignedSubcounty] = useState<string>("");
  const [forbidden, setForbidden] = useState(false);

  // Modals
  const [createAreaModal, setCreateAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState<any | null>(null);
  const [areaForm, setAreaForm] = useState({ name: "", description: "", contactInfo: "", isActive: true });

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const [assignLeaderModal, setAssignLeaderModal] = useState<any | null>(null);
  const [selectedLeaderMemberId, setSelectedLeaderMemberId] = useState<string>("");
  const [assigningLeader, setAssigningLeader] = useState(false);

  // Fetch areas in this ward
  const fetchWardAreas = useCallback(async (wardName?: string) => {
    setLoadingAreas(true);
    try {
      const targetWard = wardName || assignedWard;
      const url = targetWard ? `/api/areas?ward=${encodeURIComponent(targetWard)}&activeOnly=false` : "/api/areas?activeOnly=false";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setAreas(data.areas || []);
      }
    } catch (err) {
      console.error("Failed to load areas:", err);
    } finally {
      setLoadingAreas(false);
    }
  }, [assignedWard]);

  // Fetch ward members
  const fetchWardMembers = useCallback(async () => {
    setLoadingMembers(true);
    setForbidden(false);

    try {
      const params = new URLSearchParams({
        scope: "ward",
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search.trim()) params.append("search", search.trim());
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (selectedAreaFilter !== "all") params.append("areaId", selectedAreaFilter);

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
        if (data.assignedWard && data.assignedWard !== "All Wards") {
          setAssignedWard(data.assignedWard);
          fetchWardAreas(data.assignedWard);
        } else {
          fetchWardAreas();
        }
      }
    } catch (err) {
      console.error("Failed to load ward members:", err);
    } finally {
      setLoadingMembers(false);
    }
  }, [page, limit, search, statusFilter, selectedAreaFilter, fetchWardAreas]);

  useEffect(() => {
    if (isLoaded) {
      fetchWardMembers();
    }
  }, [isLoaded, fetchWardMembers]);

  // Create single area
  const handleSaveArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaForm.name.trim()) return alert("Area name is required.");

    try {
      if (editingArea) {
        const res = await fetch("/api/areas", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingArea.id,
            name: areaForm.name,
            description: areaForm.description,
            contactInfo: areaForm.contactInfo,
            isActive: areaForm.isActive,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setEditingArea(null);
          setCreateAreaModal(false);
          fetchWardAreas();
        } else {
          alert(data.message || "Failed to update area.");
        }
      } else {
        const res = await fetch("/api/areas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: areaForm.name,
            ward: assignedWard,
            subcounty: assignedSubcounty || "Mombasa",
            description: areaForm.description,
            contactInfo: areaForm.contactInfo,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setCreateAreaModal(false);
          setAreaForm({ name: "", description: "", contactInfo: "", isActive: true });
          fetchWardAreas();
        } else {
          alert(data.message || "Failed to create area.");
        }
      }
    } catch {
      alert("Network error.");
    }
  };

  // Bulk Upload Areas
  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return alert("Please paste or enter area names.");

    setBulkSubmitting(true);
    try {
      // Parse lines (Name, Description, Contact Info)
      const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
      const bulkAreas = lines.map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        return {
          name: parts[0] || "",
          description: parts[1] || "",
          contactInfo: parts[2] || "",
          ward: assignedWard,
          subcounty: assignedSubcounty || "Mombasa",
        };
      }).filter((a) => a.name.length > 0);

      const res = await fetch("/api/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areas: bulkAreas,
          ward: assignedWard,
          subcounty: assignedSubcounty || "Mombasa",
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message || `Uploaded ${bulkAreas.length} areas successfully!`);
        setBulkModalOpen(false);
        setBulkText("");
        fetchWardAreas();
      } else {
        alert(data.message || "Bulk upload encountered an error.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Assign Area Leader
  const handleAssignAreaLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignLeaderModal) return;

    setAssigningLeader(true);
    try {
      const memberId = selectedLeaderMemberId ? Number(selectedLeaderMemberId) : 0;
      const res = await fetch("/api/areas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: assignLeaderModal.id,
          areaLeaderMemberId: memberId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Area Leader assignment updated!");
        setAssignLeaderModal(null);
        setSelectedLeaderMemberId("");
        fetchWardAreas();
        fetchWardMembers();
      } else {
        alert(data.message || "Failed to assign Area Leader.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setAssigningLeader(false);
    }
  };

  // Delete area
  const handleDeleteArea = async (area: any) => {
    if (!confirm(`Are you sure you want to delete '${area.name}'? Any registered members in this area will be safely unassigned.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/areas?id=${area.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Area deleted.");
        fetchWardAreas();
        fetchWardMembers();
      } else {
        alert(data.message || "Failed to delete area.");
      }
    } catch {
      alert("Network error.");
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
              The Ward Leader Portal is reserved for appointed Ward Leaders, Subcounty Admins, and Super Administrators. You do not have leadership authority assigned over this ward.
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
                    Ward Leadership & Area Management
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-100 text-[#0D6E38]">
                    <Compass size={10} /> {callerRole === "super_admin" ? "Super Admin" : "Ward Leader"}
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                  <MapPin size={11} className="text-[#0D6E38]" />
                  <span>
                    Ward Jurisdiction: <strong className="text-gray-900">{assignedWard || "All Wards (Overseer)"}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  fetchWardAreas();
                  fetchWardMembers();
                }}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw size={15} className={loadingAreas || loadingMembers ? "animate-spin text-[#0D6E38]" : ""} />
              </button>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#0D6E38] via-[#09522a] to-[#043419] rounded-3xl p-6 sm:p-8 text-white shadow-xl">
          <div className="max-w-2xl space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200/90 block">
              Grassroots Administration · Ward Tier
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
              {assignedWard ? `${assignedWard} Ward Console` : "Ward Administration Console"}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              As a Ward Leader, you manage grassroots Areas in your ward, assign Area Leaders, and maintain jurisdiction records. Server-side partitioning ensures you only see members registered in your ward.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setEditingArea(null);
                setAreaForm({ name: "", description: "", contactInfo: "", isActive: true });
                setCreateAreaModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#0D6E38] hover:bg-emerald-50 text-xs font-bold shadow-sm transition-all"
            >
              <Plus size={14} />
              <span>Create New Area</span>
            </button>
            <button
              onClick={() => setBulkModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-800/80 hover:bg-emerald-800 border border-emerald-500/40 text-white text-xs font-bold transition-all"
            >
              <FileSpreadsheet size={14} />
              <span>Bulk Upload Areas</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 gap-2">
          <button
            onClick={() => setActiveTab("areas")}
            className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "areas"
                ? "border-[#0D6E38] text-[#0D6E38]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <MapPin size={15} />
            <span>Designated Areas ({areas.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "members"
                ? "border-[#0D6E38] text-[#0D6E38]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <Users size={15} />
            <span>Ward Member Registry ({totalMembers})</span>
          </button>
        </div>

        {/* TAB 1: AREAS MANAGEMENT */}
        {activeTab === "areas" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loadingAreas ? (
                <div className="col-span-full py-12 flex justify-center">
                  <div className="w-8 h-8 border-3 border-[#0D6E38] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : areas.length === 0 ? (
                <div className="col-span-full bg-white rounded-3xl border border-gray-200 p-10 text-center space-y-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 mx-auto">
                    <MapPin size={24} />
                  </div>
                  <h3 className="font-bold text-sm text-gray-800">No Areas Uploaded Yet</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Create designated areas or estates in {assignedWard || "your ward"} so members can select their local area.
                  </p>
                  <button
                    onClick={() => setCreateAreaModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0D6E38] hover:bg-[#09522a] text-white text-xs font-bold shadow-sm"
                  >
                    <Plus size={14} />
                    <span>Create First Area</span>
                  </button>
                </div>
              ) : (
                areas.map((area) => (
                  <div
                    key={area.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-3 transition-all ${
                      area.is_active ? "border-gray-200/80 hover:border-[#0D6E38]/40" : "border-rose-200 bg-rose-50/20 opacity-75"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-gray-900">{area.name}</h4>
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                                area.is_active ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {area.is_active ? "Active" : "Deactivated"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">{area.ward} Ward · {area.subcounty}</p>
                        </div>
                      </div>

                      {area.description && (
                        <p className="text-xs text-gray-600 mt-2.5 leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          {area.description}
                        </p>
                      )}

                      {/* Area Leader Box */}
                      <div className="mt-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs space-y-1">
                        <div className="text-[10px] uppercase font-bold text-emerald-800 flex items-center justify-between">
                          <span>Appointed Area Leader</span>
                          {area.area_leader_name ? (
                            <span className="text-emerald-700 font-bold">✓ Active</span>
                          ) : (
                            <span className="text-amber-600 font-bold">Vacant</span>
                          )}
                        </div>
                        {area.area_leader_name ? (
                          <div>
                            <div className="font-bold text-gray-900">{area.area_leader_name}</div>
                            {area.area_leader_phone && (
                              <div className="text-[11px] text-gray-500 font-mono mt-0.5">{area.area_leader_phone}</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-[11px] italic">No leader assigned yet.</div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <span className="text-[11px]">Members registered:</span>
                        <span className="font-black text-[#0D6E38] text-sm">{area.member_count || 0}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => {
                          setAssignLeaderModal(area);
                          setSelectedLeaderMemberId(area.area_leader_member_id ? String(area.area_leader_member_id) : "");
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0D6E38] text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <UserPlus size={12} />
                        <span>{area.area_leader_name ? "Change Leader" : "Assign Leader"}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingArea(area);
                            setAreaForm({
                              name: area.name,
                              description: area.description || "",
                              contactInfo: area.contact_info || "",
                              isActive: Boolean(area.is_active),
                            });
                            setCreateAreaModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                          title="Edit Area"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteArea(area)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Delete Area"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: WARD MEMBERS REGISTRY */}
        {activeTab === "members" && (
          <div className="space-y-4">
            {/* Filter Toolbar */}
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
                  placeholder="Search ward members by name, phone, area, or ID..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-gray-50/50 focus:bg-white focus:border-[#0D6E38] outline-hidden"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Area Filter */}
                <select
                  value={selectedAreaFilter}
                  onChange={(e) => {
                    setSelectedAreaFilter(e.target.value);
                    setPage(1);
                  }}
                  className="py-2 px-3 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:bg-white focus:border-[#0D6E38] outline-hidden"
                >
                  <option value="all">All Areas</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
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
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
              {loadingMembers ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 border-3 border-[#0D6E38] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : members.length === 0 ? (
                <div className="py-16 text-center">
                  <Users size={28} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-bold">No members found matching query in this ward.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Member Info</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Assigned Area</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Join Date</th>
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
                          <td className="py-3.5 px-4">
                            {m.area_name ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-[#0D6E38]">
                                <MapPin size={10} /> {m.area_name}
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[11px] font-semibold text-gray-700 capitalize">
                              {m.role ? m.role.replace("_", " ") : "Member"}
                            </span>
                          </td>
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
                    Showing page {page} of {totalPages} ({totalMembers} total members)
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
        )}
      </main>

      {/* MODAL: CREATE / EDIT AREA */}
      {createAreaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h4 className="font-bold text-sm text-gray-900">
                  {editingArea ? "Edit Designated Area" : "Create New Area"}
                </h4>
                <p className="text-[10px] text-gray-400">Jurisdiction: {assignedWard} Ward</p>
              </div>
              <button
                onClick={() => setCreateAreaModal(false)}
                className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveArea} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Area / Estate Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={areaForm.name}
                  onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                  placeholder="e.g. Links Road Central, Kongowea Estate"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#0D6E38] outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={areaForm.description}
                  onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
                  placeholder="Key boundaries or landmarks..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#0D6E38] outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Contact Details / Info Desk</label>
                <input
                  type="text"
                  value={areaForm.contactInfo}
                  onChange={(e) => setAreaForm({ ...areaForm, contactInfo: e.target.value })}
                  placeholder="e.g. Community hall desk / 0712 345678"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#0D6E38] outline-hidden"
                />
              </div>

              {editingArea && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="areaActiveToggle"
                    checked={areaForm.isActive}
                    onChange={(e) => setAreaForm({ ...areaForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-[#0D6E38] rounded-sm"
                  />
                  <label htmlFor="areaActiveToggle" className="font-semibold text-gray-700">
                    Active (members can select this area)
                  </label>
                </div>
              )}

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateAreaModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0D6E38] hover:bg-[#09522a] text-white font-bold"
                >
                  {editingArea ? "Update Area" : "Save Area"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BULK UPLOAD AREAS */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div>
                <h4 className="font-bold text-sm text-gray-900">Bulk Upload Areas (CSV / Text)</h4>
                <p className="text-[10px] text-gray-400">Jurisdiction: {assignedWard} Ward</p>
              </div>
              <button
                onClick={() => setBulkModalOpen(false)}
                className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleBulkUpload} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-[11px] leading-relaxed">
                Enter or paste one area per line in format:
                <br />
                <code className="font-bold">Area Name, Description (optional), Contact Info (optional)</code>
                <br />
                Example:
                <br />
                <code>Links Estate, Between Nyali Mall and Links Rd, 0712000000</code>
                <br />
                <code>Kongowea West, Near Market Gate 2, desk@mulembe.org</code>
              </div>

              <textarea
                rows={6}
                required
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Paste area rows here..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 font-mono text-[11px] focus:border-[#0D6E38] outline-hidden"
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#0D6E38] hover:bg-[#09522a] text-white font-bold"
                >
                  {bulkSubmitting ? "Uploading Areas..." : "Upload Areas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN AREA LEADER */}
      {assignLeaderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div>
                <h4 className="font-bold text-sm text-gray-900">Assign Area Leader</h4>
                <p className="text-[10px] text-gray-400">Area: {assignLeaderModal.name}</p>
              </div>
              <button
                onClick={() => setAssignLeaderModal(null)}
                className="p-1.5 rounded-lg bg-gray-100 text-gray-500"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleAssignAreaLeader} className="space-y-3.5 text-xs">
              <p className="text-[11px] text-gray-500">
                Choose a verified member from your ward to appoint as the grassroots Area Leader for <strong>{assignLeaderModal.name}</strong>.
              </p>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Select Member</label>
                <select
                  value={selectedLeaderMemberId}
                  onChange={(e) => setSelectedLeaderMemberId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white focus:border-[#0D6E38]"
                >
                  <option value="">-- No Leader (Position Vacant) --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.phone || "No phone"}) - {m.area_name || "Unassigned"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignLeaderModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigningLeader}
                  className="flex-1 py-2.5 rounded-xl bg-[#0D6E38] hover:bg-[#09522a] text-white font-bold"
                >
                  {assigningLeader ? "Assigning..." : "Confirm Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

