import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://mulembe18.org");

export const viewport: Viewport = {
  themeColor: "#0D6E38",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Mulembe18 — Luhya Community in Kenya | One Community, Many Roots",
    template: "%s | Mulembe18",
  },
  description:
    "Mulembe18 is the unifying welfare, social and cultural association connecting the Luhya community across Kenya — celebrate culture, support welfare, and grow together.",
  keywords: [
    "Mulembe18",
    "Mulembe Nation",
    "Luhya Community Kenya",
    "Luhya Community Mombasa",
    "Luhya diaspora Kenya",
    "Kenya Luhya welfare",
    "Western Kenya",
    "Bukusu",
    "Maragoli",
    "Wanga",
    "Samia",
    "Isukha",
    "Idakho",
    "Tiriki",
    "Kabras",
    "Banyore",
    "Tachoni",
    "Kisa",
    "Marama",
    "Tsotso",
    "Luhya cultural festival",
    "Mulembe association",
  ],
  authors: [{ name: "Mulembe18 Secretariat", url: siteUrl }],
  creator: "Mulembe18 Community",
  publisher: "Mulembe18 Association",
  category: "Community & Welfare",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/images/logo.png" },
      { url: "/images/logo.png", sizes: "192x192", type: "image/png" },
      { url: "/images/logo.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
  verification: {
    google: "sSc5hwbnnjosKRzstKHcDN-JQTrjJu3XOXg8NE8Ij14",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Mulembe18 — Luhya Community in Kenya | One Community, Many Roots",
    description:
      "The official unifying welfare and cultural association for Luhya people living in Kenya. Emergency welfare support, cultural preservation, and grassroots community leadership.",
    url: siteUrl,
    siteName: "Mulembe18",
    locale: "en_KE",
    type: "website",
    images: [
      {
        url: "/images/landing-hero.png",
        width: 1200,
        height: 630,
        alt: "Mulembe18 Kenya Chapter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mulembe18 — Luhya Community in Kenya",
    description:
      "One Community, Many Roots, Stronger Together. Unifying the Luhya community across Kenya.",
    images: ["/images/landing-hero.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "NGO",
      "@id": `${siteUrl}/#organization`,
      name: "Mulembe18 Association",
      alternateName: ["Mulembe 18", "Mulembe Nation Kenya Chapter", "Mulembe18 Kenya"],
      url: siteUrl,
      logo: `${siteUrl}/images/logo.png`,
      image: `${siteUrl}/images/landing-hero.png`,
      description:
        "The unifying welfare, social and cultural association for Luhya people across Kenya.",
      areaServed: {
        "@type": "AdministrativeArea",
        name: "Kenya",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Mombasa",
        addressRegion: "Coast",
        addressCountry: "KE",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Community Secretariat",
        telephone: "+254700000000",
        areaServed: "KE",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Mulembe18 — Luhya Community in Kenya",
      description: "One Community, Many Roots, Stronger Together.",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
      inLanguage: "en-KE",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="google-site-verification" content="sSc5hwbnnjosKRzstKHcDN-JQTrjJu3XOXg8NE8Ij14" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Kalam:wght@400;700&family=Outfit:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
