import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DirectorySection from "@/components/DirectorySection";
import { auth, currentUser } from "@clerk/nextjs/server";
import { query } from "@/lib/db";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Leader Directory — Mulembe18 Kenya",
  description: "Leadership access only: Mulembe18 Member Registry.",
};

export default async function MemberDirectoryPage() {
  const { userId } = await auth();
  let role = "member";

  if (userId) {
    const memberRows = await query<any>(
      "SELECT role FROM members WHERE clerk_id = ? LIMIT 1",
      [userId]
    );
    if (memberRows.length > 0) {
      role = memberRows[0].role || "member";
    } else {
      const user = await currentUser();
      const email = user?.emailAddresses?.[0]?.emailAddress;
      if (email) {
        const rows = await query<any>(
          "SELECT role FROM members WHERE email = ? LIMIT 1",
          [email.toLowerCase().trim()]
        );
        if (rows.length > 0) role = rows[0].role || "member";
      }
    }
  }

  const isLeader = [
    "national_leader",
    "super_admin",
    "subcounty_admin",
    "ward_leader",
    "area_leader",
  ].includes(role);

  if (!isLeader) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FBF8F2] text-[#18221B]">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert size={28} />
            </div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-outfit)" }}>
              Leadership Access Only
            </h1>
            <p className="text-xs text-gray-600 leading-relaxed">
              The Member Directory is reserved exclusively for registered Mulembe18 community leaders (Area Leaders, Ward Leaders, Subcounty Administrators, and National Leaders).
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/dashboard"
                className="w-full py-2.5 rounded-full bg-[#0D6E38] text-white text-xs font-bold hover:bg-[#0a4d29] transition-all shadow-md inline-flex items-center justify-center gap-1.5"
              >
                <span>Go to My Member Hub</span>
              </Link>
              <Link
                href="/national-leaders"
                className="w-full py-2.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-all inline-flex items-center justify-center gap-1.5"
              >
                <span>View National Leaders</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F2] text-[#18221B]">
      <Header />
      <main className="flex-1">
        <section id="directory" className="py-12 bg-white min-h-[70vh]">
          <DirectorySection />
        </section>
      </main>
      <Footer />
    </div>
  );
}
