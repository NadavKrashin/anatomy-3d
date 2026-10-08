import type { MetadataRoute } from "next";

/** Web app manifest: name and icons when added to a phone's home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Or's Anatomy",
    short_name: "Or's Anatomy",
    description:
      "Learn the body by exploring it — interactive 3D anatomy for medical students.",
    lang: "he",
    dir: "rtl",
    start_url: "/",
    display: "standalone",
    background_color: "#e9edef",
    theme_color: "#e9edef",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
