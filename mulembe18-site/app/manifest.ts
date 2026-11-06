import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mulembe18 — Luhya Community in Mombasa",
    short_name: "Mulembe18",
    description:
      "Mulembe18 is the unifying welfare, social and cultural association for Luhya people across Mombasa County.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF8F2",
    theme_color: "#0D6E38",
    icons: [
      {
        src: "/images/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

