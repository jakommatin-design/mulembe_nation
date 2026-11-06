import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FBF8F2] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[#DDA71D] flex items-center justify-center mb-4 text-2xl font-black">
        404
      </div>
      <h2 className="text-xl font-black text-[#18221B] mb-2" style={{ fontFamily: "var(--font-outfit)" }}>
        Page Not Found
      </h2>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        The community page or resource you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-xl bg-[#0D6E38] hover:bg-[#082f1a] text-white text-xs font-bold transition-all"
      >
        Return to Mulembe18 Home
      </Link>
    </div>
  );
}

