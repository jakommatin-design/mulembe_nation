"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import {
  Users, CreditCard, ShieldCheck, Calendar, Download, Plus, CheckCircle2,
  Clock, AlertTriangle, ArrowRight, QrCode, Phone, Mail, ChevronRight,
  LogOut, Smartphone, Shield, HeartHandshake, Heart, Landmark, Megaphone,
  BarChart3, Receipt, Ticket, AlertCircle, Menu, X, Compass, PanelLeftClose,
  PanelLeftOpen, MapPin, Check, Star, Trash2, PlusCircle, CalendarDays,
  RefreshCw, Image as ImageIcon, Edit3, Crown, TrendingUp, Building, Award,
  Send, CheckCheck, Radio, Layers, FileText, CheckCircle, XCircle,
} from "lucide-react";
import { BorderBeam } from "@/components/magicui/border-beam";
import NumberTicker from "@/components/magicui/number-ticker";
import { normalizeImageUrl } from "@/lib/image-utils";
import { KENYA_LOCATIONS, KENYA_COUNTIES, getSubcounties, getWards } from "@/lib/locations";

type DashboardRole = "member" | "leader";
type MemberTab = "overview" | "my-leadership" | "contributions" | "events" | "welfare-claim" | "clan-desk";
type AdminTab = "analytics" | "members" | "dispatch" | "areas" | "events" | "claims" | "solidarity" | "broadcast" | "gallery" | "leadership";

/* ─── Reusable Atoms ─────────────────────────────────────────── */
const Spinner = () => (
  <div className="w-6 h-6 border-2 border-[#0D6E38] border-t-transparent rounded-full animate-spin" />
);

