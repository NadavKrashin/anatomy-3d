import type { Metadata, Viewport } from "next";
import {
  Frank_Ruhl_Libre,
  IBM_Plex_Sans_Hebrew,
  Noto_Serif_Hebrew,
} from "next/font/google";
import { AnatomyDataProvider } from "@/components/providers/AnatomyDataProvider";
import { ProgressProvider } from "@/components/providers/ProgressProvider";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import "./globals.css";

// Serif for structure names and titles (atlas labels), sans for the UI.
// Frank Ruhl Libre sets Latin only; Hebrew falls through to Noto Serif Hebrew
// (Frank Ruhl's Hebrew read like "David"; user, 2026-10-08).
const frank = Frank_Ruhl_Libre({
  variable: "--font-frank",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  // The generated metric fallback (local Times New Roman, no unicode-range)
  // would catch Hebrew before Noto Serif Hebrew does.
  adjustFontFallback: false,
});

const notoSerifHebrew = Noto_Serif_Hebrew({
  variable: "--font-serif-hebrew",
  subsets: ["hebrew"],
  weight: ["400", "500", "600"],
});

const plex = IBM_Plex_Sans_Hebrew({
  variable: "--font-plex",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Or's Anatomy",
  applicationName: "Or's Anatomy",
  description:
    "Learn the body by exploring it — interactive 3D anatomy for medical students.",
  // Home-screen name on iOS; the icon is src/app/apple-icon.png.
  appleWebApp: {
    capable: true,
    title: "Or's Anatomy",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#e9edef",
  width: "device-width",
  initialScale: 1,
  // Stops mobile browsers zooming the page (the 3D view pinches itself);
  // with 16px form fields this also stops iOS zooming into the search box.
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${frank.variable} ${notoSerifHebrew.variable} ${plex.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans">
        <SettingsProvider>
          <AnatomyDataProvider>
            <ProgressProvider>{children}</ProgressProvider>
          </AnatomyDataProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
