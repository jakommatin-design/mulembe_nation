"use client";
import { useState, useEffect } from "react";
import { ArrowRight, Maximize2, X, ExternalLink, Image as ImageIcon } from "lucide-react";
import { normalizeImageUrl } from "@/lib/image-utils";

export interface GalleryPhoto {
  id?: number | string;
  src: string;
  label: string;
  category: string;
  sub: string;
  large: boolean;
  album_url?: string;
}

export default function GallerySection() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const categories = ["All", "Cultural Festival", "Governance", "Heritage", "Youth & Career", "Solidarity"];

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gallery");
      const data = await res.json();
      if (data.success && Array.isArray(data.photos)) {
        const mapped: GalleryPhoto[] = data.photos.map((p: any) => ({
          id: p.id,
          src: normalizeImageUrl(p.image_url, "/images/events-cultural.png"),
          label: p.label,
          category: p.category,
          sub: p.sub_location || "Mombasa County",
          large: Boolean(p.is_large),
          album_url: p.album_url || "",
        }));
        setPhotos(mapped);
      }
    } catch (err) {
      console.error("Error fetching gallery:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const filteredPhotos = activeFilter === "All"
    ? photos
    : photos.filter((p) => p.category === activeFilter);

  return (
    <section id="gallery" className="py-20 bg-white relative overflow-hidden" aria-labelledby="gallery-heading">
      {/* Subtle ambient light */}
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-amber-100/30 rounded-full blur-3xl pointer-events-none translate-x-1/3" />
      <div className="absolute bottom-10 left-0 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -translate-x-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-[#E6E0D5] gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#0D6E38] mb-3">
              <span className="w-2 h-2 rounded-full bg-[#0D6E38] animate-pulse" />
              <span style={{ fontFamily: "var(--font-kalam), cursive" }}>Community Visuals & Archive</span>
            </div>

            <h2
              id="gallery-heading"
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#18221B] tracking-tight leading-[1.2]"
              style={{ fontFamily: "var(--font-kalam), var(--font-caveat), cursive" }}
            >
              <span>Moments That </span>
              <span
                className="relative inline-block px-3.5 py-0.5 rounded-2xl bg-[#F6A623] text-[#1E252B] -rotate-1 font-extrabold shadow-xs my-1"
                style={{ borderRadius: "255px 25px 225px 25px/25px 225px 25px 255px" }}
              >
                Bring Us Together
              </span>
            </h2>

            {/* Cyan doodle underline */}
            <div className="relative max-w-xs -mt-1 mb-2">
              <svg
                className="w-48 h-3 pointer-events-none"
                style={{ height: "12px", width: "192px", maxHeight: "12px" }}
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
            </div>

            <p className="text-xs sm:text-sm text-gray-600 max-w-xl">
              Celebrating our vibrant unity, ceremonies, youth sporting events, and cultural festivals across Kenya.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <span
              className="text-xs font-bold text-[#0D6E38] bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-full rotate-1 shadow-xs"
              style={{ fontFamily: "var(--font-kalam), cursive" }}
            >
              Capturing 18 Luhya Sub-Tribes Across Kenya
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Updated live by community media desk</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {categories.map((cat) => {
            const isActive = activeFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-[#0D6E38] text-white shadow-sm ring-2 ring-[#0D6E38]/20"
                    : "bg-[#F7F4EE] hover:bg-emerald-50 text-gray-700 border border-[#E6E0D5] hover:border-emerald-300"
                }`}
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#0D6E38] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-500">Loading community gallery...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredPhotos.length === 0 && (
          <div className="py-14 text-center rounded-3xl bg-gray-50 border border-dashed border-gray-300 p-8 space-y-2">
            <ImageIcon size={32} className="mx-auto text-gray-400" />
            <h4 className="font-bold text-sm text-gray-800">No Photos in This Category</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Gallery moments submitted via direct links or Google Photos albums will appear here.
            </p>
          </div>
        )}

        {/* Mosaic Bento Gallery Grid */}
        {!loading && filteredPhotos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[220px]">
            {filteredPhotos.map((p) => (
              <div
                key={p.id || p.label}
                onClick={() => setSelectedPhoto(p)}
                className={`relative rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group cursor-pointer border border-[#E6E0D5] bg-gray-900 ${
                  p.large ? "sm:col-span-2 sm:row-span-2" : ""
                }`}
              >
                <img
                  src={p.src}
                  alt={p.label}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/events-cultural.png";
                  }}
                />

                {/* Gradient Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                {/* Tag Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/25 text-white backdrop-blur-md border border-white/20 shadow-xs">
                    {p.category}
                  </span>
                  {p.album_url && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#DDA71D] text-[#082f1a] shadow-xs flex items-center gap-1">
                      <ExternalLink size={10} /> Google Album
                    </span>
                  )}
                </div>

                {/* Hover Fullscreen Icon */}
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 size={14} />
                </div>

                {/* Bottom Caption */}
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white space-y-1">
                  <h3 className={`font-bold leading-tight ${p.large ? "text-lg sm:text-xl" : "text-sm"}`} style={{ fontFamily: "var(--font-outfit)" }}>
                    {p.label}
                  </h3>
                  <p className="text-xs text-emerald-300 font-medium">{p.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full rounded-3xl overflow-hidden bg-black border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <img
              src={selectedPhoto.src}
              alt={selectedPhoto.label}
              className="w-full max-h-[75vh] object-contain bg-black"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/events-cultural.png";
              }}
            />
            <div className="p-6 bg-[#082f1a] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#DDA71D]">
                  {selectedPhoto.category}
                </span>
                <h3 className="text-xl font-bold mt-1" style={{ fontFamily: "var(--font-outfit)" }}>
                  {selectedPhoto.label}
                </h3>
                <p className="text-xs text-emerald-300 mt-0.5">{selectedPhoto.sub}</p>
              </div>

              {selectedPhoto.album_url && (
                <a
                  href={selectedPhoto.album_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#DDA71D] hover:bg-[#F5C842] text-[#082f1a] font-bold text-xs shadow-md transition-all self-start sm:self-center"
                >
                  <ExternalLink size={14} />
                  <span>Open Full Google Photos Album</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
