"use client";
import { useState, useEffect } from "react";
import { ArrowRight, Calendar, Eye, Share2, X, Newspaper, Bookmark } from "lucide-react";
import { normalizeImageUrl } from "@/lib/image-utils";

interface Article {
  id: string;
  category: "Announcements" | "Welfare & Drives" | "Culture & Festivals" | "Success Stories";
  catBg: string;
  image: string;
  title: string;
  date: string;
  readTime: string;
  views: string;
  author: string;
  excerpt: string;
  content: string[];
}

const tabs = ["All News", "Announcements", "Culture & Festivals", "Welfare & Drives", "Success Stories"];

export default function NewsSection() {
  const [newsList, setNewsList] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All News");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.articles)) {
          const mapped: Article[] = data.articles.map((item: any) => ({
            id: String(item.id),
            category: item.category,
            catBg: item.category === "Announcements" ? "bg-[#DDA71D] text-[#082f1a]" :
                   item.category === "Culture & Festivals" ? "bg-[#0D6E38] text-white" :
                   item.category === "Welfare & Drives" ? "bg-[#0077B6] text-white" : "bg-purple-700 text-white",
            image: normalizeImageUrl(item.image_url, "/images/landing-hero.png"),
            title: item.title,
            date: item.date,
            readTime: item.read_time || "3 min read",
            views: "Official Circular",
            author: item.author || "Secretariat Desk",
            excerpt: item.summary,
            content: typeof item.content === "string" ? [item.content] : item.content,
          }));
          setNewsList(mapped);
        }
      })
      .catch((err) => console.error("Error fetching news:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = newsList.filter(
    (a) => activeTab === "All News" || a.category === activeTab
  );

  return (
    <section id="news" className="py-20 bg-gray-50 border-y border-[#E6E0D5] relative overflow-hidden" aria-labelledby="news-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-[#E6E0D5]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D6E38] bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full shadow-xs" style={{ fontFamily: "var(--font-kalam), cursive" }}>
              Community Press &amp; Circulars
            </span>
            <h2
              id="news-heading"
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#18221B] mt-2.5 tracking-tight leading-[1.2]"
              style={{ fontFamily: "var(--font-kalam), var(--font-caveat), cursive" }}
            >
              <span>News, </span>
              <span className="relative inline-block mx-1 px-3.5 py-0.5 rounded-2xl bg-[#F6A623] text-[#1E252B] -rotate-1 font-extrabold shadow-xs" style={{ borderRadius: "255px 25px 225px 25px/25px 225px 25px 255px" }}>
                Bulletins
              </span>
              <span className="relative inline-block">
                <span>&amp; Communication</span>
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
            <p className="text-sm text-gray-600 mt-1">
              Official announcements, cultural updates, welfare circulars, and member milestones across Kenya.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="mt-4 md:mt-0 flex gap-1.5 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === tab
                  ? "bg-[#0D6E38] text-white shadow-md scale-105"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* News Cards Grid */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#0D6E38] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-500 font-medium">Loading circulars and communiqués from database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center rounded-3xl bg-white border border-[#E6E0D5] p-8 space-y-2">
            <Newspaper size={32} className="mx-auto text-gray-400" />
            <h4 className="font-bold text-sm text-gray-800">No Communiqués in This Category</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Official circulars and announcements will appear here once published from the Secretariat console.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((article) => (
              <article
                key={article.id}
                className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between border border-gray-200 hover:border-[#0D6E38]/40 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group"
              >
                <div>
                  {/* Image Banner */}
                  <div className="relative h-48 w-full overflow-hidden bg-gray-900">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/landing-hero.png";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <span
                      className={`absolute top-3 left-3 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm ${article.catBg}`}
                    >
                      {article.category}
                    </span>
                    <span className="absolute bottom-3 right-3 text-[11px] text-white/90 bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-sm font-medium">
                      {article.readTime}
                    </span>
                  </div>

                  {/* Article Info */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-[#0D6E38]" />
                        <span>{article.date}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye size={12} />
                        <span>{article.views}</span>
                      </span>
                    </div>

                    <h3
                      className="font-bold text-base text-[#18221B] leading-snug group-hover:text-[#0D6E38] transition-colors line-clamp-2"
                      style={{ fontFamily: "var(--font-outfit)" }}
                    >
                      {article.title}
                    </h3>

                    <p className="text-xs text-gray-600 mt-2.5 leading-relaxed line-clamp-3">
                      {article.excerpt}
                    </p>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="px-5 pb-5 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedArticle(article)}
                    className="w-full inline-flex items-center justify-between text-xs font-bold text-[#0D6E38] hover:text-[#0a4d29] transition-colors py-1"
                  >
                    <span>Read Full Communication</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Newsletter Signup Banner */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-[#082f1a] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full kitenge-watermark opacity-15 pointer-events-none" />
          <div className="relative z-10 space-y-1 text-center md:text-left">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#DDA71D]">Direct Dispatch</span>
            <h3 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
              Receive Official Communication in Your Inbox
            </h3>
            <p className="text-xs text-emerald-200/80">
              Never miss a general assembly notice, bereavement drive, or cultural festival update.
            </p>
          </div>
          <div className="relative z-10 w-full md:w-auto">
            <a
              href="#contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#DDA71D] hover:bg-[#F5C842] text-[#082f1a] font-extrabold text-xs sm:text-sm shadow-lg transition-all whitespace-nowrap"
            >
              Subscribe to Dispatch <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Article Reader Modal */}
      {selectedArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="glass-card bg-white max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl border border-white/60 relative max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Image */}
            <div className="relative h-56 w-full overflow-hidden bg-gray-900 flex-shrink-0">
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/landing-hero.png";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span className={`inline-block font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2 ${selectedArticle.catBg}`}>
                  {selectedArticle.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold leading-tight" style={{ fontFamily: "var(--font-outfit)" }}>
                  {selectedArticle.title}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-500 pb-3 border-b border-gray-100">
                <span>By {selectedArticle.author} • {selectedArticle.date}</span>
                <span>{selectedArticle.readTime} • {selectedArticle.views}</span>
              </div>

              <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                {selectedArticle.content.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">Official Mulembe18 Communication</span>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-5 py-2.5 rounded-full bg-[#0D6E38] text-white text-xs font-bold hover:bg-[#0a4d29] transition-colors"
                >
                  Close Article
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
