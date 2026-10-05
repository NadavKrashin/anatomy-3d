import type { Metadata, Viewport } from "next";
import { Frank_Ruhl_Libre, IBM_Plex_Sans_Hebrew } from "next/font/google";
import { AnatomyDataProvider } from "@/components/providers/AnatomyDataProvider";
import { ProgressProvider } from "@/components/providers/ProgressProvider";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import "./globals.css";

// Serif for structure names and titles (atlas labels), sans for the UI.
const frank = Frank_Ruhl_Libre({
  variable: "--font-frank",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700"],
});

const plex = IBM_Plex_Sans_Hebrew({
  variable: "--font-plex",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Anatomy",
  description:
    "Learn the body by exploring it — interactive 3D anatomy for medical students.",
};

export const viewport: Viewport = {
  themeColor: "#e9edef",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${frank.variable} ${plex.variable} h-full antialiased`}
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
