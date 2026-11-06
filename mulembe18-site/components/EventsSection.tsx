"use client";
import { useState, useEffect } from "react";
import {
  MapPin,
  Clock,
  Users,
  ArrowRight,
  Calendar,
  CheckCircle2,
  X,
  Star,
  Waves,
  CalendarDays,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { BorderBeam } from "@/components/magicui/border-beam";
import { normalizeImageUrl } from "@/lib/image-utils";

export interface EventItem {
  id: number | string;
  title: string;
  event_date?: string;
  day?: string;
  dow?: string;
  month?: string;
  time?: string;
  venue: string;
  category: "Cultural" | "Governance" | "Sports" | "Networking" | string;
  entry_fee?: string;
  attendees?: string | number;
  description?: string;
  image_url?: string;
  is_featured?: boolean | number;
  status?: string;
}

const filterTabs = ["All", "Cultural", "Governance", "Sports", "Networking"];

export default function EventsSection() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState("All");
  const [rsvpEvent, setRsvpEvent] = useState<EventItem | null>(null);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeePhone, setAttendeePhone] = useState("");

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (data.success && Array.isArray(data.events)) {
        setEvents(data.events);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(
    (e) => selectedCat === "All" || e.category === selectedCat
  );

  const featuredEvent = events.find((e) => Boolean(e.is_featured));

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rsvpEvent && attendeeName && attendeePhone) {
      try {
        await fetch("/api/events", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: rsvpEvent.id, attendees: true }),
        });
      } catch (err) {
        console.error("RSVP failed:", err);
      }
      setRsvpSuccess(true);
      setTimeout(() => {
        setRsvpSuccess(false);
        setRsvpEvent(null);
        setAttendeeName("");
        setAttendeePhone("");
        fetchEvents();
      }, 2500);
    }
  };

  return (
    <section id="events" className="py-20 bg-[#FBF8F2] border-y border-[#E6E0D5] relative overflow-hidden" aria-labelledby="events-heading">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-0 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -translate-x-1/2" />
      <div className="absolute bottom-10 right-0 w-80 h-80 bg-amber-100/30 rounded-full blur-3xl pointer-events-none translate-x-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#0D6E38] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#0D6E38] animate-pulse" />
            <span style={{ fontFamily: "var(--font-kalam), cursive" }}>Community Calendar &amp; Gatherings</span>
          </div>

          <h2
            id="events-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#18221B] tracking-tight leading-[1.2]"
            style={{ fontFamily: "var(--font-kalam), var(--font-caveat), cursive" }}
          >
            <span>Upcoming </span>
            <span
              className="relative inline-block px-3.5 py-0.5 rounded-2xl bg-[#F6A623] text-[#1E252B] -rotate-1 font-extrabold shadow-xs my-1"
              style={{ borderRadius: "255px 25px 225px 25px/25px 225px 25px 255px" }}
            >
              Community
            </span>
            <span className="relative inline-block mx-1">
              <span>Gatherings</span>
              {/* Cyan doodle underline */}
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
          </h2>

          <p className="text-gray-600 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
            Celebrate our rich heritage, attend diaspora forums, participate in clan sports, and network with Luhya professionals across Coastal Kenya.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#0D6E38] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-500 font-medium">Checking live event calendar...</p>
          </div>
        )}

        {/* Empty State: Strictly shown when there are no events in DB */}
        {!loading && events.length === 0 && (
          <div className="max-w-2xl mx-auto bg-white/90 backdrop-blur-md rounded-3xl p-8 sm:p-12 text-center border border-[#E6E0D5] shadow-sm space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#0D6E38] flex items-center justify-center mx-auto shadow-xs">
              <CalendarDays size={32} />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full">
                Calendar Notice
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#18221B]" style={{ fontFamily: "var(--font-outfit)" }}>
                No Events Scheduled For Now
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                There are currently no upcoming community events or cultural gatherings listed. Please check back soon or follow our official communiqués for announcements.
              </p>
            </div>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={fetchEvents}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F7F4EE] hover:bg-emerald-50 text-gray-800 text-xs font-bold border border-[#E6E0D5] transition-colors"
              >
                <RefreshCw size={13} />
                <span>Check for Updates</span>
              </button>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0D6E38] hover:bg-[#0a4d29] text-white text-xs font-bold shadow-sm transition-all"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                <span>Contact Secretariat</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </div>
        )}

        {/* Events Available: Render Filters & Live Events */}
        {!loading && events.length > 0 && (
          <>
            {/* Filter Category Tabs */}
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {filterTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedCat(tab)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-xs ${
                    selectedCat === tab
                      ? "bg-[#0D6E38] text-white shadow-sm ring-2 ring-[#0D6E38]/20"
                      : "bg-white text-gray-700 border border-[#E6E0D5] hover:border-emerald-300"
                  }`}
                  style={{ fontFamily: "var(--font-outfit)" }}
                >
                  {tab === "All" ? `All Events (${events.length})` : tab}
                </button>
              ))}
            </div>

            {/* Featured Event Banner (if featured exists) */}
            {featuredEvent && (
              <div className="glass-card-dark rounded-3xl p-6 sm:p-8 mb-10 relative overflow-hidden border border-white/20 shadow-2xl">
                <BorderBeam size={240} duration={16} colorFrom="#DDA71D" colorTo="#0D6E38" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                  <div className="lg:col-span-5 relative rounded-2xl overflow-hidden shadow-lg border border-white/10 group">
                    <img
                      src={normalizeImageUrl(featuredEvent.image_url, "/images/events-cultural.png")}
                      alt={featuredEvent.title}
                      className="w-full h-64 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/events-cultural.png";
                      }}
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#DDA71D] text-[#082f1a] uppercase shadow-sm">
                        <Star size={11} fill="currentColor" />
                        <span>Featured Event</span>
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-4 text-white">
                    <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold border border-white/15">
                      {featuredEvent.category} • {featuredEvent.attendees || 0} RSVPs Confirmed
                    </span>

                    <h3 className="text-2xl sm:text-3xl font-extrabold leading-snug tracking-tight text-white" style={{ fontFamily: "var(--font-outfit)" }}>
                      {featuredEvent.title}
                    </h3>

                    <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-emerald-200">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-[#DDA71D]" />
                        <span>{featuredEvent.time || featuredEvent.event_date}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-[#DDA71D]" />
                        <span>{featuredEvent.venue}</span>
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-emerald-200/80 leading-relaxed">
                      {featuredEvent.description || "Official community gathering organized by Mulembe18 Coastal Chapter."}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={() => setRsvpEvent(featuredEvent)}
                        className="px-6 py-3 rounded-full bg-[#DDA71D] hover:bg-[#F5C842] text-[#082f1a] font-extrabold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all"
                        style={{ fontFamily: "var(--font-outfit)" }}
                      >
                        Reserve Your Free Pass
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Regular Events List */}
            <div className="space-y-4">
              {filteredEvents.map((e) => (
                <div
                  key={e.id}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[#E6E0D5] hover:border-[#0D6E38]/50 transition-all duration-200 shadow-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-16 rounded-xl bg-emerald-50 border border-emerald-200 text-[#0D6E38] flex flex-col items-center justify-center flex-shrink-0 shadow-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{e.month || "EVT"}</span>
                      <span className="text-xl font-extrabold leading-none" style={{ fontFamily: "var(--font-outfit)" }}>
                        {e.day || "•"}
                      </span>
                      <span className="text-[9px] font-semibold text-gray-500">{e.dow || "DAY"}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {e.category}
                        </span>
                        {e.attendees !== undefined && (
                          <span className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
                            <Users size={12} className="text-gray-400" />
                            {e.attendees} attending
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-[#18221B] text-base" style={{ fontFamily: "var(--font-outfit)" }}>
                        {e.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1"><MapPin size={12} className="text-[#0D6E38]" /> {e.venue}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock size={12} className="text-[#0D6E38]" /> {e.time || "Scheduled"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex md:justify-end">
                    <button
                      onClick={() => setRsvpEvent(e)}
                      className="w-full md:w-auto px-5 py-2.5 rounded-full bg-[#0D6E38] hover:bg-[#0a4d29] text-white text-xs font-bold transition-all shadow-xs"
                      style={{ fontFamily: "var(--font-outfit)" }}
                    >
                      RSVP Pass
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>

      {/* RSVP Modal */}
      {rsvpEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-white/60 relative space-y-4">
            <button
              onClick={() => {
                setRsvpEvent(null);
                setRsvpSuccess(false);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {rsvpSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} className="text-[#0D6E38]" />
                </div>
                <h3 className="text-xl font-bold text-[#18221B]" style={{ fontFamily: "var(--font-outfit)" }}>
                  RSVP Confirmed!
                </h3>
                <p className="text-xs text-gray-600">
                  Your seat for <strong>{rsvpEvent.title}</strong> has been secured. We look forward to seeing you there!
                </p>
              </div>
            ) : (
              <form onSubmit={handleRsvpSubmit} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#0D6E38] tracking-wider">Event RSVP</span>
                  <h3 className="text-lg font-bold text-[#18221B]" style={{ fontFamily: "var(--font-outfit)" }}>
                    {rsvpEvent.title}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1"><MapPin size={12} className="text-[#0D6E38]" />{rsvpEvent.venue}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1"><Clock size={12} className="text-[#DDA71D]" />{rsvpEvent.time || "Scheduled"}</span>
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={attendeeName}
                      onChange={(e) => setAttendeeName(e.target.value)}
                      placeholder="e.g. Daniel Shikuku"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0D6E38]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">M-Pesa / Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={attendeePhone}
                      onChange={(e) => setAttendeePhone(e.target.value)}
                      placeholder="e.g. 0712 345 678"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0D6E38]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#0D6E38] hover:bg-[#0a4d29] text-white text-xs font-bold shadow-md transition-colors"
                >
                  Confirm Event Attendance
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
