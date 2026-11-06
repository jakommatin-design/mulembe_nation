import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0D6E38",
};

export const metadata: Metadata = {
  title: "Mulembe18 — Luhya Community in Mombasa | One Community, Many Roots",
  description:
    "mulembe18 is the unifying welfare and cultural association for Luhya people across Mombasa — connect, support, celebrate and grow together.",
  keywords: [
    "Mulembe18",
    "Luhya community",
    "Mombasa",
    "Luhya diaspora",
    "Kenya",
    "welfare",
    "cultural association",
  ],
  authors: [{ name: "Mulembe18 Community" }],
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
  openGraph: {
    title: "Mulembe18 — Luhya Community in Mombasa",
    description:
      "One Community, Many Roots, Stronger Together. Connecting the Luhya diaspora across Mombasa & Coastal Kenya.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Kalam:wght@400;700&family=Outfit:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
        className="selection:bg-[#0D6E38] selection:text-white"
      >
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#0D6E38",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