const EmptyState = ({ icon: Icon, title, body, cta }: { icon: any; title: string; body: string; cta?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-300">
      <Icon size={24} />
    </div>
    <div>
      <h4 className="font-bold text-sm text-gray-700">{title}</h4>
      <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">{body}</p>
    </div>
    {cta}
  </div>
);

const Badge = ({ status }: { status: string }) => {
  const c: Record<string, string> = {
    Approved: "bg-emerald-100 text-emerald-700", Completed: "bg-emerald-100 text-emerald-700",
    Verified: "bg-emerald-100 text-emerald-700", Pending: "bg-amber-100 text-amber-700",
    Active: "bg-emerald-100 text-emerald-700", Inactive: "bg-gray-100 text-gray-500",
  };
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${c[status] || "bg-gray-100 text-gray-500"}`}>{status}</span>;
};

export default function DashboardPage() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [memberTab, setMemberTab] = useState<MemberTab>("overview");
  const [adminTab, setAdminTab] = useState<AdminTab>("analytics");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Data
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [galleryList, setGalleryList] = useState<any[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [leadershipList, setLeadershipList] = useState<any[]>([]);
  const [loadingLeadership, setLoadingLeadership] = useState(false);
  const [claimsList, setClaimsList] = useState<any[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [appealsList, setAppealsList] = useState<any[]>([]);
  const [loadingAppeals, setLoadingAppeals] = useState(false);
  const [contributionsList, setContributionsList] = useState<any[]>([]);
  const [loadingContributions, setLoadingContributions] = useState(false);
  const [totalReserve, setTotalReserve] = useState(0);
  const [monthlyCollection, setMonthlyCollection] = useState(0);

  // Modal & Form States
  const [createEventModal, setCreateEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({ title: "", venue: "Mama Ngina Waterfront, Mombasa", category: "Cultural", day: "26", dow: "SAT", month: "APR", time: "9:00 AM – 6:00 PM", entryFee: "Free", description: "", isFeatured: false });

  const [newsForm, setNewsForm] = useState({ category: "Announcements", title: "", summary: "", content: "", imageUrl: "/images/landing-hero.png", author: "Mulembe Secretariat" });
  const [editingNews, setEditingNews] = useState<any | null>(null);

  const [createGalleryModal, setCreateGalleryModal] = useState(false);
  const [editingGallery, setEditingGallery] = useState<any | null>(null);
  const [galleryForm, setGalleryForm] = useState({ imageUrl: "", albumUrl: "", label: "", category: "Cultural Festival", subLocation: "Mama Ngina Waterfront, Mombasa", isLarge: false, sortOrder: "0" });

  const [createLeaderModal, setCreateLeaderModal] = useState(false);
  const [editingLeader, setEditingLeader] = useState<any | null>(null);
  const [leaderForm, setLeaderForm] = useState({ name: "", role: "Chairperson", clan: "Bukusu", phone: "", email: "", avatarUrl: "", bio: "", sortOrder: "1" });

  const [addContribModal, setAddContribModal] = useState(false);
  const [contribForm, setContribForm] = useState({ memberName: "", phone: "", amount: "", purpose: "Annual Dues" });

  const [createAppealModal, setCreateAppealModal] = useState(false);
  const [appealForm, setAppealForm] = useState({ title: "", familyName: "", location: "", goalAmount: "", raisedAmount: "0", description: "" });
  const [appealDonateModal, setAppealDonateModal] = useState<any | null>(null);
  const [appealDonatePhone, setAppealDonatePhone] = useState("");
  const [appealDonateAmount, setAppealDonateAmount] = useState("1000");
  const [appealDonateStatus, setAppealDonateStatus] = useState<"idle" | "sending" | "success">("idle");

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimType, setClaimType] = useState("Bereavement Repatriation");
  const [claimAmount, setClaimAmount] = useState("50000");
  const [claimDesc, setClaimDesc] = useState("");
  const [claimSuccess, setClaimSuccess] = useState(false);

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payPhone, setPayPhone] = useState("");
  const [payStatus, setPayStatus] = useState<"idle" | "sending" | "success">("idle");

  // Leadership & Area states
  const [hierarchyData, setHierarchyData] = useState<any | null>(null);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);
  const [wardAreasList, setWardAreasList] = useState<any[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [savingArea, setSavingArea] = useState(false);
  const [areaChangeSuccess, setAreaChangeSuccess] = useState(false);

  // Role Management
  const [roleModalMember, setRoleModalMember] = useState<any | null>(null);
  const [assignedRole, setAssignedRole] = useState<string>("member");
  const [assignedCounty, setAssignedCounty] = useState<string>("Mombasa");
  const [assignedZone, setAssignedZone] = useState<string>("Nyali");
  const [assignedWard, setAssignedWard] = useState<string>("");
  const [assignedAreaId, setAssignedAreaId] = useState<string>("");
  const [assigningRole, setAssigningRole] = useState(false);

  // Caller Profile & Role-Aware View Mode
  const [callerProfile, setCallerProfile] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"leader" | "member">("leader");

  // Dispatch States
  const [dispatchChannel, setDispatchChannel] = useState<"email" | "sms" | "both">("both");
  const [dispatchTargetType, setDispatchTargetType] = useState<"all" | "selected">("all");
  const [dispatchSubject, setDispatchSubject] = useState("");
  const [dispatchMessage, setDispatchMessage] = useState("");
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<number[]>([]);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [dispatchRecipients, setDispatchRecipients] = useState<any[]>([]);
  const [dispatchLogs, setDispatchLogs] = useState<any[]>([]);
  const [loadingDispatchData, setLoadingDispatchData] = useState(false);
  const [dispatchSubmitting, setDispatchSubmitting] = useState(false);
  const [dispatchConfirmModalOpen, setDispatchConfirmModalOpen] = useState(false);
  const [dispatchNotice, setDispatchNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Custom Areas Management States
  const [allAreasList, setAllAreasList] = useState<any[]>([]);
  const [loadingAreasList, setLoadingAreasList] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaWard, setNewAreaWard] = useState("");
  const [newAreaSubcounty, setNewAreaSubcounty] = useState("");
  const [newAreaCounty, setNewAreaCounty] = useState("Mombasa");
  const [newAreaDesc, setNewAreaDesc] = useState("");
  const [newAreaContact, setNewAreaContact] = useState("");
  const [creatingArea, setCreatingArea] = useState(false);
  const [assignLeaderModalArea, setAssignLeaderModalArea] = useState<any | null>(null);
  const [selectedAreaLeaderId, setSelectedAreaLeaderId] = useState<string>("");
  const [assigningAreaLeader, setAssigningAreaLeader] = useState(false);

  // Fetchers
  const fetchCallerProfile = async () => {
    try {
      const r = await fetch("/api/members?scope=me");
      const d = await r.json();
      if (d.success && d.member) setCallerProfile(d.member);
    } catch (e) {
      console.warn("Failed to fetch caller profile:", e);
    }
  };

  const fetchDispatchData = async () => {
    setLoadingDispatchData(true);
    try {
      const r = await fetch("/api/dispatch");
      const d = await r.json();
      if (d.success) {
        setDispatchRecipients(d.recipients || []);
        setDispatchLogs(d.logs || []);
      }
    } catch (e) {
      console.error("Failed to fetch dispatch data:", e);
    } finally {
      setLoadingDispatchData(false);
    }
  };

  const fetchAllAreas = async () => {
    setLoadingAreasList(true);
    try {
      const r = await fetch("/api/areas?activeOnly=false");
      const d = await r.json();
      if (d.success) setAllAreasList(d.areas || []);
    } catch (e) {
      console.error("Failed to fetch all areas:", e);
    } finally {
      setLoadingAreasList(false);
    }
  };

  const fetchHierarchy = async () => {
    setLoadingHierarchy(true);
    try {
      const r = await fetch("/api/leadership/hierarchy");
      const d = await r.json();
      if (d.success) setHierarchyData(d.hierarchy);
    } catch (e) {
      console.error("Failed to fetch leadership hierarchy:", e);
    } finally {
      setLoadingHierarchy(false);
    }
  };

  const fetchWardAreas = async (targetWard?: string) => {
    if (!targetWard) return;
    try {
      const r = await fetch(`/api/areas?ward=${encodeURIComponent(targetWard)}&activeOnly=true`);
      const d = await r.json();
      if (d.success) setWardAreasList(d.areas || []);
    } catch (e) {
      console.error("Failed to fetch areas:", e);
    }
  };
  const fetchAllEvents = async () => { setLoadingEvents(true); try { const r = await fetch("/api/events"); const d = await r.json(); if (d.success) setEventsList(d.events || []); } catch {} finally { setLoadingEvents(false); } };
  const fetchAllNews = async () => { setLoadingNews(true); try { const r = await fetch("/api/news"); const d = await r.json(); if (d.success) setNewsList(d.articles || []); } catch {} finally { setLoadingNews(false); } };
  const fetchAllGallery = async () => { setLoadingGallery(true); try { const r = await fetch("/api/gallery"); const d = await r.json(); if (d.success) setGalleryList(d.photos || []); } catch {} finally { setLoadingGallery(false); } };
  const fetchAllLeadership = async () => { setLoadingLeadership(true); try { const r = await fetch("/api/leadership"); const d = await r.json(); if (d.success) setLeadershipList(d.leaders || []); } catch {} finally { setLoadingLeadership(false); } };
  const fetchAllClaims = async () => { setLoadingClaims(true); try { const r = await fetch("/api/welfare"); const d = await r.json(); if (d.success) setClaimsList(d.claims || []); } catch {} finally { setLoadingClaims(false); } };
  const fetchAllMembers = async () => { setLoadingMembers(true); try { const r = await fetch("/api/members"); const d = await r.json(); if (d.success) setMembersList(d.members || []); } catch {} finally { setLoadingMembers(false); } };
  const fetchAllAppeals = async () => { setLoadingAppeals(true); try { const r = await fetch("/api/appeals"); const d = await r.json(); if (d.success) setAppealsList(d.appeals || []); } catch {} finally { setLoadingAppeals(false); } };
  const fetchAllContributions = async () => {
    setLoadingContributions(true);
    try { const r = await fetch("/api/contributions"); const d = await r.json();
      if (d.success) { setContributionsList(d.contributions || []); setTotalReserve(d.totalReserve ?? 0); setMonthlyCollection(d.monthlyCollection ?? 0); }
    } catch {} finally { setLoadingContributions(false); }
  };
  useEffect(() => {
    setMounted(true);
    fetchCallerProfile();
    fetchAllEvents();
    fetchAllNews();
    fetchAllGallery();
    fetchAllLeadership();
    fetchAllClaims();
    fetchAllMembers();
    fetchAllContributions();
    fetchAllAppeals();
    fetchDispatchData();
    fetchAllAreas();
  }, []);

  // Derived Member & Role
  const currentMember = useMemo(
    () =>
      callerProfile ||
      membersList.find(
        (m) =>
          user?.primaryEmailAddress?.emailAddress &&
          m.email?.toLowerCase() === user.primaryEmailAddress.emailAddress.toLowerCase()
      ),
    [callerProfile, membersList, user]
  );

  const userRole = currentMember?.role || (user?.publicMetadata?.role as string) || "member";
  const isNationalLeader = useMemo(() => userRole === "national_leader", [userRole]);
  const isSuperAdmin = useMemo(() => userRole === "super_admin" || isNationalLeader, [userRole, isNationalLeader]);
  const isCountyLeader = useMemo(() => userRole === "county_leader", [userRole]);
  const isSubcountyAdmin = useMemo(() => userRole === "subcounty_admin", [userRole]);
  const isWardLeader = useMemo(() => userRole === "ward_leader", [userRole]);
  const isAreaLeader = useMemo(() => userRole === "area_leader", [userRole]);
  const isLeader = useMemo(
    () => isSuperAdmin || isCountyLeader || isSubcountyAdmin || isWardLeader || isAreaLeader,
    [isSuperAdmin, isCountyLeader, isSubcountyAdmin, isWardLeader, isAreaLeader]
  );

  const role: DashboardRole = isLeader && viewMode === "leader" ? "leader" : "member";

  const jurisdictionLabel = useMemo(() => {
    if (isNationalLeader) return "National Leadership Council (All 47 Counties)";
    if (isSuperAdmin) return "National Super Admin (All 47 Counties)";
    if (isCountyLeader) return `${currentMember?.county_leader_county || currentMember?.county || "Mombasa"} County`;
    if (isSubcountyAdmin) return `${currentMember?.subcounty_admin_zone || currentMember?.subcounty || "Assigned"} Sub-County`;
    if (isWardLeader) return `${currentMember?.ward_leader_ward || currentMember?.ward || "Assigned"} Ward`;
    if (isAreaLeader) return `Area #${currentMember?.area_leader_area_id || "1"} (${currentMember?.area_name || "Assigned Area"})`;
    return "Mulembe18 Kenya Community";
  }, [isNationalLeader, isSuperAdmin, isCountyLeader, isSubcountyAdmin, isWardLeader, isAreaLeader, currentMember]);
  const userContributions = useMemo(() => contributionsList.filter(c => currentMember && (c.member_name?.toLowerCase().includes(currentMember.full_name?.toLowerCase().split(" ")[0]) || (currentMember.phone && c.phone === currentMember.phone))), [contributionsList, currentMember]);
  const userTotalContributed = useMemo(() => userContributions.reduce((s, c) => s + (Number(c.amount) || 0), 0), [userContributions]);
  const hasPaidDues = useMemo(() => userContributions.some(c => c.purpose?.toLowerCase().includes("dues") || c.purpose?.toLowerCase().includes("membership") || (Number(c.amount) >= 500 && c.status === "Completed")), [userContributions]);
  const pendingClaims = claimsList.filter(c => c.status !== "Approved");
  const activeAppeals = appealsList.filter(a => a.is_active === 1 || a.is_active === true || a.is_active === "1");
  const monthlyData = useMemo(() => {
    const m: Record<string, { month: string; inAmt: number; outAmt: number }> = {};
    contributionsList.forEach(c => { const k = new Date(c.created_at).toLocaleString("en-US", { month: "short" }); if (!m[k]) m[k] = { month: k, inAmt: 0, outAmt: 0 }; m[k].inAmt += Number(c.amount) || 0; });
    claimsList.filter(c => c.status === "Approved").forEach(c => { const k = new Date(c.created_at).toLocaleString("en-US", { month: "short" }); if (!m[k]) m[k] = { month: k, inAmt: 0, outAmt: 0 }; m[k].outAmt += Number(c.amount) || 0; });
    return Object.values(m);
  }, [contributionsList, claimsList]);

  // CRUD
  const handleCreateEvent = async (e: React.FormEvent) => { e.preventDefault(); try { const r = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(eventForm) }); const d = await r.json(); if (d.success) { setCreateEventModal(false); setEventForm({ title: "", venue: "Mama Ngina Waterfront, Mombasa", category: "Cultural", day: "26", dow: "SAT", month: "APR", time: "9:00 AM – 6:00 PM", entryFee: "Free", description: "", isFeatured: false }); fetchAllEvents(); } else alert(d.message); } catch (err: any) { alert(err?.message); } };
  const handleDeleteEvent = async (id: any) => { if (!confirm("Remove this event?")) return; const r = await fetch(`/api/events?id=${id}`, { method: "DELETE" }); const d = await r.json(); if (d.success) fetchAllEvents(); };
  const handleToggleFeature = async (evt: any) => { await fetch("/api/events", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: evt.id, isFeatured: !evt.is_featured }) }); fetchAllEvents(); };

  const handlePublishNews = async (e: React.FormEvent) => { e.preventDefault(); if (!newsForm.title.trim() || !newsForm.content.trim()) return alert("Headline and content required."); const cleanImg = normalizeImageUrl(newsForm.imageUrl, "/images/landing-hero.png"); const r = await fetch("/api/news", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newsForm, imageUrl: cleanImg }) }); const d = await r.json(); if (d.success) { setNewsForm({ category: "Announcements", title: "", summary: "", content: "", imageUrl: "/images/landing-hero.png", author: "Mulembe Secretariat" }); fetchAllNews(); } else alert(d.message); };
  const handleUpdateNews = async (e: React.FormEvent) => { e.preventDefault(); if (!editingNews || !newsForm.title.trim() || !newsForm.content.trim()) return; const cleanImg = normalizeImageUrl(newsForm.imageUrl, "/images/landing-hero.png"); const r = await fetch("/api/news", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingNews.id, ...newsForm, imageUrl: cleanImg }) }); const d = await r.json(); if (d.success) { setEditingNews(null); setNewsForm({ category: "Announcements", title: "", summary: "", content: "", imageUrl: "/images/landing-hero.png", author: "Mulembe Secretariat" }); fetchAllNews(); } else alert(d.message); };
  const handleDeleteNews = async (id: any) => { if (!confirm("Delete this communiqué?")) return; const r = await fetch(`/api/news?id=${id}`, { method: "DELETE" }); const d = await r.json(); if (d.success) fetchAllNews(); };

  const handleCreateGallery = async (e: React.FormEvent) => { e.preventDefault(); if (!galleryForm.imageUrl.trim() && !galleryForm.albumUrl.trim()) return alert("Provide a photo URL or album link."); const cleanImg = galleryForm.imageUrl ? normalizeImageUrl(galleryForm.imageUrl, "/images/events-cultural.png") : ""; const r = await fetch("/api/gallery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...galleryForm, imageUrl: cleanImg, label: galleryForm.label.trim() || "Gallery Moment" }) }); const d = await r.json(); if (d.success) { setCreateGalleryModal(false); setEditingGallery(null); setGalleryForm({ imageUrl: "", albumUrl: "", label: "", category: "Cultural Festival", subLocation: "Mama Ngina Waterfront, Mombasa", isLarge: false, sortOrder: "0" }); fetchAllGallery(); } else alert(d.message); };
  const handleUpdateGallery = async (e: React.FormEvent) => { e.preventDefault(); if (!editingGallery) return; if (!galleryForm.imageUrl.trim() && !galleryForm.albumUrl.trim()) return alert("Provide a photo URL or album link."); const cleanImg = galleryForm.imageUrl ? normalizeImageUrl(galleryForm.imageUrl, "/images/events-cultural.png") : ""; const r = await fetch("/api/gallery", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingGallery.id, ...galleryForm, imageUrl: cleanImg }) }); const d = await r.json(); if (d.success) { setEditingGallery(null); setCreateGalleryModal(false); setGalleryForm({ imageUrl: "", albumUrl: "", label: "", category: "Cultural Festival", subLocation: "Mama Ngina Waterfront, Mombasa", isLarge: false, sortOrder: "0" }); fetchAllGallery(); } else alert(d.message); };
  const handleDeleteGallery = async (id: any) => { if (!confirm("Remove photo?")) return; const r = await fetch(`/api/gallery?id=${id}`, { method: "DELETE" }); const d = await r.json(); if (d.success) fetchAllGallery(); };

  const handleCreateLeader = async (e: React.FormEvent) => { e.preventDefault(); if (!leaderForm.name.trim()) return alert("Full name required."); const cleanAvatar = leaderForm.avatarUrl ? normalizeImageUrl(leaderForm.avatarUrl, "") : ""; const r = await fetch("/api/leadership", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...leaderForm, avatarUrl: cleanAvatar }) }); const d = await r.json(); if (d.success) { setCreateLeaderModal(false); setEditingLeader(null); setLeaderForm({ name: "", role: "Chairperson", clan: "Bukusu", phone: "", email: "", avatarUrl: "", bio: "", sortOrder: "1" }); fetchAllLeadership(); } else alert(d.message); };
  const handleUpdateLeader = async (e: React.FormEvent) => { e.preventDefault(); if (!editingLeader || !leaderForm.name.trim()) return; const cleanAvatar = leaderForm.avatarUrl ? normalizeImageUrl(leaderForm.avatarUrl, "") : ""; const r = await fetch("/api/leadership", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingLeader.id, ...leaderForm, avatarUrl: cleanAvatar }) }); const d = await r.json(); if (d.success) { setEditingLeader(null); setCreateLeaderModal(false); setLeaderForm({ name: "", role: "Chairperson", clan: "Bukusu", phone: "", email: "", avatarUrl: "", bio: "", sortOrder: "1" }); fetchAllLeadership(); } else alert(d.message); };
  const handleDeleteLeader = async (id: any) => { if (!confirm("Remove leader?")) return; const r = await fetch(`/api/leadership?id=${id}`, { method: "DELETE" }); const d = await r.json(); if (d.success) fetchAllLeadership(); };

  const handleApproveClaim = async (id: any) => { const r = await fetch("/api/welfare", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "Approved" }) }); const d = await r.json(); if (d.success) fetchAllClaims(); };
  const handleDeleteClaim = async (id: any) => { if (!confirm("Remove record?")) return; const r = await fetch(`/api/welfare?id=${id}`, { method: "DELETE" }); const d = await r.json(); if (d.success) fetchAllClaims(); };
  const handleVerifyMember = async (id: any) => { const r = await fetch("/api/members", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "Verified" }) }); const d = await r.json(); if (d.success) fetchAllMembers(); };
  const handleDeleteMember = async (id: any) => { if (!confirm("Remove member?")) return; const r = await fetch(`/api/members?id=${id}`, { method: "DELETE" }); const d = await r.json(); if (d.success) fetchAllMembers(); };

  const handleUpdateMemberStatus = async (memberId: number, newStatus: string) => {
    try {
      const res = await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAllMembers();
        fetchDispatchData();
      } else {
        alert(data.message || "Failed to update member status.");
      }
    } catch (err: any) {
      alert(err?.message || "Network error");
    }
  };

  const handleSendDispatch = async () => {
    if (!dispatchMessage.trim()) return alert("Message body cannot be empty.");
    if ((dispatchChannel === "email" || dispatchChannel === "both") && !dispatchSubject.trim()) {
      return alert("Email subject line is required.");
    }
    if (dispatchTargetType === "selected" && selectedRecipientIds.length === 0) {
      return alert("Please select at least one recipient member.");
    }

    setDispatchSubmitting(true);
    try {
      const res = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: dispatchChannel,
          targetType: dispatchTargetType === "all" ? "all_in_scope" : "selected_members",
          selectedMemberIds: dispatchTargetType === "all" ? undefined : selectedRecipientIds,
          subject: dispatchSubject.trim(),
          message: dispatchMessage.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDispatchConfirmModalOpen(false);
        setDispatchMessage("");
        setDispatchSubject("");
        setSelectedRecipientIds([]);
        setDispatchNotice({ type: "success", text: data.message || "Dispatch sent successfully!" });
        setTimeout(() => setDispatchNotice(null), 6000);
        await fetchDispatchData();
      } else {
        alert(data.message || "Failed to broadcast dispatch.");
      }
    } catch (err: any) {
      alert("Dispatch error: " + (err?.message || "Network error"));
    } finally {
      setDispatchSubmitting(false);
    }
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim()) return alert("Area name is required.");
    setCreatingArea(true);
    try {
      const targetWard = isWardLeader ? (currentMember?.ward_leader_ward || currentMember?.ward) : newAreaWard;
      const res = await fetch("/api/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAreaName.trim(),
          ward: targetWard,
          subcounty: newAreaSubcounty || currentMember?.subcounty || "Mombasa",
          county: newAreaCounty || currentMember?.county || "Mombasa",
          description: newAreaDesc.trim(),
          contactInfo: newAreaContact.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewAreaName("");
        setNewAreaDesc("");
        setNewAreaContact("");
        fetchAllAreas();
        if (targetWard) fetchWardAreas(targetWard);
        alert("Area created successfully!");
      } else {
        alert(data.message || "Failed to create area.");
      }
    } catch (err: any) {
      alert("Error creating area: " + err?.message);
    } finally {
      setCreatingArea(false);
    }
  };

  const handleAssignAreaLeader = async (areaId: number, memberId: number) => {
    setAssigningAreaLeader(true);
    try {
      const res = await fetch("/api/admin/assign-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetMemberId: memberId,
          newRole: "area_leader",
          areaId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAssignLeaderModalArea(null);
        setSelectedAreaLeaderId("");
        fetchAllAreas();
        fetchAllMembers();
        alert("Area leader assigned successfully!");
      } else {
        alert(data.message || "Failed to assign area leader.");
      }
    } catch (err: any) {
      alert("Error assigning area leader: " + err?.message);
    } finally {
      setAssigningAreaLeader(false);
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleModalMember) return;
    setAssigningRole(true);
    try {
      const res = await fetch("/api/admin/assign-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetMemberId: roleModalMember.id,
          newRole: assignedRole,
          county: assignedRole === "county_leader" ? assignedCounty : undefined,
          subcountyZone: assignedRole === "subcounty_admin" ? assignedZone : undefined,
          ward: assignedRole === "ward_leader" ? assignedWard : undefined,
          areaId: assignedRole === "area_leader" && assignedAreaId ? Number(assignedAreaId) : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Role updated successfully!");
        setRoleModalMember(null);
        fetchAllMembers();
      } else {
        alert(data.message || "Failed to update role.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setAssigningRole(false);
    }
  };

  const handleUpdateMemberArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAreaId) return;
    setSavingArea(true);
    try {
      const res = await fetch("/api/member/area", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaId: selectedAreaId }),
      });
      const data = await res.json();
      if (data.success) {
        setAreaChangeSuccess(true);
        setTimeout(() => setAreaChangeSuccess(false), 3500);
        await fetchHierarchy();
        await fetchAllMembers();
      } else {
        alert(data.message || "Failed to update area.");
      }
    } catch {
      alert("Network error updating area.");
    } finally {
      setSavingArea(false);
    }
  };
  const handleDeleteContribution = async (id: any) => { if (!confirm("Remove record?")) return; const r = await fetch(`/api/contributions?id=${id}`, { method: "DELETE" }); const d = await r.json(); if (d.success) fetchAllContributions(); };
  const handleAddContribution = async (e: React.FormEvent) => { e.preventDefault(); const r = await fetch("/api/contributions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(contribForm) }); const d = await r.json(); if (d.success) { setAddContribModal(false); setContribForm({ memberName: "", phone: "", amount: "", purpose: "Annual Dues" }); fetchAllContributions(); } else alert(d.message); };
  const handleCreateAppeal = async (e: React.FormEvent) => { e.preventDefault(); const r = await fetch("/api/appeals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(appealForm) }); const d = await r.json(); if (d.success) { setCreateAppealModal(false); setAppealForm({ title: "", familyName: "", location: "", goalAmount: "", raisedAmount: "0", description: "" }); fetchAllAppeals(); } else alert(d.message); };
  const handleToggleAppealActive = async (id: any, current: boolean) => { await fetch("/api/appeals", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isActive: !current }) }); fetchAllAppeals(); };
  const handleDeleteAppeal = async (id: any) => { if (!confirm("Delete appeal?")) return; const r = await fetch(`/api/appeals?id=${id}`, { method: "DELETE" }); const d = await r.json(); if (d.success) fetchAllAppeals(); };

  const handlePayDues = async (e: React.FormEvent) => {
    e.preventDefault(); setPayStatus("sending");
    try { await fetch("/api/contributions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberName: currentMember?.full_name || user?.fullName || "Member", phone: payPhone || "0700000000", amount: 500, purpose: "Annual Membership Dues (2025)" }) }); fetchAllContributions(); setPayStatus("success"); setTimeout(() => { setPayStatus("idle"); setPayModalOpen(false); }, 2500); } catch { setPayStatus("success"); setTimeout(() => { setPayStatus("idle"); setPayModalOpen(false); }, 2500); }
  };
  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await fetch("/api/welfare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ claimantName: user?.fullName || "Member", subClan: currentMember?.sub_clan || "Luhya", residentialZone: currentMember?.residential_zone || "Mombasa", claimType, amount: claimAmount, description: claimDesc }) }); setClaimSuccess(true); fetchAllClaims(); setTimeout(() => { setClaimSuccess(false); setClaimModalOpen(false); setClaimDesc(""); }, 2500); } catch { setClaimSuccess(true); setTimeout(() => { setClaimSuccess(false); setClaimModalOpen(false); setClaimDesc(""); }, 2500); }
  };
  const handleDonateToAppeal = async (e: React.FormEvent) => {
    e.preventDefault(); if (!appealDonateModal || !appealDonatePhone) return; setAppealDonateStatus("sending");
    try { const amt = Number(appealDonateAmount) || 500; await fetch("/api/contributions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberName: user?.fullName || "Member", phone: appealDonatePhone, amount: amt, purpose: `Appeal: ${appealDonateModal.title}` }) }); await fetch("/api/appeals", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: appealDonateModal.id, raisedAmount: (Number(appealDonateModal.raised_amount) || 0) + amt }) }); fetchAllAppeals(); fetchAllContributions(); setAppealDonateStatus("success"); setTimeout(() => { setAppealDonateStatus("idle"); setAppealDonateModal(null); setAppealDonatePhone(""); }, 3000); } catch (err: any) { alert("Error: " + err?.message); setAppealDonateStatus("idle"); }
  };

  // Nav
  const memberNav = [
    { id: "overview", label: "Profile & ID Card", icon: QrCode, color: "text-[#DDA71D] bg-[#DDA71D]/10" },
    { id: "my-leadership", label: "My Leadership", icon: ShieldCheck, color: "text-amber-400 bg-amber-500/10" },
    { id: "contributions", label: "Welfare & Receipts", icon: Receipt, color: "text-emerald-400 bg-emerald-500/10" },
    { id: "events", label: "Event Passes", icon: Ticket, color: "text-blue-400 bg-blue-500/10" },
    { id: "welfare-claim", label: "Emergency Aid", icon: HeartHandshake, color: "text-rose-400 bg-rose-500/10" },
    { id: "clan-desk", label: "Clan Elders Desk", icon: Landmark, color: "text-amber-400 bg-amber-500/10" },
  ];
  const adminNav = [
    { id: "analytics", label: "Overview & Stats", icon: BarChart3, badge: null as number | null, color: "text-emerald-400 bg-emerald-500/10" },
    { id: "dispatch", label: "SMS & Email Dispatch", icon: Send, badge: null as number | null, color: "text-amber-400 bg-amber-500/10" },
    { id: "members", label: "Registry & Approvals", icon: Users, badge: membersList.length || null, color: "text-blue-400 bg-blue-500/10" },
    { id: "areas", label: "Areas & Zones", icon: Layers, badge: allAreasList.length || null, color: "text-teal-400 bg-teal-500/10" },
    { id: "broadcast", label: "Communiqués", icon: Megaphone, badge: newsList.length || null, color: "text-purple-400 bg-purple-500/10" },
    { id: "events", label: "Events", icon: Calendar, badge: eventsList.length || null, color: "text-[#DDA71D] bg-[#DDA71D]/10" },
    { id: "claims", label: "Claims", icon: AlertCircle, badge: pendingClaims.length || null, color: "text-rose-400 bg-rose-500/10" },
    { id: "solidarity", label: "Solidarity Fund", icon: CreditCard, badge: null as number | null, color: "text-cyan-400 bg-cyan-500/10" },
    { id: "gallery", label: "Gallery", icon: ImageIcon, badge: galleryList.length || null, color: "text-pink-400 bg-pink-500/10" },
    { id: "leadership", label: "Leadership Council", icon: Crown, badge: leadershipList.length || null, color: "text-amber-400 bg-amber-500/10" },
  ];

  const currentAdminNav = useMemo(() => {
    if (isAreaLeader) {
      return adminNav.filter((n) => ["analytics", "dispatch", "members", "broadcast"].includes(n.id));
    }
    if (isWardLeader) {
      return adminNav.filter((n) => ["analytics", "dispatch", "members", "areas", "broadcast", "events"].includes(n.id));
    }
    if (isSubcountyAdmin) {
      return adminNav.filter((n) => ["analytics", "dispatch", "members", "areas", "broadcast", "events"].includes(n.id));
    }
    if (isCountyLeader) {
      return adminNav.filter((n) => ["analytics", "dispatch", "members", "areas", "broadcast", "events", "claims"].includes(n.id));
    }
    return adminNav; // Super Admin / National Leader
  }, [isAreaLeader, isWardLeader, isSubcountyAdmin, isCountyLeader, adminNav]);

  const currentNav = role === "member" ? memberNav : currentAdminNav;
  const currentTab = role === "member" ? memberTab : adminTab;

  const NavItem = ({ item }: { item: any }) => {
    const Icon = item.icon;
    const isActive = currentTab === item.id;
    const handleClick = () => { if (role === "member") setMemberTab(item.id as MemberTab); else setAdminTab(item.id as AdminTab); setMobileMenuOpen(false); };
    if (isCollapsed) return (
      <button type="button" onClick={handleClick} title={item.label} className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all relative cursor-pointer ${isActive ? "bg-[#DDA71D] text-[#082f1a]" : "text-emerald-200/80 hover:bg-white/10 hover:text-white"}`}>
        <Icon size={17} />
        {item.badge != null && item.badge > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">{item.badge > 99 ? "99+" : item.badge}</span>}
      </button>
    );
    return (
      <button type="button" onClick={handleClick} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all group relative cursor-pointer ${isActive ? "bg-white/10 text-white border border-white/10" : "text-emerald-200/70 hover:bg-white/5 hover:text-white"}`}>
        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[#DDA71D]" />}
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? (role === "leader" ? "bg-[#00A859] text-white" : "bg-[#DDA71D] text-[#082f1a]") : item.color}`}><Icon size={14} /></div>
        <span className="text-[12px] font-semibold truncate flex-1">{item.label}</span>
        {item.badge != null && item.badge > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-white flex-shrink-0">{item.badge}</span>}
      </button>
    );
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0D6E38] focus:border-transparent";
  const btnPrimary = "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D6E38] hover:bg-[#0a4d29] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer";
  const btnSecondary = "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer";
  const btnDanger = "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer";

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#082f1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-[#DDA71D] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-emerald-200 tracking-wide">Loading Mulembe18 Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#18221B] flex flex-col md:flex-row font-sans">

      {/* SIDEBAR */}
      <aside className={`bg-[#082f1a] text-white flex flex-col justify-between border-r border-emerald-900/50 md:sticky md:top-0 md:h-screen z-40 shadow-xl flex-shrink-0 transition-all duration-300 ${isCollapsed ? "w-full md:w-[68px]" : "w-full md:w-56"}`}>
        <div className={`border-b border-emerald-900/60 ${isCollapsed ? "p-2.5" : "p-3"}`}>
          {!isCollapsed ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-white/10 border border-[#DDA71D]/40 flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform flex-shrink-0">
                    <img src="/images/logo.png" alt="Mulembe18" className="w-full h-full object-contain rounded-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-white" style={{ fontFamily: "var(--font-outfit)" }}>mulembe<span className="text-[#DDA71D]">18</span></div>
                    <div className="text-[9px] text-emerald-400 uppercase tracking-widest font-semibold">Kenya Chapter</div>
                  </div>
                </Link>
                <button type="button" onClick={() => setIsCollapsed(true)} className="hidden md:flex p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-emerald-300 cursor-pointer"><PanelLeftClose size={13} /></button>
              </div>
              <div className="px-2.5 py-1.5 rounded-xl bg-black/30 border border-emerald-900/70 flex items-center gap-2">
                {isNationalLeader ? (
                  <>
                    <Award size={13} className="text-[#DDA71D] flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-white uppercase tracking-wider">National Leader</div>
                      <div className="text-[9px] text-[#DDA71D] font-semibold truncate">All 47 Counties</div>
                    </div>
                  </>
                ) : isSuperAdmin ? (
                  <>
                    <Shield size={13} className="text-[#DDA71D] flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-white uppercase tracking-wider">Super Admin</div>
                      <div className="text-[9px] text-[#DDA71D] font-semibold truncate">National Governance</div>
                    </div>
                  </>
                ) : isCountyLeader ? (
                  <>
                    <Building size={13} className="text-[#DDA71D] flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-white uppercase tracking-wider">County Leader</div>
                      <div className="text-[9px] text-[#DDA71D] font-semibold truncate">{currentMember?.county_leader_county || currentMember?.county || "County"}</div>
                    </div>
                  </>
                ) : currentMember?.role === "subcounty_admin" || isSubcountyAdmin ? (
                  <>
                    <Building size={13} className="text-blue-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-white uppercase tracking-wider">Subcounty Leader</div>
                      <div className="text-[9px] text-blue-300 font-semibold truncate">{currentMember?.subcounty_admin_zone || currentMember?.subcounty || "Subcounty"}</div>
                    </div>
                  </>
                ) : currentMember?.role === "ward_leader" || isWardLeader ? (
                  <>
                    <Crown size={13} className="text-amber-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-white uppercase tracking-wider">Ward Leader</div>
                      <div className="text-[9px] text-amber-300 font-semibold truncate">{currentMember?.ward_leader_ward || currentMember?.ward || "Ward"}</div>
                    </div>
                  </>
                ) : currentMember?.role === "area_leader" || isAreaLeader ? (
                  <>
                    <MapPin size={13} className="text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-white uppercase tracking-wider">Area Leader</div>
                      <div className="text-[9px] text-emerald-300 font-semibold truncate">{currentMember?.area_name || "Local Area"}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <Users size={13} className="text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-white uppercase tracking-wider">Member Portal</div>
                      <div className="text-[9px] text-emerald-300/80 font-semibold truncate">Mulembe18 Kenya Community</div>
                    </div>
                  </>
                )}
              </div>
              {isLeader && (
                <div className="flex bg-black/40 rounded-xl p-0.5 border border-emerald-900/60 mt-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("leader")}
                    className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      viewMode === "leader" ? "bg-[#0D6E38] text-white shadow-sm" : "text-emerald-300/70 hover:text-white"
                    }`}
                  >
                    <Shield size={11} />
                    <span>Workspace</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("member")}
                    className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      viewMode === "member" ? "bg-[#DDA71D] text-[#082f1a] shadow-sm" : "text-emerald-300/70 hover:text-white"
                    }`}
                  >
                    <Users size={11} />
                    <span>My Profile</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link href="/"><div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 border border-[#DDA71D]/40 p-0.5"><img src="/images/logo.png" alt="Mulembe18" className="w-full h-full object-contain rounded-lg" /></div></Link>
              <button type="button" onClick={() => setIsCollapsed(false)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-emerald-300 flex items-center justify-center cursor-pointer"><PanelLeftOpen size={13} /></button>
              <div className="w-full flex flex-col items-center gap-1 pt-1 border-t border-emerald-900/60">
                <button
                  type="button"
                  onClick={() => isLeader && setViewMode(viewMode === "leader" ? "member" : "leader")}
                  title={role === "leader" ? "Leadership Workspace (Click to toggle)" : "Member Portal (Click to toggle)"}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer ${
                    role === "leader" ? "bg-[#0D6E38] text-[#DDA71D]" : "bg-white/10 text-emerald-300"
                  }`}
                >
                  {role === "leader" ? <Shield size={14} /> : <Users size={14} />}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={`p-2 flex-1 overflow-y-auto space-y-0.5 ${mobileMenuOpen ? "block" : "hidden md:block"}`}>
          {!isCollapsed && <div className="text-[9px] uppercase font-bold tracking-widest text-emerald-700/80 px-2 py-1.5 flex items-center gap-1.5"><Compass size={9} />{role === "member" ? "Member Services" : "Leadership Console"}</div>}
          {currentNav.map(item => <NavItem key={item.id} item={item} />)}

          {/* Quick Leadership Dashboards (Role-based) */}
          {!isCollapsed && (
            <div className="pt-2 mt-2 border-t border-emerald-900/60 space-y-1">
              {role === "leader" && (
                <>
                  <div className="text-[9px] uppercase font-bold tracking-widest text-[#DDA71D] px-2 py-1 flex items-center gap-1">
                    <Shield size={9} /> Jurisdictions
                  </div>
                  {(isSuperAdmin || isCountyLeader) && (
                    <Link
                      href="/subcounty-dashboard"
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-blue-400/10 hover:bg-blue-400/20 text-blue-300 border border-blue-400/30 text-[11px] font-bold transition-all"
                    >
                      <Building size={12} className="text-blue-400 flex-shrink-0" />
                      <span className="truncate">Subcounty Console</span>
                    </Link>
                  )}
                  {(isSuperAdmin || isCountyLeader || isSubcountyAdmin || isWardLeader) && (
                    <Link
                      href="/ward-dashboard"
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold transition-all"
                    >
                      <Crown size={12} className="text-amber-400 flex-shrink-0" />
                      <span className="truncate">Ward Leader Console</span>
                    </Link>
                  )}
                  {(isSuperAdmin || isCountyLeader || isSubcountyAdmin || isWardLeader || isAreaLeader) && (
                    <Link
                      href="/area-dashboard"
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold transition-all"
                    >
                      <MapPin size={12} className="text-emerald-400 flex-shrink-0" />
                      <span className="truncate">Area Leader Console</span>
                    </Link>
                  )}
                </>
              )}

              {role === "member" && isLeader && (
                <button
                  type="button"
                  onClick={() => setViewMode("leader")}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl bg-gradient-to-r from-emerald-950 to-[#0D6E38] text-white border border-[#DDA71D]/40 text-[11px] font-bold shadow-sm transition-all cursor-pointer hover:border-[#DDA71D]"
                >
                  <Shield size={13} className="text-[#DDA71D] flex-shrink-0" />
                  <span className="truncate">Open Leadership Console</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className={`border-t border-emerald-900/50 bg-black/10 ${isCollapsed ? "p-2 flex flex-col items-center gap-2" : "p-2.5"}`}>
          {mounted && (
            !isCollapsed ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <UserButton appearance={{ elements: { avatarBox: "w-7 h-7 rounded-xl border border-[#DDA71D]/30" } }} />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-white truncate" suppressHydrationWarning>{user?.fullName || "Member"}</div>
                    <div className="text-[9px] text-emerald-400 truncate" suppressHydrationWarning>{user?.primaryEmailAddress?.emailAddress || "mulembe18.com"}</div>
                  </div>
                </div>
                <Link href="/" className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-emerald-300 hover:text-white flex-shrink-0"><LogOut size={12} /></Link>
              </div>
            ) : (
              <><UserButton appearance={{ elements: { avatarBox: "w-8 h-8 rounded-xl border border-[#DDA71D]/30" } }} /><Link href="/" className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-emerald-300"><LogOut size={12} /></Link></>
            )
          )}
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsCollapsed(!isCollapsed)} className="hidden md:flex p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-[#0D6E38] hover:border-[#0D6E38] transition-colors cursor-pointer">{isCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}</button>
            <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-1.5 rounded-lg border border-gray-200 text-gray-500 cursor-pointer">{mobileMenuOpen ? <X size={15} /> : <Menu size={15} />}</button>
            <div>
              <h1 className="text-sm font-bold text-[#18221B]" style={{ fontFamily: "var(--font-outfit)" }}>
                {role === "member"
                  ? memberTab === "overview"
                    ? "My Profile & Digital ID"
                    : memberTab === "my-leadership"
                    ? "My Leadership Hierarchy"
                    : memberTab === "contributions"
                    ? "Welfare Ledger"
                    : memberTab === "events"
                    ? "Event Passes"
                    : memberTab === "welfare-claim"
                    ? "Emergency Aid"
                    : "Clan Desk"
                  : adminTab === "analytics"
                  ? "Executive Overview & Metrics"
                  : adminTab === "dispatch"
                  ? "SMS & Email Broadcast Dispatch"
                  : adminTab === "members"
                  ? "Member Registry & KYC Approvals"
                  : adminTab === "areas"
                  ? "Ward & Area Management"
                  : adminTab === "events"
                  ? "Events Manager"
                  : adminTab === "claims"
                  ? "Claims Review"
                  : adminTab === "solidarity"
                  ? "Solidarity Fund"
                  : adminTab === "broadcast"
                  ? "Communiqués"
                  : adminTab === "gallery"
                  ? "Gallery Manager"
                  : "Leadership Council"}
              </h1>
              <p className="text-[10px] text-gray-500 font-medium">
                {role === "member" ? "Personal Member Portal" : jurisdictionLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {role === "member" && <button type="button" onClick={() => setPayModalOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00A859] hover:bg-[#00914c] text-white text-xs font-bold shadow-sm cursor-pointer"><Smartphone size={13} /><span className="hidden sm:inline">Pay Dues</span></button>}
            {role === "leader" && adminTab === "dispatch" && (
              <button
                type="button"
                onClick={() => {
                  setDispatchChannel("both");
                  setDispatchTargetType("all");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D6E38] hover:bg-[#0a4d29] text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                <Send size={13} />
                <span className="hidden sm:inline">New Dispatch</span>
              </button>
            )}
            {role === "leader" && adminTab === "events" && <button type="button" onClick={() => setCreateEventModal(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#082f1a] text-[#DDA71D] hover:bg-[#0d4d28] text-xs font-bold shadow-sm cursor-pointer"><Plus size={13} /><span className="hidden sm:inline">Add Event</span></button>}
            {role === "leader" && adminTab === "gallery" && <button type="button" onClick={() => { setEditingGallery(null); setGalleryForm({ imageUrl: "", albumUrl: "", label: "", category: "Cultural Festival", subLocation: "Mama Ngina Waterfront, Mombasa", isLarge: false, sortOrder: "0" }); setCreateGalleryModal(true); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#082f1a] text-[#DDA71D] hover:bg-[#0d4d28] text-xs font-bold shadow-sm cursor-pointer"><Plus size={13} /><span className="hidden sm:inline">Add Photo</span></button>}
            {role === "leader" && adminTab === "leadership" && <button type="button" onClick={() => { setEditingLeader(null); setLeaderForm({ name: "", role: "Chairperson", clan: "Bukusu", phone: "", email: "", avatarUrl: "", bio: "", sortOrder: String(leadershipList.length + 1) }); setCreateLeaderModal(true); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#082f1a] text-[#DDA71D] hover:bg-[#0d4d28] text-xs font-bold shadow-sm cursor-pointer"><Plus size={13} /><span className="hidden sm:inline">Add Leader</span></button>}
            {role === "leader" && adminTab === "solidarity" && <button type="button" onClick={() => setAddContribModal(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#082f1a] text-[#DDA71D] hover:bg-[#0d4d28] text-xs font-bold shadow-sm cursor-pointer"><Plus size={13} /><span className="hidden sm:inline">Record</span></button>}
            {role === "leader" && adminTab === "claims" && <button type="button" onClick={() => setCreateAppealModal(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#082f1a] text-[#DDA71D] hover:bg-[#0d4d28] text-xs font-bold shadow-sm cursor-pointer"><PlusCircle size={13} /><span className="hidden sm:inline">New Appeal</span></button>}
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-5 flex-1">

          {/* MEMBER: OVERVIEW */}
          {role === "member" && memberTab === "overview" && (
            <div className="space-y-5 animate-fade-in">
              <div className={`p-3.5 rounded-2xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${hasPaidDues ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
                <div className="flex items-center gap-2.5">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${hasPaidDues ? "bg-emerald-600" : "bg-amber-600"}`}>{hasPaidDues ? <Check size={15} className="text-white" /> : <Clock size={15} className="text-white" />}</span>
                  <div><span className="font-bold" suppressHydrationWarning>Welcome, {user?.firstName || currentMember?.full_name || "Member"}!</span>{" "}<span className={hasPaidDues ? "text-emerald-800" : "text-amber-800"}>{hasPaidDues ? "Your 2025 membership is active." : "Annual dues (KES 500) pending — welfare cover paused."}</span></div>
                </div>
                {!hasPaidDues && <button type="button" onClick={() => setPayModalOpen(true)} className="px-3 py-1.5 rounded-xl bg-[#00A859] text-white text-xs font-bold whitespace-nowrap cursor-pointer">Pay KES 500</button>}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-5 space-y-4">
                  <div className="relative glass-card-dark rounded-2xl p-5 text-white shadow-xl border border-white/15 overflow-hidden">
                    <BorderBeam size={200} duration={14} colorFrom="#DDA71D" colorTo="#0077B6" />
                    <div className="flex items-start justify-between relative z-10 mb-5">
                      <div className="flex items-center gap-2.5">
                        <img src="/images/logo.png" alt="Logo" className="w-9 h-9 rounded-xl border border-[#DDA71D]/50" />
                        <div><div className="text-sm font-extrabold text-white" style={{ fontFamily: "var(--font-outfit)" }}>mulembe<span className="text-[#DDA71D]">18</span></div><div className="text-[9px] uppercase tracking-widest text-emerald-300 font-bold">Digital ID Card</div></div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${hasPaidDues ? "bg-[#00A859] text-white" : "bg-amber-500 text-white"}`}>{hasPaidDues ? <><CheckCircle2 size={10} />Active</> : <><Clock size={10} />Pending</>}</span>
                    </div>
                    <div className="space-y-3 relative z-10">
                      <div><div className="text-[9px] text-emerald-300/60 uppercase font-semibold">Member Name</div><div className="text-xl font-black" style={{ fontFamily: "var(--font-outfit)" }}>{currentMember?.full_name || user?.fullName || "Community Member"}</div></div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div><div className="text-[9px] text-emerald-300/60 uppercase font-semibold">Sub-Community</div><div className="font-bold text-[#DDA71D]">{currentMember?.sub_clan || "Western Kenya"}</div></div>
                        <div><div className="text-[9px] text-emerald-300/60 uppercase font-semibold">Zone</div><div className="font-bold text-white">{currentMember?.residential_zone || "Mombasa County"}</div></div>
                        <div><div className="text-[9px] text-emerald-300/60 uppercase font-semibold">Member ID</div><div className="font-mono font-bold text-emerald-200 text-[11px]" suppressHydrationWarning>{currentMember?.membership_number || (user ? `MLB-${user.id.slice(-6).toUpperCase()}` : "MLB-MEMBER")}</div></div>
                        <div><div className="text-[9px] text-emerald-300/60 uppercase font-semibold">Coverage</div><div className={`font-bold ${hasPaidDues ? "text-[#00A859]" : "text-amber-400"}`}>{hasPaidDues ? "Active 2025" : "Inactive"}</div></div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-emerald-800/40 flex items-center justify-between relative z-10">
                      <div className="text-[9px] text-emerald-300/50">Scan at Cultural Day & Assemblies</div>
                      <div className="w-10 h-10 bg-white rounded-xl p-1.5 flex items-center justify-center shadow"><QrCode size={26} className="text-[#082f1a]" /></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setPayModalOpen(true)} className="glass-card p-4 rounded-2xl flex flex-col items-center text-center hover:border-[#00A859]/50 transition-all group shadow-sm cursor-pointer">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00A859] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><Smartphone size={18} /></div>
                      <span className="text-xs font-bold">Pay Dues</span><span className="text-[10px] text-gray-400">KES 500</span>
                    </button>
                    <button type="button" onClick={() => setClaimModalOpen(true)} className="glass-card p-4 rounded-2xl flex flex-col items-center text-center hover:border-rose-400/50 transition-all group shadow-sm cursor-pointer">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><HeartHandshake size={18} /></div>
                      <span className="text-xs font-bold">Emergency Aid</span><span className="text-[10px] text-gray-400">Submit Claim</span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"><div className="text-[10px] text-gray-400 font-semibold mb-1">2025 Dues</div><div className={`text-base font-extrabold flex items-center gap-1 ${hasPaidDues ? "text-[#00A859]" : "text-amber-600"}`}>{hasPaidDues ? <><CheckCircle2 size={14} />Paid</> : <><Clock size={14} />Due</>}</div></div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"><div className="text-[10px] text-gray-400 font-semibold mb-1">Contributed</div><div className="text-sm font-extrabold text-[#0D6E38]">KES {userTotalContributed.toLocaleString()}</div><div className="text-[9px] text-gray-400">{userContributions.length} tx</div></div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"><div className="text-[10px] text-gray-400 font-semibold mb-1">Events</div><div className="text-base font-extrabold text-[#DDA71D]">{eventsList.length}</div><div className="text-[9px] text-gray-400">Upcoming</div></div>
                  </div>

                  <div className={`p-4 rounded-2xl flex items-start gap-3 border ${hasPaidDues ? "bg-gradient-to-r from-emerald-950/90 to-[#0a4d29]/90 border-emerald-700/30" : "bg-gradient-to-r from-amber-950/90 to-[#4d360a]/90 border-amber-600/30"} text-white`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${hasPaidDues ? "bg-[#DDA71D]/20 text-[#DDA71D]" : "bg-amber-400/20 text-amber-400"}`}>{hasPaidDues ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}</div>
                    <div><h4 className="text-xs font-bold">{hasPaidDues ? "Welfare Safety Net Active" : "Activate Your Safety Net"}</h4><p className="text-[11px] text-white/65 mt-0.5 leading-relaxed">{hasPaidDues ? "KES 50,000 bereavement cover active. Emergency transit and elder council representation included." : "Pay KES 500 to unlock KES 50,000 bereavement cover, hospital welfare, and voting rights."}</p></div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between"><h4 className="text-xs font-bold">Community Treasury</h4><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#0D6E38] flex items-center gap-1"><ShieldCheck size={10} />Audited</span></div>
                    <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#082f1a] to-[#0D6E38] text-white">
                      <div className="text-[9px] uppercase font-bold tracking-widest text-[#DDA71D]">Welfare Reserve</div>
                      <div className="text-xl font-extrabold mt-1" style={{ fontFamily: "var(--font-outfit)" }}>KES <NumberTicker value={totalReserve} /></div>
                      <div className="text-[10px] text-emerald-200/60 pt-2 border-t border-emerald-700/40 mt-2">30-Day: KES {monthlyCollection.toLocaleString()}</div>
                    </div>
                    <button type="button" onClick={() => setMemberTab("contributions")} className="w-full py-2 rounded-xl border border-[#0D6E38]/30 text-[#0D6E38] hover:bg-[#0D6E38] hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer">View Full Ledger <ArrowRight size={11} /></button>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between"><h4 className="text-xs font-bold">Recent Contributions</h4><button type="button" onClick={() => setMemberTab("contributions")} className="text-[10px] font-bold text-[#0D6E38] hover:underline flex items-center gap-0.5 cursor-pointer">All <ChevronRight size={11} /></button></div>
                    {userContributions.length === 0 ? <p className="text-xs text-gray-400 text-center py-3">No payments recorded yet.</p> : userContributions.slice(0, 3).map(item => (
                      <div key={item.id} className="flex items-center justify-between text-xs py-2 border-b border-gray-50 last:border-0">
                        <div><div className="font-semibold text-gray-700">{item.purpose || "Welfare Contribution"}</div><div className="text-[10px] text-gray-400">{new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div></div>
                        <div className="font-bold text-[#0D6E38]">KES {Number(item.amount).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {activeAppeals.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /><h4 className="text-xs font-bold">Active Community Appeals</h4><span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">{activeAppeals.length} Active</span></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeAppeals.map(appeal => {
                      const goal = Number(appeal.goal_amount) || 1; const raised = Number(appeal.raised_amount) || 0; const pct = Math.min(100, Math.round((raised / goal) * 100));
                      return (
                        <div key={appeal.id} className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/60 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div><div className="text-xs font-bold text-[#18221B]">{appeal.title}</div>{appeal.location && <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={9} />{appeal.location}</div>}</div>
                            <button type="button" onClick={() => { setAppealDonateModal(appeal); setAppealDonateAmount("1000"); }} className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold flex items-center gap-1 flex-shrink-0 cursor-pointer"><Heart size={9} className="fill-white" />Support</button>
                          </div>
                          <div><div className="flex justify-between text-[10px] mb-1"><span className="font-bold text-[#0D6E38]">KES {raised.toLocaleString()}</span><span className="text-gray-400">{pct}% of {goal.toLocaleString()}</span></div><div className="w-full h-1.5 rounded-full bg-gray-200"><div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full" style={{ width: `${pct}%` }} /></div></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MEMBER: MY LEADERSHIP HIERARCHY */}
          {role === "member" && memberTab === "my-leadership" && (
            <div className="space-y-5 animate-fade-in">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-[#082f1a] to-[#0D6E38] rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
                <BorderBeam size={160} duration={14} colorFrom="#DDA71D" colorTo="#0077B6" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#DDA71D]/20 text-[#DDA71D] text-[10px] font-bold">
                      <ShieldCheck size={12} /> Grassroots Governance
                    </div>
                    <h3 className="text-lg font-black text-white" style={{ fontFamily: "var(--font-outfit)" }}>
                      My Leadership Hierarchy
                    </h3>
                    <p className="text-xs text-emerald-200/80 max-w-xl leading-relaxed">
                      Your five-tier community representation across Kenya: Area, Ward, Subcounty, County, and National Council.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchHierarchy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold self-start md:self-center transition-colors cursor-pointer"
                  >
                    <RefreshCw size={12} className={loadingHierarchy ? "animate-spin" : ""} /> Refresh
                  </button>
                </div>
              </div>

              {/* Area Selection / Prompt Banner if no area selected */}
              {(!currentMember?.area_id || !hierarchyData?.area?.hasArea) && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={20} />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-sm font-bold text-amber-900">
                        Choose Your Local Area
                      </h4>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        You have not selected your residential area within <strong>{currentMember?.ward || "your ward"}</strong>.
                        Choosing your area connects you directly to your neighborhood Area Leader for immediate welfare assistance, baraza meeting alerts, and local representation.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateMemberArea} className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg">
                    {wardAreasList.length > 0 ? (
                      <>
                        <select
                          value={selectedAreaId}
                          onChange={(e) => setSelectedAreaId(e.target.value)}
                          className={inputCls + " flex-1"}
                          required
                        >
                          <option value="">-- Select an area in {currentMember?.ward || "your ward"} --</option>
                          {wardAreasList.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} {a.area_leader_name ? `(Leader: ${a.area_leader_name})` : ""}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          disabled={savingArea || !selectedAreaId}
                          className={btnPrimary + " whitespace-nowrap justify-center"}
                        >
                          {savingArea ? "Saving..." : "Confirm Area"}
                        </button>
                      </>
                    ) : (
                      <div className="text-xs text-amber-700 italic bg-amber-100/60 px-3 py-2 rounded-xl w-full">
                        Areas not yet available for {currentMember?.ward || "this ward"}. Your Ward Leader will upload and publish them soon.
                      </div>
                    )}
                  </form>
                  {areaChangeSuccess && (
                    <div className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 pt-1">
                      <CheckCircle2 size={13} /> Area updated successfully!
                    </div>
                  )}
                </div>
              )}

              {/* If member already has an area, offer a clean switcher */}
              {currentMember?.area_id && hierarchyData?.area?.hasArea && (
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0D6E38] flex items-center justify-center flex-shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <span className="text-gray-400">Assigned Area:</span>{" "}
                      <span className="font-bold text-gray-900">{currentMember.area_name || hierarchyData.area.name}</span>
                      <span className="text-gray-400"> ({currentMember.ward || hierarchyData.ward.name})</span>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateMemberArea} className="flex items-center gap-2">
                    <select
                      value={selectedAreaId}
                      onChange={(e) => setSelectedAreaId(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0D6E38]"
                    >
                      <option value="">Switch Area</option>
                      {wardAreasList.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={savingArea || !selectedAreaId || selectedAreaId === String(currentMember.area_id)}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-[#0D6E38] hover:text-white text-gray-700 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      {savingArea ? "Saving..." : "Change"}
                    </button>
                    {areaChangeSuccess && (
                      <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                        <Check size={12} /> Updated
                      </span>
                    )}
                  </form>
                </div>
              )}

              {/* 5-Tier Leadership Cards Grid */}
              {loadingHierarchy ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : (
                <div className="space-y-4">
                  {/* TIER 0: NATIONAL LEADERSHIP */}
                  {hierarchyData?.national && (
                    <div className="bg-gradient-to-r from-emerald-50 via-amber-50/50 to-white rounded-2xl border-2 border-[#DDA71D]/40 shadow-xs p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#0D6E38] text-white uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                          <Award size={12} className="text-[#DDA71D]" /> Level 1 · National Leadership Council
                        </span>
                        <Link href="/national-leaders" className="text-[11px] font-bold text-[#0D6E38] hover:underline flex items-center gap-1">
                          <span>View All National Leaders</span> &rarr;
                        </Link>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                        {hierarchyData.national.leaders?.map((nl: any, i: number) => (
                          <div key={i} className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0D6E38] to-[#082f1a] text-[#DDA71D] flex items-center justify-center font-bold text-xs flex-shrink-0 border border-[#DDA71D]/30">
                              {nl.name?.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-gray-900 truncate">{nl.name}</div>
                              <div className="text-[10px] text-[#0D6E38] font-semibold truncate">{nl.role}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* TIER 1: AREA LEADER */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4 hover:border-[#0D6E38]/30 transition-all relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-[#0D6E38] border border-emerald-200/60 uppercase tracking-wide flex items-center gap-1">
                        <MapPin size={10} /> Tier 1 · Local Area
                      </span>
                      <span className="text-[11px] font-bold text-gray-400">
                        {hierarchyData?.area?.name || "Unassigned Area"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0D6E38] to-[#082f1a] text-[#DDA71D] font-black text-base flex items-center justify-center border-2 border-[#DDA71D]/40 flex-shrink-0 shadow-sm">
                        {hierarchyData?.area?.isVacant ? "?" : hierarchyData?.area?.leader?.name?.slice(0, 2).toUpperCase() || "AL"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate">
                          {hierarchyData?.area?.leader?.name || "Position Vacant / To be appointed"}
                        </h4>
                        <div className="text-xs font-semibold text-[#0D6E38]">
                          {hierarchyData?.area?.leader?.role || "Area Leader"}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">
                          {hierarchyData?.area?.hasArea ? `Area: ${hierarchyData.area.name}` : "Please choose your area to view leader"}
                        </div>
                      </div>
                    </div>

                    {hierarchyData?.area?.isVacant ? (
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-gray-500 italic">
                        {hierarchyData?.area?.hasArea
                          ? "No Area Leader has been appointed yet for this area. Your Ward Leader will assign one."
                          : "Select an area above to view your local Area Leader."}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1.5 text-xs">
                        {hierarchyData?.area?.leader?.phone && hierarchyData?.area?.leader?.phone !== "—" && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-[11px]">Direct Phone:</span>
                            <a href={`tel:${hierarchyData.area.leader.phone}`} className="font-semibold text-[#0D6E38] hover:underline flex items-center gap-1">
                              <Phone size={11} /> {hierarchyData.area.leader.phone}
                            </a>
                          </div>
                        )}
                        {hierarchyData?.area?.leader?.email && hierarchyData?.area?.leader?.email !== "—" && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-[11px]">Email:</span>
                            <a href={`mailto:${hierarchyData.area.leader.email}`} className="font-semibold text-[#0D6E38] hover:underline flex items-center gap-1 truncate max-w-[180px]">
                              <Mail size={11} /> {hierarchyData.area.leader.email}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* TIER 2: WARD LEADER */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4 hover:border-[#DDA71D]/40 transition-all relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60 uppercase tracking-wide flex items-center gap-1">
                        <Crown size={10} className="text-[#DDA71D]" /> Tier 2 · Ward Level
                      </span>
                      <span className="text-[11px] font-bold text-gray-400">
                        {hierarchyData?.ward?.name || `${currentMember?.ward || "Ward"} Ward`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DDA71D] to-[#b3830c] text-white font-black text-base flex items-center justify-center border-2 border-amber-300 flex-shrink-0 shadow-sm">
                        {hierarchyData?.ward?.isVacant ? "?" : hierarchyData?.ward?.leader?.name?.slice(0, 2).toUpperCase() || "WL"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate">
                          {hierarchyData?.ward?.leader?.name || "Position Vacant / To be appointed"}
                        </h4>
                        <div className="text-xs font-semibold text-[#DDA71D]">
                          {hierarchyData?.ward?.leader?.role || "Ward Leader"}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">
                          Ward: {hierarchyData?.ward?.name || currentMember?.ward || "Not specified"}
                        </div>
                      </div>
                    </div>

                    {hierarchyData?.ward?.isVacant ? (
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-gray-500 italic">
                        Position vacant. Awaiting appointment by Subcounty Admin or Super Admin.
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 space-y-1.5 text-xs">
                        {hierarchyData?.ward?.leader?.phone && hierarchyData?.ward?.leader?.phone !== "—" && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-[11px]">Direct Phone:</span>
                            <a href={`tel:${hierarchyData.ward.leader.phone}`} className="font-semibold text-amber-900 hover:underline flex items-center gap-1">
                              <Phone size={11} /> {hierarchyData.ward.leader.phone}
                            </a>
                          </div>
                        )}
                        {hierarchyData?.ward?.leader?.email && hierarchyData?.ward?.leader?.email !== "—" && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-[11px]">Email:</span>
                            <a href={`mailto:${hierarchyData.ward.leader.email}`} className="font-semibold text-amber-900 hover:underline flex items-center gap-1 truncate max-w-[180px]">
                              <Mail size={11} /> {hierarchyData.ward.leader.email}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* TIER 3: SUBCOUNTY ADMIN */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4 hover:border-blue-300 transition-all relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wide flex items-center gap-1">
                        <Building size={10} /> Tier 3 · Subcounty
                      </span>
                      <span className="text-[11px] font-bold text-gray-400">
                        {hierarchyData?.subcounty?.name || `${currentMember?.subcounty || "Subcounty"} Subcounty`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 text-white font-black text-base flex items-center justify-center border-2 border-blue-300 flex-shrink-0 shadow-sm">
                        {hierarchyData?.subcounty?.isVacant ? "?" : hierarchyData?.subcounty?.leader?.name?.slice(0, 2).toUpperCase() || "SA"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate">
                          {hierarchyData?.subcounty?.leader?.name || "Position Vacant / To be appointed"}
                        </h4>
                        <div className="text-xs font-semibold text-blue-700">
                          {hierarchyData?.subcounty?.leader?.role || "Subcounty Administrator"}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">
                          Jurisdiction: {hierarchyData?.subcounty?.name || currentMember?.subcounty || "Mombasa"}
                        </div>
                      </div>
                    </div>

                    {hierarchyData?.subcounty?.isVacant ? (
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-gray-500 italic">
                        Position vacant. Awaiting appointment by Executive Council.
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1.5 text-xs">
                        {hierarchyData?.subcounty?.leader?.phone && hierarchyData?.subcounty?.leader?.phone !== "—" && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-[11px]">Direct Phone:</span>
                            <a href={`tel:${hierarchyData.subcounty.leader.phone}`} className="font-semibold text-blue-700 hover:underline flex items-center gap-1">
                              <Phone size={11} /> {hierarchyData.subcounty.leader.phone}
                            </a>
                          </div>
                        )}
                        {hierarchyData?.subcounty?.leader?.email && hierarchyData?.subcounty?.leader?.email !== "—" && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-[11px]">Email:</span>
                            <a href={`mailto:${hierarchyData.subcounty.leader.email}`} className="font-semibold text-blue-700 hover:underline flex items-center gap-1 truncate max-w-[180px]">
                              <Mail size={11} /> {hierarchyData.subcounty.leader.email}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* TIER 4: COUNTY EXECUTIVE */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4 hover:border-purple-300 transition-all relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60 uppercase tracking-wide flex items-center gap-1">
                        <Landmark size={10} /> Tier 4 · County Executive
                      </span>
                      <span className="text-[11px] font-bold text-gray-400">
                        {hierarchyData?.county?.name || "Mombasa County"}
                      </span>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {(hierarchyData?.county?.leaders || []).map((leader: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-gray-900 truncate">{leader.name}</div>
                            <div className="text-[10px] text-purple-700 font-semibold">{leader.role}</div>
                          </div>
                          {leader.phone && (
                            <a href={`tel:${leader.phone}`} className="p-1.5 rounded-lg bg-white border border-gray-200 text-[#0D6E38] hover:bg-emerald-50 text-[10px] font-semibold flex items-center gap-1">
                              <Phone size={11} /> <span className="hidden sm:inline">{leader.phone}</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          )}

          {/* MEMBER: CONTRIBUTIONS */}
          {role === "member" && memberTab === "contributions" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
              <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div><h3 className="text-sm font-bold">Welfare Ledger & M-Pesa Receipts</h3><p className="text-[11px] text-gray-400 mt-0.5">Synced with Safaricom Paybill 522522</p></div>
                <button type="button" onClick={() => alert("Downloading PDF...")} className={btnSecondary}><Download size={13} />Download Statement</button>
              </div>
              <div className="p-4 sm:p-5">
                {loadingContributions ? <div className="flex justify-center py-10"><Spinner /></div> : userContributions.length === 0 ? <EmptyState icon={Smartphone} title="No Contributions Yet" body="Your dues and M-Pesa payments will appear here with downloadable receipts." cta={<button type="button" onClick={() => setPayModalOpen(true)} className={btnPrimary}><Smartphone size={13} />Pay KES 500</button>} /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wide"><th className="py-2.5 px-3 text-left">Date</th><th className="py-2.5 px-3 text-left">Purpose</th><th className="py-2.5 px-3 text-left">Reference</th><th className="py-2.5 px-3 text-right">Amount</th><th className="py-2.5 px-3 text-center">Status</th></tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {userContributions.map(tx => (
                          <tr key={tx.id} className="hover:bg-gray-50/70">
                            <td className="py-3 px-3 text-gray-500">{new Date(tx.created_at).toLocaleDateString("en-GB")}</td>
                            <td className="py-3 px-3 font-semibold text-gray-800">{tx.purpose}</td>
                            <td className="py-3 px-3 font-mono text-[10px] text-gray-400">{tx.mpesa_code || tx.receipt_no}</td>
                            <td className="py-3 px-3 font-bold text-[#0D6E38] text-right">KES {Number(tx.amount).toLocaleString()}</td>
                            <td className="py-3 px-3 text-center"><Badge status={tx.status || "Completed"} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MEMBER: EVENTS */}
          {role === "member" && memberTab === "events" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 animate-fade-in">
              <h3 className="text-sm font-bold mb-0.5">My Event Passes</h3><p className="text-[11px] text-gray-400 mb-4">Present QR code at the gate for fast-track entry.</p>
              {eventsList.length === 0 ? <EmptyState icon={CalendarDays} title="No Events Scheduled" body="When gatherings, festivals, or AGMs are posted by the secretariat, your passes will appear here." /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {eventsList.map(evt => (
                    <div key={evt.id} className="glass-card-dark p-5 rounded-2xl text-white border border-white/15 shadow-xl relative overflow-hidden">
                      <BorderBeam size={140} duration={12} colorFrom="#DDA71D" colorTo="#0077B6" />
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DDA71D] text-[#082f1a] flex items-center gap-1"><Star size={9} className="fill-[#082f1a]" />{evt.category} Pass</span>
                        <div className="w-10 h-10 bg-white rounded-xl p-1 flex items-center justify-center"><QrCode size={26} className="text-[#082f1a]" /></div>
                      </div>
                      <h4 className="text-sm font-bold relative z-10" style={{ fontFamily: "var(--font-outfit)" }}>{evt.title}</h4>
                      <p className="text-xs text-emerald-300 mt-1 flex items-center gap-1 relative z-10"><MapPin size={10} className="text-[#DDA71D]" />{evt.venue}</p>
                      <p className="text-xs text-emerald-200/70 flex items-center gap-1 mt-0.5 relative z-10"><Calendar size={10} className="text-[#DDA71D]" />{evt.dow ? `${evt.dow}, ` : ""}{evt.day} {evt.month} · {evt.time}</p>
                      <div className="mt-4 pt-3 border-t border-emerald-800/40 flex justify-between items-center relative z-10">
                        <span className="font-mono text-[10px] text-emerald-300">{`PASS-MLB-${String(evt.id).padStart(4, "0")}`}</span>
                        <button type="button" onClick={() => alert(`Pass for "${evt.title}" ready!`)} className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"><Download size={11} />Pass</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MEMBER: WELFARE CLAIM */}
          {role === "member" && memberTab === "welfare-claim" && (
            <div className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-5 animate-fade-in">
              <h3 className="text-sm font-bold">Submit Emergency Welfare Claim</h3><p className="text-[11px] text-gray-400 mt-0.5 mb-4">Verified claims reviewed within 4 hours. Disbursed via M-Pesa B2C.</p>
              {claimSuccess ? (
                <div className="p-5 text-center space-y-2 bg-emerald-50 rounded-xl border border-emerald-200"><div className="w-10 h-10 rounded-full bg-[#0D6E38] flex items-center justify-center mx-auto"><CheckCircle2 size={20} className="text-white" /></div><h4 className="font-bold text-sm text-[#0D6E38]">Claim Submitted!</h4><p className="text-xs text-gray-500">The Welfare Officer will verify and disburse via M-Pesa.</p></div>
              ) : (
                <form onSubmit={handleClaimSubmit} className="space-y-4 text-xs">
                  <div><label className="block font-semibold text-gray-700 mb-1">Claim Type</label><select value={claimType} onChange={e => setClaimType(e.target.value)} className={inputCls}><option>Bereavement Repatriation (KES 50,000)</option><option>Emergency Hospitalization</option><option>Kinship Distress Aid</option></select></div>
                  <div><label className="block font-semibold text-gray-700 mb-1">Details & Circumstances</label><textarea required rows={4} value={claimDesc} onChange={e => setClaimDesc(e.target.value)} placeholder="Describe the emergency, location, and arrangements..." className={inputCls} /></div>
                  <button type="submit" className={btnDanger + " w-full justify-center py-3"}>Submit Urgent Claim</button>
                </form>
              )}
            </div>
          )}

          {/* MEMBER: CLAN DESK */}
          {role === "member" && memberTab === "clan-desk" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 animate-fade-in">
              <h3 className="text-sm font-bold mb-0.5">Clan Elders Desk</h3><p className="text-[11px] text-gray-400 mb-4">Direct contacts for clan elders and zonal welfare leads.</p>
              {leadershipList.length === 0 ? <EmptyState icon={Landmark} title="No Clan Contacts Listed" body="The secretariat hasn't added clan elder contacts yet." /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {leadershipList.map(leader => {
                    const initials = leader.name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "ML";
                    return (
                      <div key={leader.id} className="p-4 rounded-xl border border-gray-200 hover:border-[#0D6E38]/40 transition-colors space-y-3">
                        <div className="flex items-center gap-2.5">
                          {leader.avatar_url ? <img src={leader.avatar_url} alt={leader.name} className="w-10 h-10 rounded-xl object-cover border-2 border-[#DDA71D]/30 flex-shrink-0" onError={e => (e.target as HTMLElement).style.display = "none"} /> : <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#082f1a] to-[#0D6E38] text-white font-black text-sm flex items-center justify-center border-2 border-[#DDA71D]/30 flex-shrink-0">{initials}</div>}
                          <div><div className="text-xs font-bold text-[#18221B]">{leader.name}</div><div className="text-[10px] text-[#0D6E38] font-semibold">{leader.role}</div>{leader.clan && <div className="text-[9px] text-gray-400">{leader.clan}</div>}</div>
                        </div>
                        {leader.phone && <a href={`tel:${leader.phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D6E38] hover:bg-[#0a4d29] text-white text-xs font-semibold cursor-pointer"><Phone size={11} />{leader.phone}</a>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* LEADER: OVERVIEW & ANALYTICS */}
          {role === "leader" && adminTab === "analytics" && (
            <div className="space-y-5 animate-fade-in">
              {/* Scope summary banner */}
              <div className="bg-gradient-to-r from-[#082f1a] to-[#0D6E38] rounded-2xl p-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#DDA71D] bg-black/30 px-2.5 py-0.5 rounded-full border border-[#DDA71D]/30">
                      {isNationalLeader ? "National Governance" : isCountyLeader ? "County Leadership" : isSubcountyAdmin ? "Sub-County Administration" : isWardLeader ? "Ward Leadership" : isAreaLeader ? "Area Leadership" : "Leadership"}
                    </span>
                    <span className="text-[10px] text-emerald-300 font-semibold">Active Session</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-white" style={{ fontFamily: "var(--font-outfit)" }}>
                    {jurisdictionLabel}
                  </h3>
                  <p className="text-xs text-emerald-200/80 mt-1 max-w-xl">
                    {isAreaLeader
                      ? "Overseeing registered members, KYC approvals, local communiqués, and direct SMS/email dispatch for your local area."
                      : isWardLeader
                      ? "Managing custom areas, area leader appointments, ward membership verification, and ward-wide SMS/email communication."
                      : isSubcountyAdmin
                      ? "Overseeing all electoral wards, community areas, member registrations, and sub-county-wide dispatch operations."
                      : isCountyLeader
                      ? "Directing all sub-counties, wards, areas, and members across the county with full county-scoped messaging authority."
                      : "National administration console overseeing all 47 counties, treasury reserves, leadership hierarchy, and nationwide communications."}
                  </p>
                </div>
                <div className="flex flex-wrap sm:flex-col gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setAdminTab("dispatch")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#DDA71D] hover:bg-[#c99516] text-[#082f1a] text-xs font-black shadow-sm transition-all cursor-pointer"
                  >
                    <Send size={13} />
                    <span>Send Dispatch</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminTab("members")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all cursor-pointer"
                  >
                    <Users size={13} />
                    <span>Member Registry</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Role-Aware Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {isAreaLeader ? (
                  <>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Area Members</span>
                        <Users size={14} className="text-[#0D6E38]" />
                      </div>
                      <div className="text-2xl font-extrabold text-[#082f1a]">
                        <NumberTicker value={dispatchRecipients.length || membersList.length} />
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">In your local area</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Pending Approvals</span>
                        <AlertCircle size={14} className="text-amber-500" />
                      </div>
                      <div className="text-2xl font-extrabold text-amber-600">
                        {membersList.filter(m => m.status !== "Verified").length}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">Awaiting KYC check</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Communiqués</span>
                        <Megaphone size={14} className="text-purple-500" />
                      </div>
                      <div className="text-2xl font-extrabold text-purple-600">{newsList.length}</div>
                      <div className="text-[10px] text-gray-400 mt-1">Published updates</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Dispatches</span>
                        <Send size={14} className="text-blue-500" />
                      </div>
                      <div className="text-2xl font-extrabold text-blue-600">{dispatchLogs.length}</div>
                      <div className="text-[10px] text-gray-400 mt-1">Broadcasts sent</div>
                    </div>
                  </>
                ) : isWardLeader ? (
                  <>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Ward Members</span>
                        <Users size={14} className="text-[#0D6E38]" />
                      </div>
                      <div className="text-2xl font-extrabold text-[#082f1a]">
                        <NumberTicker value={dispatchRecipients.length || membersList.length} />
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">Registered in ward</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Custom Areas</span>
                        <Layers size={14} className="text-teal-500" />
                      </div>
                      <div className="text-2xl font-extrabold text-teal-600">{allAreasList.length}</div>
                      <div className="text-[10px] text-gray-400 mt-1">Areas mapped</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Area Leaders</span>
                        <Crown size={14} className="text-amber-500" />
                      </div>
                      <div className="text-2xl font-extrabold text-amber-600">
                        {allAreasList.filter(a => a.leader_member_id).length}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">Appointed leads</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Dispatches</span>
                        <Send size={14} className="text-blue-500" />
                      </div>
                      <div className="text-2xl font-extrabold text-blue-600">{dispatchLogs.length}</div>
                      <div className="text-[10px] text-gray-400 mt-1">Ward broadcasts</div>
                    </div>
                  </>
                ) : isSubcountyAdmin ? (
                  <>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Subcounty Members</span>
                        <Users size={14} className="text-[#0D6E38]" />
                      </div>
                      <div className="text-2xl font-extrabold text-[#082f1a]">
                        <NumberTicker value={dispatchRecipients.length || membersList.length} />
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">In subcounty</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Electoral Wards</span>
                        <Compass size={14} className="text-blue-500" />
                      </div>
                      <div className="text-2xl font-extrabold text-blue-600">
                        {getWards(currentMember?.subcounty_admin_zone || currentMember?.subcounty || "Nyali").length}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">IEBC wards</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Custom Areas</span>
                        <Layers size={14} className="text-teal-500" />
                      </div>
                      <div className="text-2xl font-extrabold text-teal-600">{allAreasList.length}</div>
                      <div className="text-[10px] text-gray-400 mt-1">Community zones</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Dispatches</span>
                        <Send size={14} className="text-blue-500" />
                      </div>
                      <div className="text-2xl font-extrabold text-blue-600">{dispatchLogs.length}</div>
                      <div className="text-[10px] text-gray-400 mt-1">Subcounty broadcasts</div>
                    </div>
                  </>
                ) : isCountyLeader ? (
                  <>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">County Members</span>
                        <Users size={14} className="text-[#0D6E38]" />
                      </div>
                      <div className="text-2xl font-extrabold text-[#082f1a]">
                        <NumberTicker value={dispatchRecipients.length || membersList.length} />
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">Across county</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Subcounties</span>
                        <Building size={14} className="text-blue-500" />
                      </div>
                      <div className="text-2xl font-extrabold text-blue-600">
                        {getSubcounties(currentMember?.county_leader_county || currentMember?.county || "Mombasa").length}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">Constituencies</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Custom Areas</span>
                        <Layers size={14} className="text-teal-500" />
                      </div>
                      <div className="text-2xl font-extrabold text-teal-600">{allAreasList.length}</div>
                      <div className="text-[10px] text-gray-400 mt-1">Community zones</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Dispatches</span>
                        <Send size={14} className="text-blue-500" />
                      </div>
                      <div className="text-2xl font-extrabold text-blue-600">{dispatchLogs.length}</div>
                      <div className="text-[10px] text-gray-400 mt-1">County broadcasts</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Nationwide Members</span>
                        <Users size={14} className="text-[#0D6E38]" />
                      </div>
                      <div className="text-2xl font-extrabold text-[#082f1a]">
                        <NumberTicker value={membersList.length} />
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">All 47 Counties</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Pending Claims</span>
                        <AlertCircle size={14} className="text-amber-500" />
                      </div>
                      <div className="text-2xl font-extrabold text-amber-600">{pendingClaims.length}</div>
                      <div className="text-[10px] text-gray-400 mt-1">{claimsList.length} total claims</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Treasury Reserve</span>
                        <TrendingUp size={14} className="text-[#DDA71D]" />
                      </div>
                      <div className="text-xl font-extrabold text-[#DDA71D]">
                        KES <NumberTicker value={totalReserve} />
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">{contributionsList.length} transactions</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">This Month</span>
                        <BarChart3 size={14} className="text-rose-500" />
                      </div>
                      <div className="text-xl font-extrabold text-rose-600">
                        KES <NumberTicker value={monthlyCollection} />
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">30-day collections</div>
                    </div>
                  </>
                )}
              </div>

              {/* Monthly Chart (for Super Admin / National Leader / County Leader) */}
              {(isSuperAdmin || isCountyLeader) && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold">Monthly M-Pesa Collections vs. Welfare Payouts</h4>
                      <p className="text-[10px] text-gray-400">Realtime database inflows</p>
                    </div>
                    <span className="text-[10px] font-bold text-[#0D6E38] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                      ● Live
                    </span>
                  </div>
                  {monthlyData.length === 0 ? (
                    <EmptyState
                      icon={BarChart3}
                      title="No Monthly Data Yet"
                      body="Charts render here when payments and claims are recorded in the database."
                    />
                  ) : (
                    <>
                      <div className="h-44 w-full bg-gradient-to-t from-emerald-50/40 to-white rounded-xl p-3 flex items-end justify-between gap-1.5 border border-gray-100">
                        {monthlyData.map((bar) => {
                          const maxVal = Math.max(...monthlyData.map((d) => Math.max(d.inAmt, d.outAmt)), 1000);
                          return (
                            <div key={bar.month} className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full flex items-end justify-center gap-1 h-36">
                                <div
                                  style={{ height: `${Math.max(6, (bar.inAmt / maxVal) * 100)}%` }}
                                  className="w-5/12 bg-[#0D6E38] rounded-t-md relative group cursor-pointer hover:bg-[#0a4d29] transition-colors"
                                >
                                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-gray-800 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                                    KES {bar.inAmt.toLocaleString()}
                                  </span>
                                </div>
                                <div
                                  style={{ height: `${Math.max(6, (bar.outAmt / maxVal) * 100)}%` }}
                                  className="w-5/12 bg-rose-400 rounded-t-md relative group cursor-pointer hover:bg-rose-500 transition-colors"
                                >
                                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-gray-800 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                                    KES {bar.outAmt.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[9px] text-gray-500 font-medium">{bar.month}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-center gap-5 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-[#0D6E38]" /> Collections
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-rose-400" /> Claims Paid
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Navigation Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {currentAdminNav.slice(1).map((nav) => (
                  <button
                    type="button"
                    key={nav.id}
                    onClick={() => setAdminTab(nav.id as AdminTab)}
                    className="bg-white rounded-xl border border-gray-200 p-3.5 hover:border-[#0D6E38]/40 hover:shadow-sm transition-all text-left group cursor-pointer"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${nav.color}`}>
                      <nav.icon size={14} />
                    </div>
                    <div className="text-xs font-bold text-[#18221B]">{nav.label}</div>
                    {nav.badge != null && <div className="text-[10px] text-gray-400 mt-0.5">{nav.badge} items</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LEADER: DISPATCH */}
          {role === "leader" && adminTab === "dispatch" && (
            <div className="space-y-5 animate-fade-in">
              {/* Notification Banner */}
              {dispatchNotice && (
                <div
                  className={`p-4 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 ${
                    dispatchNotice.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>{dispatchNotice.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDispatchNotice(null)}
                    className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Dispatch Composer Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 mb-5 gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider">
                        Scoped Dispatch
                      </span>
                      <span className="text-[11px] text-gray-500 font-semibold">{jurisdictionLabel}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#18221B]">SMS & Email Dispatch Console</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Broadcast notices to members within your jurisdiction via Resend (Email) and Africa&apos;s Talking (SMS).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchDispatchData}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer"
                      title="Refresh recipients & log"
                    >
                      <RefreshCw size={13} className={loadingDispatchData ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Step 1: Channel Selector */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">1. Delivery Channel</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          id: "both" as const,
                          label: "Both (SMS + Email)",
                          desc: "Maximum reach. Sends SMS to phones & HTML email to inboxes.",
                          icon: Radio,
                          badge: "Recommended",
                        },
                        {
                          id: "sms" as const,
                          label: "SMS Only",
                          desc: "Direct text to Kenyan mobiles (+254) via Africa's Talking.",
                          icon: Smartphone,
                          badge: "160 chars / unit",
                        },
                        {
                          id: "email" as const,
                          label: "Email Only",
                          desc: "Rich transactional email delivered via Resend API.",
                          icon: Mail,
                          badge: "Zero SMS cost",
                        },
                      ].map((ch) => (
                        <button
                          type="button"
                          key={ch.id}
                          onClick={() => setDispatchChannel(ch.id)}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                            dispatchChannel === ch.id
                              ? "border-[#0D6E38] bg-emerald-50/50 ring-2 ring-[#0D6E38]/20"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          {ch.badge && (
                            <span className="absolute top-2.5 right-2.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#DDA71D]/20 text-[#082f1a]">
                              {ch.badge}
                            </span>
                          )}
                          <div className="flex items-center gap-2 mb-1.5">
                            <ch.icon
                              size={15}
                              className={dispatchChannel === ch.id ? "text-[#0D6E38]" : "text-gray-400"}
                            />
                            <span className="text-xs font-bold text-gray-900">{ch.label}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 leading-relaxed">{ch.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Recipient Targeting */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-gray-700">2. Recipient Targeting (Scoped)</label>
                      <span className="text-[10px] font-bold text-[#0D6E38] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        {dispatchRecipients.length} members eligible in your jurisdiction
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDispatchTargetType("all");
                          setSelectedRecipientIds([]);
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          dispatchTargetType === "all"
                            ? "border-[#0D6E38] bg-emerald-50/50 ring-2 ring-[#0D6E38]/20"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <Users size={14} className="text-[#0D6E38]" />
                          <span>All Members in Jurisdiction</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                          Broadcasts to all {dispatchRecipients.length} members under your verified scope.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDispatchTargetType("selected")}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          dispatchTargetType === "selected"
                            ? "border-[#0D6E38] bg-emerald-50/50 ring-2 ring-[#0D6E38]/20"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <CheckCheck size={14} className="text-blue-600" />
                          <span>Selected Members ({selectedRecipientIds.length} chosen)</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                          Pick individual recipients manually from the searchable list below.
                        </p>
                      </button>
                    </div>

                    {/* Member picker if targetType === "selected" */}
                    {dispatchTargetType === "selected" && (
                      <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                          <input
                            type="text"
                            value={recipientSearch}
                            onChange={(e) => setRecipientSearch(e.target.value)}
                            placeholder="Filter by name, phone, or ward..."
                            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0D6E38] sm:w-64"
                          />
                          <div className="flex gap-2 text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => setSelectedRecipientIds(dispatchRecipients.map((r) => r.id))}
                              className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer"
                            >
                              Select All ({dispatchRecipients.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedRecipientIds([])}
                              className="px-2.5 py-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 bg-white rounded-lg border border-gray-200">
                          {dispatchRecipients
                            .filter((r) => {
                              if (!recipientSearch.trim()) return true;
                              const q = recipientSearch.toLowerCase();
                              return (
                                r.full_name?.toLowerCase().includes(q) ||
                                r.phone?.toLowerCase().includes(q) ||
                                r.ward?.toLowerCase().includes(q) ||
                                r.subcounty?.toLowerCase().includes(q)
                              );
                            })
                            .map((r) => {
                              const checked = selectedRecipientIds.includes(r.id);
                              return (
                                <label
                                  key={r.id}
                                  className="flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-gray-50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      if (e.target.checked) setSelectedRecipientIds([...selectedRecipientIds, r.id]);
                                      else setSelectedRecipientIds(selectedRecipientIds.filter((id) => id !== r.id));
                                    }}
                                    className="rounded border-gray-300 text-[#0D6E38] focus:ring-[#0D6E38]"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <span className="font-bold text-gray-900">{r.full_name}</span>
                                    <span className="text-[10px] text-gray-500 ml-2 font-mono">{r.phone}</span>
                                    {r.ward && (
                                      <span className="text-[9px] text-[#0D6E38] ml-2 font-semibold">
                                        ({r.ward} Ward)
                                      </span>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 3: Message Content */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-700">3. Message Content</label>

                    {(dispatchChannel === "email" || dispatchChannel === "both") && (
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Email Subject Line <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={dispatchSubject}
                          onChange={(e) => setDispatchSubject(e.target.value)}
                          placeholder="e.g. Mulembe18 Urgent Welfare Notice / Gathering Briefing"
                          className={inputCls}
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-gray-600">
                          Message Body <span className="text-rose-500">*</span>
                        </label>
                        <div className="text-[10px] font-mono">
                          <span
                            className={
                              dispatchMessage.length > 320
                                ? "text-amber-600 font-bold"
                                : dispatchMessage.length > 0
                                ? "text-emerald-700 font-bold"
                                : "text-gray-400"
                            }
                          >
                            {dispatchMessage.length} characters
                          </span>
                          <span className="text-gray-400 ml-1">
                            ({Math.ceil(dispatchMessage.length / 160) || 1} SMS unit
                            {(Math.ceil(dispatchMessage.length / 160) || 1) > 1 ? "s" : ""} / 160 chars)
                          </span>
                        </div>
                      </div>
                      <textarea
                        required
                        rows={4}
                        value={dispatchMessage}
                        onChange={(e) => setDispatchMessage(e.target.value)}
                        placeholder="Write your dispatch notice here. For SMS, keep it concise (under 160 chars per segment). For Email, line breaks are preserved."
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
                    <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-[#0D6E38]" />
                      <span>
                        Sender: <strong>{currentMember?.full_name || user?.fullName}</strong> ({userRole})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!dispatchMessage.trim()) return alert("Message body cannot be empty.");
                        if ((dispatchChannel === "email" || dispatchChannel === "both") && !dispatchSubject.trim()) {
                          return alert("Email subject line is required.");
                        }
                        if (dispatchTargetType === "selected" && selectedRecipientIds.length === 0) {
                          return alert("Please select at least one recipient member.");
                        }
                        setDispatchConfirmModalOpen(true);
                      }}
                      className={btnPrimary + " px-6 py-2.5"}
                    >
                      <Send size={13} />
                      <span>Review & Broadcast Dispatch</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Delivery History Log Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#18221B]">Real-Time Delivery Log</h4>
                    <p className="text-[11px] text-gray-500">
                      Audit trail of sent, pending, and simulated messages logged in the database.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {dispatchLogs.length} total entries
                  </span>
                </div>

                {loadingDispatchData ? (
                  <div className="py-8 flex justify-center">
                    <Spinner />
                  </div>
                ) : dispatchLogs.length === 0 ? (
                  <EmptyState
                    icon={Send}
                    title="No Dispatches Sent Yet"
                    body="When you send SMS or Email notifications, each recipient's delivery status will be tracked here in real-time."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                          <th className="py-2.5 px-3 text-left">Date / Time</th>
                          <th className="py-2.5 px-3 text-left">Recipient</th>
                          <th className="py-2.5 px-3 text-left">Channel</th>
                          <th className="py-2.5 px-3 text-left">Subject / Body</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-left">Provider Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {dispatchLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50/70">
                            <td className="py-2.5 px-3 text-[11px] text-gray-500 whitespace-nowrap font-mono">
                              {new Date(log.created_at).toLocaleString("en-KE", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-gray-900">{log.recipient_name}</div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                {log.recipient_phone || log.recipient_email}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                  log.channel === "sms"
                                    ? "bg-amber-100 text-amber-800"
                                    : log.channel === "email"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {log.channel === "sms" ? <Smartphone size={10} /> : <Mail size={10} />}
                                {log.channel.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 max-w-xs truncate text-gray-700">
                              {log.subject && <span className="font-semibold text-gray-900 mr-1">[{log.subject}]</span>}
                              <span className="text-[11px] text-gray-500">{log.message}</span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  log.status === "Sent"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : log.status === "Pending"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {log.status === "Sent" ? (
                                  <CheckCircle size={10} />
                                ) : log.status === "Pending" ? (
                                  <Clock size={10} />
                                ) : (
                                  <XCircle size={10} />
                                )}
                                {log.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[10px] text-gray-400 max-w-xs truncate font-mono">
                              {log.error_reason || "Delivered successfully"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LEADER: AREAS MANAGEMENT */}
          {role === "leader" && adminTab === "areas" && (
            <div className="space-y-5 animate-fade-in">
              {/* Add New Area Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#18221B]">Create Custom Community Area</h3>
                    <p className="text-[11px] text-gray-500">
                      Areas are custom sub-divisions beneath official IEBC electoral wards to organize local member communities.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateArea} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Area Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newAreaName}
                      onChange={(e) => setNewAreaName(e.target.value)}
                      placeholder="e.g. Kwa Bulo Central / Old Town Shore"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      County <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newAreaCounty}
                      onChange={(e) => {
                        const c = e.target.value;
                        setNewAreaCounty(c);
                        const subs = getSubcounties(c);
                        if (subs.length > 0) {
                          setNewAreaSubcounty(subs[0]);
                          const wards = getWards(subs[0], c);
                          if (wards.length > 0) setNewAreaWard(wards[0]);
                        }
                      }}
                      className={inputCls}
                    >
                      {KENYA_COUNTIES.map((c) => (
                        <option key={c} value={c}>
                          {c} County
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Subcounty <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newAreaSubcounty}
                      onChange={(e) => {
                        const s = e.target.value;
                        setNewAreaSubcounty(s);
                        const wards = getWards(s, newAreaCounty);
                        if (wards.length > 0) setNewAreaWard(wards[0]);
                      }}
                      className={inputCls}
                    >
                      {getSubcounties(newAreaCounty).map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Ward Jurisdiction <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={isWardLeader ? (currentMember?.ward_leader_ward || currentMember?.ward) : newAreaWard}
                      disabled={isWardLeader}
                      onChange={(e) => setNewAreaWard(e.target.value)}
                      className={inputCls}
                      required
                    >
                      {(isWardLeader
                        ? [currentMember?.ward_leader_ward || currentMember?.ward || "Assigned Ward"]
                        : getWards(newAreaSubcounty, newAreaCounty)
                      ).map((w) => (
                        <option key={w} value={w}>
                          {w} Ward
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Contact Phone / Info</label>
                    <input
                      type="text"
                      value={newAreaContact}
                      onChange={(e) => setNewAreaContact(e.target.value)}
                      placeholder="e.g. 0712 345 678"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Brief Description</label>
                    <input
                      type="text"
                      value={newAreaDesc}
                      onChange={(e) => setNewAreaDesc(e.target.value)}
                      placeholder="e.g. Bordering Nyali bridge to the market"
                      className={inputCls}
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-1">
                    <button type="submit" disabled={creatingArea} className={btnPrimary}>
                      <Plus size={13} />
                      <span>{creatingArea ? "Registering Area..." : "Save Custom Area"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Areas Table Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#18221B]">Community Areas in Jurisdiction</h4>
                    <p className="text-[11px] text-gray-500">{allAreasList.length} total areas registered</p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchAllAreas}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer"
                    title="Refresh"
                  >
                    <RefreshCw size={13} className={loadingAreasList ? "animate-spin" : ""} />
                  </button>
                </div>

                {loadingAreasList ? (
                  <div className="py-8 flex justify-center">
                    <Spinner />
                  </div>
                ) : allAreasList.length === 0 ? (
                  <EmptyState
                    icon={Layers}
                    title="No Areas Registered Yet"
                    body="Create the first custom community area under your ward using the form above."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                          <th className="py-2.5 px-3 text-left">Area ID & Name</th>
                          <th className="py-2.5 px-3 text-left">Ward</th>
                          <th className="py-2.5 px-3 text-left">Subcounty</th>
                          <th className="py-2.5 px-3 text-left">Area Leader</th>
                          <th className="py-2.5 px-3 text-center">Members</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {allAreasList.map((area) => (
                          <tr key={area.id} className="hover:bg-gray-50/70">
                            <td className="py-3 px-3">
                              <div className="font-bold text-gray-900">{area.name}</div>
                              <div className="text-[10px] text-gray-400 font-mono">ID: #{area.id}</div>
                            </td>
                            <td className="py-3 px-3 font-semibold text-emerald-800">{area.ward} Ward</td>
                            <td className="py-3 px-3 text-gray-600">{area.subcounty}</td>
                            <td className="py-3 px-3">
                              {area.leader_name ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                                  <MapPin size={10} /> {area.leader_name}
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400 italic">Unassigned</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-gray-800">
                              {area.member_count ?? 0}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setAssignLeaderModalArea(area);
                                  setSelectedAreaLeaderId("");
                                }}
                                className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-[10px] font-bold cursor-pointer"
                              >
                                {area.leader_name ? "Change Leader" : "Assign Leader"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LEADER: EVENTS */}
          {role === "leader" && adminTab === "events" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
              <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div><h3 className="text-sm font-bold">Community Calendar & Events Manager</h3><p className="text-[11px] text-gray-400">Schedule, feature, and manage community gatherings.</p></div>
                <div className="flex gap-2">
                  <button type="button" onClick={fetchAllEvents} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer" title="Refresh"><RefreshCw size={13} className={loadingEvents ? "animate-spin" : ""} /></button>
                  <button type="button" onClick={() => setCreateEventModal(true)} className={btnPrimary}><Plus size={13} />Schedule Gathering</button>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                {loadingEvents ? <div className="flex justify-center py-10"><Spinner /></div> : eventsList.length === 0 ? <EmptyState icon={CalendarDays} title="No Events Scheduled" body="The public site shows an empty state. Add your first gathering." cta={<button type="button" onClick={() => setCreateEventModal(true)} className={btnPrimary}><Plus size={13} />Add Event</button>} /> : (
                  <div className="space-y-2">
                    {eventsList.map(evt => (
                      <div key={evt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 hover:border-emerald-200/60 hover:bg-gray-50/40 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-[#0D6E38] flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-[8px] font-bold uppercase">{evt.month || "EVT"}</span>
                            <span className="text-sm font-black leading-none">{evt.day || "·"}</span>
                            <span className="text-[7px] text-gray-400">{evt.dow || "DAY"}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              <span className="text-[10px] font-bold text-[#0D6E38] bg-emerald-50 px-1.5 py-0.5 rounded">{evt.category}</span>
                              {Boolean(evt.is_featured) && <span className="text-[10px] font-bold bg-[#DDA71D] text-[#082f1a] px-1.5 py-0.5 rounded flex items-center gap-0.5"><Star size={8} fill="currentColor" />Featured</span>}
                            </div>
                            <div className="text-xs font-bold text-[#18221B]">{evt.title}</div>
                            <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5"><span className="flex items-center gap-0.5"><MapPin size={9} />{evt.venue}</span><span className="flex items-center gap-0.5"><Clock size={9} />{evt.time}</span></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button type="button" onClick={() => handleToggleFeature(evt)} className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer ${Boolean(evt.is_featured) ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}><Star size={10} className={Boolean(evt.is_featured) ? "fill-amber-600" : ""} />{Boolean(evt.is_featured) ? "Unfeature" : "Feature"}</button>
                          <button type="button" onClick={() => handleDeleteEvent(evt.id)} className="p-1.5 rounded-xl bg-gray-100 hover:bg-rose-100 text-gray-400 hover:text-rose-600 cursor-pointer"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LEADER: CLAIMS */}
          {role === "leader" && adminTab === "claims" && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div><h3 className="text-sm font-bold">Welfare Claims Review</h3><p className="text-[11px] text-gray-400">Bereavement & hospital claim verification</p></div>
                  <div className="flex gap-2 items-center">{pendingClaims.length > 0 && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">{pendingClaims.length} Pending</span>}<button type="button" onClick={fetchAllClaims} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"><RefreshCw size={13} className={loadingClaims ? "animate-spin" : ""} /></button></div>
                </div>
                <div className="p-4 sm:p-5">
                  {loadingClaims ? <div className="flex justify-center py-8"><Spinner /></div> : claimsList.length === 0 ? <EmptyState icon={CheckCircle2} title="All Claims Resolved" body="No pending welfare tickets. All emergency aid claims have been processed." /> : (
                    <div className="space-y-2">
                      {claimsList.map(claim => (
                        <div key={claim.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50/40 transition-colors">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap"><span className="font-mono text-[10px] text-gray-400">{claim.claim_no || `CLM-${claim.id}`}</span><Badge status={claim.status || "Pending"} /></div>
                            <div className="text-xs font-bold text-[#18221B]">{claim.claimant_name}</div>
                            <div className="text-[10px] text-gray-400">{claim.claim_type} · {claim.sub_clan} · {claim.residential_zone}</div>
                            {claim.description && <div className="text-[10px] text-gray-500 italic bg-gray-50 p-2 rounded-lg mt-1 max-w-sm">"{claim.description}"</div>}
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <div className="text-right mr-1"><div className="text-sm font-extrabold text-[#0D6E38]">KES {Number(claim.amount).toLocaleString()}</div><div className="text-[9px] text-gray-400">M-Pesa B2C</div></div>
                            {claim.status !== "Approved" && <button type="button" onClick={() => handleApproveClaim(claim.id)} className="px-3 py-1.5 rounded-xl bg-[#00A859] hover:bg-[#00914c] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"><CheckCircle2 size={11} />Approve</button>}
                            <button type="button" onClick={() => handleDeleteClaim(claim.id)} className="p-1.5 rounded-xl bg-gray-100 hover:bg-rose-100 text-gray-400 hover:text-rose-600 cursor-pointer"><Trash2 size={13} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /><div><h3 className="text-sm font-bold">Community Welfare Appeals</h3><p className="text-[11px] text-gray-400">{appealsList.length} total · {activeAppeals.length} active</p></div></div>
                  <div className="flex gap-2">
                    <button type="button" onClick={fetchAllAppeals} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"><RefreshCw size={13} className={loadingAppeals ? "animate-spin" : ""} /></button>
                    <button type="button" onClick={() => setCreateAppealModal(true)} className={btnPrimary}><PlusCircle size={13} />Launch Appeal</button>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  {loadingAppeals ? <div className="flex justify-center py-8"><Spinner /></div> : appealsList.length === 0 ? <EmptyState icon={HeartHandshake} title="No Appeals Created" body="Launch a welfare appeal to enable community M-Pesa solidarity contributions." /> : (
                    <div className="space-y-2">
                      {appealsList.map(appeal => {
                        const goal = Number(appeal.goal_amount) || 1; const raised = Number(appeal.raised_amount) || 0; const pct = Math.min(100, Math.round((raised / goal) * 100));
                        const isActive = appeal.is_active === 1 || appeal.is_active === true || appeal.is_active === "1";
                        return (
                          <div key={appeal.id} className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50/40 transition-colors space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap"><Badge status={isActive ? "Active" : "Inactive"} />{appeal.family_name && <span className="text-[10px] text-gray-600 font-semibold">{appeal.family_name}</span>}{appeal.location && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin size={9} />{appeal.location}</span>}</div>
                                <div className="text-xs font-bold text-[#18221B]">{appeal.title}</div>
                              </div>
                              <div className="flex gap-1.5 flex-shrink-0">
                                <button type="button" onClick={() => handleToggleAppealActive(appeal.id, isActive)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${isActive ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{isActive ? "Close" : "Activate"}</button>
                                <button type="button" onClick={() => handleDeleteAppeal(appeal.id)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-100 text-gray-400 hover:text-rose-600 cursor-pointer"><Trash2 size={12} /></button>
                              </div>
                            </div>
                            <div><div className="flex justify-between text-[10px] mb-1"><span className="font-bold text-[#0D6E38]">KES {raised.toLocaleString()} raised</span><span className="text-gray-400">Goal: KES {goal.toLocaleString()} ({pct}%)</span></div><div className="w-full h-1.5 rounded-full bg-gray-100"><div className="h-full bg-gradient-to-r from-emerald-500 to-[#00A859] rounded-full" style={{ width: `${pct}%` }} /></div></div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LEADER: MEMBER REGISTRY */}
          {role === "leader" && adminTab === "members" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
              <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold">Member Registry & Approvals</h3>
                  <p className="text-[11px] text-gray-400">{membersList.length} registered · Review KYC and approve members under your jurisdiction</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/subcounty-dashboard"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0D6E38] text-xs font-bold transition-colors"
                  >
                    <Building size={13} />
                    <span>Open Subcounty Portal</span>
                  </Link>
                  <button type="button" onClick={fetchAllMembers} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"><RefreshCw size={13} className={loadingMembers ? "animate-spin" : ""} /></button>
                  <button type="button" onClick={() => alert(`Exporting ${membersList.length} members as CSV...`)} className={btnPrimary}><Download size={13} />Export CSV</button>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                {loadingMembers ? <div className="flex justify-center py-10"><Spinner /></div> : membersList.length === 0 ? <EmptyState icon={Users} title="No Members Registered" body="Members register through the main website. Profiles appear here automatically." /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                          <th className="py-2.5 px-3 text-left">Member</th>
                          <th className="py-2.5 px-3 text-left">County</th>
                          <th className="py-2.5 px-3 text-left">Sub-Clan</th>
                          <th className="py-2.5 px-3 text-left">Zone / Subcounty</th>
                          <th className="py-2.5 px-3 text-left">Role / Level</th>
                          <th className="py-2.5 px-3 text-left">Phone</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {membersList.map(m => (
                          <tr key={m.id} className="hover:bg-gray-50/70">
                            <td className="py-3 px-3"><div className="font-bold text-gray-900">{m.full_name}</div><div className="font-mono text-[9px] text-gray-400">{m.membership_no || `MLB-${m.id}`}</div></td>
                            <td className="py-3 px-3 font-semibold text-emerald-800">{m.county || "Mombasa"}</td>
                            <td className="py-3 px-3 text-gray-600">{m.sub_clan}</td>
                            <td className="py-3 px-3 text-gray-500">{m.residential_zone}</td>
                            <td className="py-3 px-3">
                              {m.role === "national_leader" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-200">
                                  <Award size={10} className="text-amber-600" /> National Leader
                                </span>
                              ) : m.role === "super_admin" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <Crown size={10} /> Super Admin
                                </span>
                              ) : m.role === "county_leader" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                  <Building size={10} /> {m.county_leader_county || m.county || "County"} Leader
                                </span>
                              ) : m.role === "subcounty_admin" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700">
                                  <Building size={10} /> {m.subcounty_admin_zone || "Subcounty"} Admin
                                </span>
                              ) : m.role === "ward_leader" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                                  <Compass size={10} /> {m.ward_leader_ward || m.ward || "Ward"} Leader
                                </span>
                              ) : m.role === "area_leader" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-800">
                                  <MapPin size={10} /> Area Leader
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600">
                                  Member
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono text-gray-500">{m.phone}</td>
                            <td className="py-3 px-3 text-center"><Badge status={m.status || "Verified"} /></td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              {/* 1-Click Approve / Verify */}
                              {m.status !== "Verified" ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateMemberStatus(m.id, "Verified")}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold mr-1 cursor-pointer shadow-xs inline-flex items-center gap-1"
                                >
                                  <Check size={10} />
                                  <span>Approve</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateMemberStatus(m.id, "Pending")}
                                  className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-medium mr-1 cursor-pointer"
                                  title="Revoke verified status"
                                >
                                  Revoke
                                </button>
                              )}
                              {(isSuperAdmin || isCountyLeader) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRoleModalMember(m);
                                    setAssignedRole(m.role || "member");
                                    setAssignedCounty(m.county_leader_county || m.county || "Mombasa");
                                    const defaultSub = m.subcounty || m.subcounty_admin_zone || m.residential_zone || "Nyali";
                                    setAssignedZone(defaultSub);
                                    const wards = getWards(defaultSub, m.county || "Mombasa");
                                    setAssignedWard(m.ward_leader_ward || m.ward || (wards[0] || ""));
                                    setAssignedAreaId(m.area_id ? String(m.area_id) : "");
                                  }}
                                  className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-bold mr-1 cursor-pointer"
                                >
                                  Role
                                </button>
                              )}
                              {isSuperAdmin && (
                                <button type="button" onClick={() => handleDeleteMember(m.id)} className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"><Trash2 size={12} /></button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LEADER: SOLIDARITY FUND */}
          {role === "leader" && adminTab === "solidarity" && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[{ label: "Total Reserve", v: totalReserve, prefix: "KES ", c: "text-[#DDA71D]", sub: "Liquid welfare fund" }, { label: "This Month", v: monthlyCollection, prefix: "KES ", c: "text-[#0D6E38]", sub: "30-day collections" }, { label: "Transactions", v: contributionsList.length, prefix: "", c: "text-[#18221B]", sub: "Recorded in DB" }].map((s, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"><div className="text-[10px] font-bold text-gray-400 uppercase mb-1">{s.label}</div><div className={`text-2xl font-extrabold ${s.c}`} style={{ fontFamily: "var(--font-outfit)" }}>{s.prefix}<NumberTicker value={s.v} /></div><div className="text-[10px] text-gray-400 mt-0.5">{s.sub}</div></div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div><h3 className="text-sm font-bold">M-Pesa Contributions Ledger</h3><p className="text-[11px] text-gray-400">All payments via STK, Paybill 522522, or manual entry</p></div>
                  <div className="flex gap-2">
                    <button type="button" onClick={fetchAllContributions} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"><RefreshCw size={13} className={loadingContributions ? "animate-spin" : ""} /></button>
                    <button type="button" onClick={() => setAddContribModal(true)} className={btnPrimary}><PlusCircle size={13} />Record Entry</button>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  {loadingContributions ? <div className="flex justify-center py-10"><Spinner /></div> : contributionsList.length === 0 ? <EmptyState icon={Smartphone} title="No Contributions Yet" body="Members can contribute via Paybill 522522 (Acc: 1289456). Payments appear here automatically." /> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wide"><th className="py-2.5 px-3 text-left">Date</th><th className="py-2.5 px-3 text-left">Member</th><th className="py-2.5 px-3 text-left">Purpose</th><th className="py-2.5 px-3 text-left">Reference</th><th className="py-2.5 px-3 text-right">Amount</th><th className="py-2.5 px-3 text-center">Status</th><th className="py-2.5 px-3"></th></tr></thead>
                        <tbody className="divide-y divide-gray-50">
                          {contributionsList.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50/70">
                              <td className="py-3 px-3 text-gray-400 whitespace-nowrap">{new Date(c.created_at).toLocaleDateString("en-KE")}</td>
                              <td className="py-3 px-3"><div className="font-semibold text-gray-800">{c.member_name}</div><div className="font-mono text-[9px] text-gray-400">{c.phone}</div></td>
                              <td className="py-3 px-3 text-gray-600">{c.purpose}</td>
                              <td className="py-3 px-3 font-mono text-[10px] text-gray-400">{c.mpesa_code || c.receipt_no}</td>
                              <td className="py-3 px-3 font-bold text-[#0D6E38] text-right">KES {Number(c.amount).toLocaleString()}</td>
                              <td className="py-3 px-3 text-center"><Badge status={c.status || "Completed"} /></td>
                              <td className="py-3 px-3 text-right"><button type="button" onClick={() => handleDeleteContribution(c.id)} className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"><Trash2 size={12} /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LEADER: BROADCAST */}
          {role === "leader" && adminTab === "broadcast" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in">
              <div className="lg:col-span-5">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 sticky top-20">
                  <div className="flex items-center justify-between mb-4">
                    <div><h3 className="text-sm font-bold">{editingNews ? "Edit Communiqué" : "Publish New Communiqué"}</h3><p className="text-[11px] text-gray-400">{editingNews ? `Editing #${editingNews.id}` : "Posts instantly to home portal & member feed"}</p></div>
                    {editingNews && <button type="button" onClick={() => { setEditingNews(null); setNewsForm({ category: "Announcements", title: "", summary: "", content: "", imageUrl: "/images/landing-hero.png", author: "Mulembe Secretariat" }); }} className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold cursor-pointer">Cancel</button>}
                  </div>
                  <form onSubmit={editingNews ? handleUpdateNews : handlePublishNews} className="space-y-3 text-xs">
                    <div><label className="block font-semibold text-gray-700 mb-1">Category</label><select value={newsForm.category} onChange={e => setNewsForm({ ...newsForm, category: e.target.value })} className={inputCls}><option>Announcements</option><option>Culture & Festivals</option><option>Welfare & Drives</option><option>Governance & Assemblies</option></select></div>
                    <div><label className="block font-semibold text-gray-700 mb-1">Headline <span className="text-rose-500">*</span></label><input type="text" required value={newsForm.title} onChange={e => setNewsForm({ ...newsForm, title: e.target.value })} placeholder="e.g. Cultural Day 2025 Schedule Announced" className={inputCls} /></div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Cover Image URL</label>
                      <input
                        type="text"
                        value={newsForm.imageUrl}
                        onChange={e => {
                          const val = e.target.value;
                          setNewsForm({ ...newsForm, imageUrl: normalizeImageUrl(val, val) });
                        }}
                        placeholder="Paste image URL or Bing/Google image link..."
                        className={inputCls}
                      />
                      {newsForm.imageUrl && (
                        <div className="mt-1.5 flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-200">
                          <img
                            src={normalizeImageUrl(newsForm.imageUrl)}
                            alt="Preview"
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0 bg-gray-200"
                            onError={e => ((e.target as HTMLImageElement).src = "/images/landing-hero.png")}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-[#0D6E38] block truncate">
                              {newsForm.imageUrl.includes("bing.com") || newsForm.imageUrl.includes("google.") ? "✓ Converted to direct image" : "Image link active"}
                            </span>
                            <span className="text-[9px] text-gray-400 truncate block">{normalizeImageUrl(newsForm.imageUrl)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div><label className="block font-semibold text-gray-700 mb-1">Summary</label><input type="text" value={newsForm.summary} onChange={e => setNewsForm({ ...newsForm, summary: e.target.value })} placeholder="Brief teaser for card display..." className={inputCls} /></div>
                    <div><label className="block font-semibold text-gray-700 mb-1">Full Content <span className="text-rose-500">*</span></label><textarea required rows={5} value={newsForm.content} onChange={e => setNewsForm({ ...newsForm, content: e.target.value })} placeholder="Full circular content..." className={inputCls} /></div>
                    <button type="submit" className="w-full py-2.5 rounded-xl bg-[#082f1a] hover:bg-[#0d4d28] text-[#DDA71D] font-bold text-xs shadow transition-colors cursor-pointer">{editingNews ? "Update Communiqué" : "Publish to Website"}</button>
                  </form>
                </div>
              </div>
              <div className="lg:col-span-7">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between"><h4 className="text-sm font-bold">Published ({newsList.length})</h4><button type="button" onClick={fetchAllNews} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"><RefreshCw size={12} className={loadingNews ? "animate-spin" : ""} /></button></div>
                  <div className="p-4 space-y-2">
                    {loadingNews ? <div className="flex justify-center py-8"><Spinner /></div> : newsList.length === 0 ? <EmptyState icon={Megaphone} title="No Posts Published" body="Use the form to publish your first official communiqué." /> : newsList.map(art => (
                      <div key={art.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-colors">
                        {art.image_url && <img src={normalizeImageUrl(art.image_url)} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-100 flex-shrink-0" onError={e => ((e.target as HTMLImageElement).src = "/images/landing-hero.png")} />}
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold text-[#0D6E38] uppercase">{art.category} · {art.date}</div>
                          <div className="text-xs font-bold text-gray-900 truncate">{art.title}</div>
                          <div className="text-[10px] text-gray-400 truncate">{art.summary}</div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button type="button" onClick={() => { setEditingNews(art); setNewsForm({ category: art.category || "Announcements", title: art.title || "", summary: art.summary || "", content: art.content || "", imageUrl: art.image_url || "/images/landing-hero.png", author: art.author || "Mulembe Secretariat" }); }} className="p-1.5 rounded-lg bg-gray-100 hover:bg-emerald-100 text-gray-500 hover:text-[#0D6E38] cursor-pointer"><Edit3 size={13} /></button>
                          <button type="button" onClick={() => handleDeleteNews(art.id)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-100 text-gray-500 hover:text-rose-600 cursor-pointer"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LEADER: GALLERY */}
          {role === "leader" && adminTab === "gallery" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
              <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div><h3 className="text-sm font-bold">Photo Gallery & Google Albums Manager</h3><p className="text-[11px] text-gray-400">Add direct photo links or Google Photos album URLs</p></div>
                <div className="flex gap-2">
                  <button type="button" onClick={fetchAllGallery} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"><RefreshCw size={13} className={loadingGallery ? "animate-spin" : ""} /></button>
                  <button type="button" onClick={() => { setEditingGallery(null); setGalleryForm({ imageUrl: "", albumUrl: "", label: "", category: "Cultural Festival", subLocation: "Mama Ngina Waterfront, Mombasa", isLarge: false, sortOrder: "0" }); setCreateGalleryModal(true); }} className={btnPrimary}><Plus size={13} />Add Photo</button>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                {loadingGallery ? <div className="flex justify-center py-10"><Spinner /></div> : galleryList.length === 0 ? <EmptyState icon={ImageIcon} title="Gallery Is Empty" body="Add photo links or Google Album URLs to display cultural moments on the homepage." /> : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {galleryList.map(item => (
                      <div key={item.id} className="rounded-xl border border-gray-200 overflow-hidden bg-white hover:border-[#0D6E38]/40 transition-all group shadow-sm">
                        <div className="relative h-32 bg-gray-100">
                          <img src={normalizeImageUrl(item.image_url, "/images/events-cultural.png")} alt={item.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => ((e.target as HTMLImageElement).src = "/images/events-cultural.png")} />
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white backdrop-blur-sm">{item.category}</span>
                          {item.album_url && <a href={item.album_url} target="_blank" rel="noopener noreferrer" className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#DDA71D] text-[#082f1a] cursor-pointer">Album</a>}
                        </div>
                        <div className="p-2.5">
                          <div className="text-[10px] font-semibold text-gray-800 truncate">{item.title || item.label}</div>
                          {item.sub_location && <div className="text-[9px] text-gray-400 flex items-center gap-0.5 mt-0.5 truncate"><MapPin size={8} />{item.sub_location}</div>}
                          <div className="flex gap-1 mt-2">
                            <button type="button" onClick={() => { setEditingGallery(item); setGalleryForm({ imageUrl: item.image_url || "", albumUrl: item.album_url || "", label: item.title || item.label || "", category: item.category || "Cultural Festival", subLocation: item.sub_location || "", isLarge: Boolean(item.is_large), sortOrder: String(item.sort_order ?? 0) }); setCreateGalleryModal(true); }} className="flex-1 p-1.5 rounded-lg bg-gray-100 hover:bg-emerald-50 text-gray-500 hover:text-[#0D6E38] flex items-center justify-center cursor-pointer"><Edit3 size={11} /></button>
                            <button type="button" onClick={() => handleDeleteGallery(item.id)} className="flex-1 p-1.5 rounded-lg bg-gray-100 hover:bg-rose-50 text-gray-500 hover:text-rose-600 flex items-center justify-center cursor-pointer"><Trash2 size={11} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LEADER: LEADERSHIP */}
          {role === "leader" && adminTab === "leadership" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
              <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div><h3 className="text-sm font-bold">Executive Leadership & Committee</h3><p className="text-[11px] text-gray-400">{leadershipList.length} members · Displayed on public leadership page</p></div>
                <div className="flex gap-2">
                  <button type="button" onClick={fetchAllLeadership} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"><RefreshCw size={13} className={loadingLeadership ? "animate-spin" : ""} /></button>
                  <button type="button" onClick={() => { setEditingLeader(null); setLeaderForm({ name: "", role: "Chairperson", clan: "Bukusu", phone: "", email: "", avatarUrl: "", bio: "", sortOrder: String(leadershipList.length + 1) }); setCreateLeaderModal(true); }} className={btnPrimary}><Plus size={13} />Add Leader</button>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                {loadingLeadership ? <div className="flex justify-center py-10"><Spinner /></div> : leadershipList.length === 0 ? <EmptyState icon={Crown} title="No Leaders Added" body="Add the Chairperson, Secretary General, and Clan Elders to display on the public leadership section." /> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {leadershipList.map(leader => {
                      const initials = leader.name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "ML";
                      return (
                        <div key={leader.id} className="rounded-xl border border-gray-200 p-4 hover:border-[#0D6E38]/40 transition-all space-y-3">
                          <div className="flex items-center gap-3">
                            {leader.avatar_url ? <img src={normalizeImageUrl(leader.avatar_url)} alt={leader.name} className="w-11 h-11 rounded-xl object-cover border-2 border-[#DDA71D]/30 flex-shrink-0" onError={e => ((e.target as HTMLElement).style.display = "none")} /> : <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#082f1a] to-[#0D6E38] text-white font-black text-sm flex items-center justify-center border-2 border-[#DDA71D]/30 flex-shrink-0">{initials}</div>}
                            <div className="min-w-0"><div className="text-xs font-bold text-[#18221B] truncate">{leader.name}</div><div className="text-[10px] text-[#0D6E38] font-semibold">{leader.role}</div>{leader.clan && <div className="text-[9px] text-gray-400">{leader.clan}</div>}</div>
                          </div>
                          {(leader.phone || leader.email) && <div className="text-[10px] text-gray-500 space-y-0.5 bg-gray-50 p-2 rounded-lg">{leader.phone && <div className="flex items-center gap-1"><Phone size={9} className="text-[#0D6E38]" />{leader.phone}</div>}{leader.email && <div className="flex items-center gap-1 truncate"><Mail size={9} className="text-[#0D6E38]" /><span className="truncate">{leader.email}</span></div>}</div>}
                          <div className="flex gap-1.5 pt-1 border-t border-gray-100">
                            <button type="button" onClick={() => { setEditingLeader(leader); setLeaderForm({ name: leader.name || "", role: leader.role || "Chairperson", clan: leader.clan || "Bukusu", phone: leader.phone || "", email: leader.email || "", avatarUrl: leader.avatar_url || "", bio: leader.bio || "", sortOrder: String(leader.sort_order ?? 1) }); setCreateLeaderModal(true); }} className="flex-1 py-1.5 rounded-lg bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-[#0D6E38] text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"><Edit3 size={10} />Edit</button>
                            <button type="button" onClick={() => handleDeleteLeader(leader.id)} className="flex-1 py-1.5 rounded-lg bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-600 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"><Trash2 size={10} />Remove</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      {/* Create Event Modal */}
      {createEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full rounded-2xl p-5 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4"><div><h4 className="font-bold text-sm">Schedule New Gathering</h4><p className="text-[10px] text-gray-400">Publishes to the public events calendar.</p></div><button type="button" onClick={() => setCreateEventModal(false)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"><X size={13} /></button></div>
            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div><label className="block font-semibold text-gray-700 mb-1">Event Title <span className="text-rose-500">*</span></label><input type="text" required value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} placeholder="e.g. Mombasa Luhya Cultural Day 2025" className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold text-gray-700 mb-1">Category</label><select value={eventForm.category} onChange={e => setEventForm({ ...eventForm, category: e.target.value })} className={inputCls}><option>Cultural</option><option>Governance</option><option>Sports</option><option>Networking</option></select></div>
                <div><label className="block font-semibold text-gray-700 mb-1">Venue <span className="text-rose-500">*</span></label><input type="text" required value={eventForm.venue} onChange={e => setEventForm({ ...eventForm, venue: e.target.value })} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div><label className="block font-semibold text-gray-700 mb-1">Month</label><input type="text" required value={eventForm.month} onChange={e => setEventForm({ ...eventForm, month: e.target.value.toUpperCase() })} placeholder="APR" className={inputCls + " text-center font-bold"} /></div>
                <div><label className="block font-semibold text-gray-700 mb-1">Day</label><input type="text" required value={eventForm.day} onChange={e => setEventForm({ ...eventForm, day: e.target.value })} placeholder="26" className={inputCls + " text-center font-bold"} /></div>
                <div><label className="block font-semibold text-gray-700 mb-1">D.o.W.</label><input type="text" required value={eventForm.dow} onChange={e => setEventForm({ ...eventForm, dow: e.target.value.toUpperCase() })} placeholder="SAT" className={inputCls + " text-center font-bold"} /></div>
                <div><label className="block font-semibold text-gray-700 mb-1">Fee</label><input type="text" value={eventForm.entryFee} onChange={e => setEventForm({ ...eventForm, entryFee: e.target.value })} placeholder="Free" className={inputCls + " text-center"} /></div>
              </div>
              <div><label className="block font-semibold text-gray-700 mb-1">Time</label><input type="text" value={eventForm.time} onChange={e => setEventForm({ ...eventForm, time: e.target.value })} placeholder="9:00 AM – 6:00 PM" className={inputCls} /></div>
              <div><label className="block font-semibold text-gray-700 mb-1">Description</label><textarea rows={3} value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Event details..." className={inputCls} /></div>
              <label className="flex items-center gap-2 cursor-pointer text-xs"><input type="checkbox" checked={eventForm.isFeatured} onChange={e => setEventForm({ ...eventForm, isFeatured: e.target.checked })} className="w-4 h-4 rounded text-[#0D6E38]" /><span className="font-semibold text-gray-700">Feature on Landing Page Spotlight</span></label>
              <div className="flex gap-2 pt-1"><button type="button" onClick={() => setCreateEventModal(false)} className={btnSecondary + " flex-1 justify-center"}>Cancel</button><button type="submit" className={btnPrimary + " flex-1 justify-center"}>Publish Event</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Dues Modal */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4"><h4 className="font-bold text-sm">Pay 2025 Annual Dues</h4><button type="button" onClick={() => setPayModalOpen(false)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"><X size={13} /></button></div>
            {payStatus === "success" ? (
              <div className="text-center py-6 space-y-2"><div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"><CheckCircle2 size={24} className="text-[#00A859]" /></div><h5 className="font-bold text-sm text-[#082f1a]">Payment Recorded!</h5><p className="text-xs text-gray-400">Annual dues of KES 500 recorded.</p></div>
            ) : (
              <form onSubmit={handlePayDues} className="space-y-4 text-xs">
                <div><label className="block font-semibold text-gray-700 mb-1">M-Pesa Number</label><input type="tel" required value={payPhone} onChange={e => setPayPhone(e.target.value)} placeholder="e.g. 0712 345678" className={inputCls} /></div>
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-900 text-[11px] border border-emerald-100"><strong>Amount:</strong> KES 500 — 2025 Full Welfare Cover</div>
                <button type="submit" disabled={payStatus === "sending"} className="w-full py-2.5 rounded-xl bg-[#00A859] hover:bg-[#00914c] text-white font-bold text-xs shadow cursor-pointer">{payStatus === "sending" ? "Sending STK Push..." : "Trigger M-Pesa STK Push"}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Emergency Claim Modal */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full rounded-2xl p-5 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4"><h4 className="font-bold text-sm">Emergency Welfare Claim</h4><button type="button" onClick={() => setClaimModalOpen(false)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"><X size={13} /></button></div>
            {claimSuccess ? (
              <div className="text-center py-6 space-y-2"><div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"><CheckCircle2 size={24} className="text-[#0D6E38]" /></div><h5 className="font-bold text-sm text-[#0D6E38]">Claim Submitted!</h5><p className="text-xs text-gray-400">Welfare Officer will verify and disburse via M-Pesa.</p></div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-4 text-xs">
                <div><label className="block font-semibold text-gray-700 mb-1">Claim Type</label><select value={claimType} onChange={e => setClaimType(e.target.value)} className={inputCls}><option>Bereavement Repatriation (KES 50,000)</option><option>Emergency Hospitalization</option><option>Kinship Distress Aid</option></select></div>
                <div><label className="block font-semibold text-gray-700 mb-1">Details & Circumstances</label><textarea required rows={3} value={claimDesc} onChange={e => setClaimDesc(e.target.value)} placeholder="Describe circumstances..." className={inputCls} /></div>
                <button type="submit" className={btnDanger + " w-full justify-center py-2.5"}>Submit Urgent Claim</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Record Contribution Modal */}
      {addContribModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4"><h4 className="font-bold text-sm">Record Manual Contribution</h4><button type="button" onClick={() => setAddContribModal(false)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"><X size={13} /></button></div>
            <form onSubmit={handleAddContribution} className="space-y-3 text-xs">
              <div><label className="block font-semibold text-gray-700 mb-1">Member Name</label><input type="text" value={contribForm.memberName} onChange={e => setContribForm({ ...contribForm, memberName: e.target.value })} placeholder="Full name" className={inputCls} /></div>
              <div><label className="block font-semibold text-gray-700 mb-1">M-Pesa Phone <span className="text-rose-500">*</span></label><input type="tel" required value={contribForm.phone} onChange={e => setContribForm({ ...contribForm, phone: e.target.value })} placeholder="0712 345678" className={inputCls} /></div>
              <div><label className="block font-semibold text-gray-700 mb-1">Amount (KES) <span className="text-rose-500">*</span></label><input type="number" required min="1" value={contribForm.amount} onChange={e => setContribForm({ ...contribForm, amount: e.target.value })} placeholder="500" className={inputCls} /></div>
              <div><label className="block font-semibold text-gray-700 mb-1">Purpose</label><select value={contribForm.purpose} onChange={e => setContribForm({ ...contribForm, purpose: e.target.value })} className={inputCls}><option>Annual Dues</option><option>Solidarity Fund</option><option>Bereavement Contribution</option><option>Voluntary Donation</option></select></div>
              <div className="flex gap-2 pt-1"><button type="button" onClick={() => setAddContribModal(false)} className={btnSecondary + " flex-1 justify-center"}>Cancel</button><button type="submit" className={btnPrimary + " flex-1 justify-center"}>Save Record</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Create Appeal Modal */}
      {createAppealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full rounded-2xl p-5 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4"><div><h4 className="font-bold text-sm">Launch Community Appeal</h4><p className="text-[10px] text-gray-400">Creates a visible appeal on the member portal.</p></div><button type="button" onClick={() => setCreateAppealModal(false)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"><X size={13} /></button></div>
            <form onSubmit={handleCreateAppeal} className="space-y-3 text-xs">
              <div><label className="block font-semibold text-gray-700 mb-1">Appeal Title <span className="text-rose-500">*</span></label><input type="text" required value={appealForm.title} onChange={e => setAppealForm({ ...appealForm, title: e.target.value })} placeholder="e.g. Omwando Family Bereavement" className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold text-gray-700 mb-1">Family / Beneficiary</label><input type="text" value={appealForm.familyName} onChange={e => setAppealForm({ ...appealForm, familyName: e.target.value })} placeholder="Omwando Family" className={inputCls} /></div>
                <div><label className="block font-semibold text-gray-700 mb-1">Location</label><input type="text" value={appealForm.location} onChange={e => setAppealForm({ ...appealForm, location: e.target.value })} placeholder="Coast to Vihiga" className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold text-gray-700 mb-1">Goal Amount (KES) <span className="text-rose-500">*</span></label><input type="number" required min="1" value={appealForm.goalAmount} onChange={e => setAppealForm({ ...appealForm, goalAmount: e.target.value })} placeholder="200000" className={inputCls} /></div>
                <div><label className="block font-semibold text-gray-700 mb-1">Already Raised</label><input type="number" min="0" value={appealForm.raisedAmount} onChange={e => setAppealForm({ ...appealForm, raisedAmount: e.target.value })} placeholder="0" className={inputCls} /></div>
              </div>
              <div><label className="block font-semibold text-gray-700 mb-1">Narrative</label><textarea rows={3} value={appealForm.description} onChange={e => setAppealForm({ ...appealForm, description: e.target.value })} placeholder="Circumstances, transit arrangements..." className={inputCls} /></div>
              <div className="flex gap-2 pt-1"><button type="button" onClick={() => setCreateAppealModal(false)} className={btnSecondary + " flex-1 justify-center"}>Cancel</button><button type="submit" className={btnPrimary + " flex-1 justify-center"}><PlusCircle size={12} />Launch Appeal</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Support Appeal Modal */}
      {appealDonateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4"><h4 className="font-bold text-sm">Support Community Appeal</h4><button type="button" onClick={() => { setAppealDonateModal(null); setAppealDonateStatus("idle"); }} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"><X size={13} /></button></div>
            {appealDonateStatus === "success" ? (
              <div className="text-center py-6 space-y-2"><div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"><CheckCircle2 size={24} className="text-[#00A859]" /></div><h5 className="font-bold text-sm">Contribution Recorded!</h5><p className="text-xs text-gray-400">KES {Number(appealDonateAmount).toLocaleString()} credited to {appealDonateModal.title}</p></div>
            ) : (
              <form onSubmit={handleDonateToAppeal} className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs"><div className="font-bold text-[#18221B]">{appealDonateModal.title}</div><div className="text-[10px] text-gray-500 mt-0.5">Raised: KES {Number(appealDonateModal.raised_amount).toLocaleString()} / Goal: KES {Number(appealDonateModal.goal_amount).toLocaleString()}</div></div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">Amount (KES)</label>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">{[200, 500, 1000, 2000].map(amt => <button key={amt} type="button" onClick={() => setAppealDonateAmount(String(amt))} className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${appealDonateAmount === String(amt) ? "bg-[#0D6E38] text-white border-[#0D6E38]" : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"}`}>{amt.toLocaleString()}</button>)}</div>
                  <input type="number" required min="50" value={appealDonateAmount} onChange={e => setAppealDonateAmount(e.target.value)} placeholder="Custom amount" className={inputCls} />
                </div>
                <div><label className="block font-semibold text-gray-700 mb-1">M-Pesa Number <span className="text-rose-500">*</span></label><input type="tel" required value={appealDonatePhone} onChange={e => setAppealDonatePhone(e.target.value)} placeholder="0712 345678" className={inputCls} /></div>
                <button type="submit" disabled={appealDonateStatus === "sending"} className={btnDanger + " w-full justify-center py-2.5"}><Heart size={12} className="fill-white" />{appealDonateStatus === "sending" ? "Processing..." : `Donate KES ${Number(appealDonateAmount || 0).toLocaleString()}`}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {(createGalleryModal || editingGallery) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full rounded-2xl p-5 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4"><div><h4 className="font-bold text-sm">{editingGallery ? "Edit Gallery Item" : "Add Photo / Album"}</h4><p className="text-[10px] text-gray-400">Photos show on the homepage gallery. Album links open the full Google Photos set.</p></div><button type="button" onClick={() => { setCreateGalleryModal(false); setEditingGallery(null); }} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"><X size={13} /></button></div>
            <form onSubmit={editingGallery ? handleUpdateGallery : handleCreateGallery} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Photo URL</label>
                <input
                  type="text"
                  value={galleryForm.imageUrl}
                  onChange={e => {
                    const val = e.target.value;
                    setGalleryForm({ ...galleryForm, imageUrl: normalizeImageUrl(val, val) });
                  }}
                  placeholder="Paste direct photo link or Bing/Google search link..."
                  className={inputCls}
                />
                {galleryForm.imageUrl && (
                  <div className="mt-1.5 flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-200">
                    <img
                      src={normalizeImageUrl(galleryForm.imageUrl, "/images/events-cultural.png")}
                      alt="Preview"
                      className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0 bg-gray-200"
                      onError={e => ((e.target as HTMLImageElement).src = "/images/events-cultural.png")}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-[#0D6E38] block truncate">
                        {galleryForm.imageUrl.includes("bing.com") || galleryForm.imageUrl.includes("google.") ? "✓ Converted to direct photo link" : "Photo link active"}
                      </span>
                      <span className="text-[9px] text-gray-400 truncate block">{normalizeImageUrl(galleryForm.imageUrl)}</span>
                    </div>
                  </div>
                )}
                <p className="text-[9px] text-gray-400 mt-0.5">Supports direct images and Bing/Google image search URLs.</p>
              </div>
              <div><label className="block font-semibold text-gray-700 mb-1">Google Photos Album URL (optional)</label><input type="text" value={galleryForm.albumUrl} onChange={e => setGalleryForm({ ...galleryForm, albumUrl: e.target.value })} placeholder="https://photos.app.goo.gl/..." className={inputCls} /></div>
              <div><label className="block font-semibold text-gray-700 mb-1">Title / Label</label><input type="text" value={galleryForm.label} onChange={e => setGalleryForm({ ...galleryForm, label: e.target.value })} placeholder="e.g. Isukuti Dancers at Mama Ngina" className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold text-gray-700 mb-1">Category</label><select value={galleryForm.category} onChange={e => setGalleryForm({ ...galleryForm, category: e.target.value })} className={inputCls}><option>Cultural Festival</option><option>Assemblies & AGMs</option><option>Youth & Sports</option><option>Welfare Outreach</option></select></div>
                <div><label className="block font-semibold text-gray-700 mb-1">Venue</label><input type="text" value={galleryForm.subLocation} onChange={e => setGalleryForm({ ...galleryForm, subLocation: e.target.value })} placeholder="Mama Ngina Waterfront" className={inputCls} /></div>
              </div>
              <div className="flex gap-2 pt-1"><button type="button" onClick={() => { setCreateGalleryModal(false); setEditingGallery(null); }} className={btnSecondary + " flex-1 justify-center"}>Cancel</button><button type="submit" className={btnPrimary + " flex-1 justify-center"}>{editingGallery ? "Update" : "Add to Gallery"}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Leadership Modal */}
      {(createLeaderModal || editingLeader) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full rounded-2xl p-5 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4"><div><h4 className="font-bold text-sm">{editingLeader ? "Edit Leader" : "Add Executive Leader"}</h4><p className="text-[10px] text-gray-400">Displayed on the public leadership page.</p></div><button type="button" onClick={() => { setCreateLeaderModal(false); setEditingLeader(null); }} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"><X size={13} /></button></div>
            <form onSubmit={editingLeader ? handleUpdateLeader : handleCreateLeader} className="space-y-3 text-xs">
              <div><label className="block font-semibold text-gray-700 mb-1">Full Name <span className="text-rose-500">*</span></label><input type="text" required value={leaderForm.name} onChange={e => setLeaderForm({ ...leaderForm, name: e.target.value })} placeholder="e.g. Daniel Wanjiku Okoth" className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold text-gray-700 mb-1">Role / Title</label><input type="text" value={leaderForm.role} onChange={e => setLeaderForm({ ...leaderForm, role: e.target.value })} placeholder="Chairperson" className={inputCls} /></div>
                <div><label className="block font-semibold text-gray-700 mb-1">Sub-Clan</label><input type="text" value={leaderForm.clan} onChange={e => setLeaderForm({ ...leaderForm, clan: e.target.value })} placeholder="Bukusu" className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold text-gray-700 mb-1">Phone</label><input type="tel" value={leaderForm.phone} onChange={e => setLeaderForm({ ...leaderForm, phone: e.target.value })} placeholder="0712 345678" className={inputCls} /></div>
                <div><label className="block font-semibold text-gray-700 mb-1">Email</label><input type="email" value={leaderForm.email} onChange={e => setLeaderForm({ ...leaderForm, email: e.target.value })} placeholder="leader@email.com" className={inputCls} /></div>
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Avatar / Profile Photo URL</label>
                <input
                  type="text"
                  value={leaderForm.avatarUrl}
                  onChange={e => {
                    const val = e.target.value;
                    setLeaderForm({ ...leaderForm, avatarUrl: normalizeImageUrl(val, val) });
                  }}
                  placeholder="Paste photo URL or Bing/Google search link..."
                  className={inputCls}
                />
                {leaderForm.avatarUrl && (
                  <div className="mt-1.5 flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-200">
                    <img
                      src={normalizeImageUrl(leaderForm.avatarUrl)}
                      alt="Preview"
                      className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0 bg-gray-200"
                      onError={e => ((e.target as HTMLElement).style.display = "none")}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-[#0D6E38] block truncate">
                        {leaderForm.avatarUrl.includes("bing.com") || leaderForm.avatarUrl.includes("google.") ? "✓ Converted to direct photo link" : "Photo link active"}
                      </span>
                      <span className="text-[9px] text-gray-400 truncate block">{normalizeImageUrl(leaderForm.avatarUrl)}</span>
                    </div>
                  </div>
                )}
                <p className="text-[9px] text-gray-400 mt-0.5">Supports direct images and search links. Leave blank for initials avatar.</p>
              </div>
              <div><label className="block font-semibold text-gray-700 mb-1">Short Bio (optional)</label><textarea rows={2} value={leaderForm.bio} onChange={e => setLeaderForm({ ...leaderForm, bio: e.target.value })} placeholder="Brief background..." className={inputCls} /></div>
              <div className="flex gap-2 pt-1"><button type="button" onClick={() => { setCreateLeaderModal(false); setEditingLeader(null); }} className={btnSecondary + " flex-1 justify-center"}>Cancel</button><button type="submit" className={btnPrimary + " flex-1 justify-center"}>{editingLeader ? "Update Leader" : "Add Leader"}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN ROLE */}
      {roleModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h4 className="font-bold text-sm text-gray-900">Manage Member Role</h4>
                <p className="text-[10px] text-gray-400">
                  {roleModalMember.full_name} ({roleModalMember.membership_no || `ID: ${roleModalMember.id}`})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRoleModalMember(null)}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>

            <form onSubmit={handleAssignRole} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">Assigned System Role</label>
                <select
                  value={assignedRole}
                  onChange={(e) => {
                    const r = e.target.value;
                    setAssignedRole(r);
                    if (r === "ward_leader" && !assignedWard) {
                      const wards = getWards(assignedZone);
                      if (wards.length > 0) setAssignedWard(wards[0]);
                    }
                  }}
                  className={inputCls}
                >
                  <option value="member">Regular Member</option>
                  <option value="area_leader">Area Leader</option>
                  <option value="ward_leader">Ward Leader</option>
                  <option value="subcounty_admin">Subcounty Admin</option>
                  <option value="county_leader">County Leader</option>
                  <option value="super_admin">Super Administrator</option>
                  <option value="national_leader">National Leader (All 47 Counties)</option>
                </select>
              </div>

              {assignedRole === "county_leader" && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">
                    County Jurisdiction <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={assignedCounty}
                    onChange={(e) => setAssignedCounty(e.target.value)}
                    className={inputCls}
                    required
                  >
                    {KENYA_COUNTIES.map((c) => (
                      <option key={c} value={c}>
                        {c} County
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">
                    This leader will oversee all subcounties, wards, areas, and members within this county.
                  </p>
                </div>
              )}

              {assignedRole === "ward_leader" && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1.5">
                      Subcounty <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={assignedZone}
                      onChange={(e) => {
                        const sub = e.target.value;
                        setAssignedZone(sub);
                        const wards = getWards(sub);
                        setAssignedWard(wards[0] || "");
                      }}
                      className={inputCls}
                    >
                      {getSubcounties().map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1.5">
                      Ward Jurisdiction <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={assignedWard}
                      onChange={(e) => setAssignedWard(e.target.value)}
                      className={inputCls}
                      required
                    >
                      {getWards(assignedZone).map((w) => (
                        <option key={w} value={w}>{w} Ward</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-gray-400 mt-1">
                      This leader can create and manage areas and assign area leaders within this ward.
                    </p>
                  </div>
                </div>
              )}

              {assignedRole === "area_leader" && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">
                    Area ID (numeric) or Ward Area
                  </label>
                  <input
                    type="text"
                    value={assignedAreaId}
                    onChange={(e) => setAssignedAreaId(e.target.value)}
                    placeholder="Area ID (e.g. 1)"
                    className={inputCls}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Area leaders can also be assigned directly in the Ward Leader console by selecting an area.
                  </p>
                </div>
              )}

              {assignedRole === "subcounty_admin" && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">
                    Subcounty Jurisdiction <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={assignedZone}
                    onChange={(e) => setAssignedZone(e.target.value)}
                    className={inputCls}
                  >
                    {getSubcounties().map((zone) => (
                      <option key={zone} value={zone}>
                        {zone} Subcounty
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">
                    This admin will have administrative access to all wards and members registered within this subcounty.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRoleModalMember(null)}
                  className={btnSecondary + " flex-1 justify-center"}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigningRole}
                  className={btnPrimary + " flex-1 justify-center"}
                >
                  {assigningRole ? "Saving..." : "Save Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Preview & Confirm Modal */}
      {dispatchConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-lg w-full rounded-2xl p-5 sm:p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h4 className="font-bold text-sm text-[#18221B]">Confirm Broadcast Dispatch</h4>
                <p className="text-[10px] text-gray-400">Review recipient count and channel before sending.</p>
              </div>
              <button
                type="button"
                onClick={() => setDispatchConfirmModalOpen(false)}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100 text-[11px]">
                <div>
                  <span className="text-gray-400 block text-[10px]">Channel</span>
                  <span className="font-bold uppercase text-[#0D6E38]">{dispatchChannel}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Target Recipients</span>
                  <span className="font-bold text-gray-800">
                    {dispatchTargetType === "all" ? dispatchRecipients.length : selectedRecipientIds.length} members
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Sender Authority</span>
                  <span className="font-bold text-gray-800">{userRole}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Jurisdiction</span>
                  <span className="font-bold text-gray-800 truncate block">{jurisdictionLabel}</span>
                </div>
              </div>

              {(dispatchChannel === "sms" || dispatchChannel === "both") && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                  <strong>SMS Cost & Units:</strong> {Math.ceil(dispatchMessage.length / 160) || 1} SMS unit per member ×{" "}
                  {dispatchTargetType === "all" ? dispatchRecipients.length : selectedRecipientIds.length} recipients ={" "}
                  <strong>
                    {(Math.ceil(dispatchMessage.length / 160) || 1) *
                      (dispatchTargetType === "all" ? dispatchRecipients.length : selectedRecipientIds.length)}{" "}
                    total SMS units
                  </strong>
                  .
                </div>
              )}

              {(dispatchChannel === "email" || dispatchChannel === "both") && dispatchSubject && (
                <div>
                  <span className="text-gray-400 block text-[10px] mb-0.5">Subject</span>
                  <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 font-semibold text-gray-800 text-xs">
                    {dispatchSubject}
                  </div>
                </div>
              )}

              <div>
                <span className="text-gray-400 block text-[10px] mb-0.5">Message Content</span>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 whitespace-pre-wrap leading-relaxed text-xs">
                  {dispatchMessage}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDispatchConfirmModalOpen(false)}
                  disabled={dispatchSubmitting}
                  className={btnSecondary + " flex-1 justify-center"}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendDispatch}
                  disabled={dispatchSubmitting}
                  className={btnPrimary + " flex-1 justify-center"}
                >
                  {dispatchSubmitting ? "Broadcasting..." : "Confirm & Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Area Leader Modal */}
      {assignLeaderModalArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h4 className="font-bold text-sm text-[#18221B]">Assign Area Leader</h4>
                <p className="text-[10px] text-gray-400">{assignLeaderModalArea.name} (#{assignLeaderModalArea.id})</p>
              </div>
              <button
                type="button"
                onClick={() => setAssignLeaderModalArea(null)}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Member from Ward</label>
                <select
                  value={selectedAreaLeaderId}
                  onChange={(e) => setSelectedAreaLeaderId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">-- Choose active member --</option>
                  {membersList
                    .filter((m) => !assignLeaderModalArea.ward || m.ward?.toLowerCase() === assignLeaderModalArea.ward.toLowerCase() || !m.ward)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.phone}) - {m.ward || "No ward"}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">
                  Assigning will update the member&apos;s role to Area Leader for this area.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignLeaderModalArea(null)}
                  className={btnSecondary + " flex-1 justify-center"}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedAreaLeaderId || assigningAreaLeader}
                  onClick={() => handleAssignAreaLeader(assignLeaderModalArea.id, Number(selectedAreaLeaderId))}
                  className={btnPrimary + " flex-1 justify-center"}
                >
                  {assigningAreaLeader ? "Assigning..." : "Confirm Leader"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
