import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Hebrew, Miriam_Libre } from "next/font/google";
import { AnatomyDataProvider } from "@/components/providers/AnatomyDataProvider";
import { ProgressProvider } from "@/components/providers/ProgressProvider";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import "./globals.css";

// Miriam Libre for structure names, titles and the wordmark (user's pick,
// 2026-10-08, after Frank Ruhl's Hebrew read like "David"); sans for the UI.
// One family that has both Hebrew and Latin: this Next's font loader ships
// every subset of a font, so a Latin-only face can't hand Hebrew to another.
const miriam = Miriam_Libre({
  variable: "--font-miriam",
  subsets: ["hebrew", "latin"],
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
      className={`${miriam.variable} ${plex.variable} h-full antialiased`}
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
