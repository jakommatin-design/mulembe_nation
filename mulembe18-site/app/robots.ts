import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://mulembe18.org");

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/register", "/member-directory"],
        disallow: [
          "/api/",
          "/dashboard",
          "/dashboard/*",
          "/ward-dashboard",
          "/ward-dashboard/*",
          "/area-dashboard",
          "/area-dashboard/*",
          "/subcounty-dashboard",
          "/subcounty-dashboard/*",
          "/_next/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/register", "/member-directory"],
        disallow: [
          "/api/",
          "/dashboard",
          "/ward-dashboard",
          "/area-dashboard",
          "/subcounty-dashboard",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

