import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://amirdamshekan.com"),
  title: {
    default: "Amir Damshekan | Civil Engineer",
    template: "%s | Amir Damshekan",
  },
  description:
    "Civil engineering across structural, marine, construction, project management and surveying, with engineering software and practical technical education.",
  keywords: [
    "Civil Engineer",
    "Structural Engineering",
    "Marine Engineering",
    "Construction",
    "Project Management",
    "Surveying",
    "Engineering Software",
    "Vancouver",
  ],
  openGraph: {
    title: "Amir Damshekan | Civil Engineer",
    description:
      "Engineering from design to delivery — structural, marine, construction, project management, surveying, software and technical education.",
    url: "https://amirdamshekan.com",
    siteName: "Amir Damshekan",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08706f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
