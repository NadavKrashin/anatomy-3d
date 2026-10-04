import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import { AnatomyDataProvider } from "@/components/providers/AnatomyDataProvider";
import { ProgressProvider } from "@/components/providers/ProgressProvider";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "Anatomy",
  description:
    "Learn the body by exploring it — interactive 3D anatomy for medical students.",
};

export const viewport: Viewport = {
  themeColor: "#0b0d10",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} h-full antialiased`}
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
