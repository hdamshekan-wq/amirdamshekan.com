import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://www.amirdamshekan.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Amir Damshekan | Civil Engineer in Vancouver",
    template: "%s | Amir Damshekan",
  },

  description:
    "Civil engineer in Vancouver specializing in structural steel and concrete, marine and waterfront structures, construction supervision, project management, surveying, engineering software and technical education.",

  keywords: [
    "Amir Damshekan",
    "Civil Engineer Vancouver",
    "Civil Engineer BC",
    "Structural Engineering",
    "Steel Structures",
    "Concrete Structures",
    "Marine Engineering",
    "Waterfront Structures",
    "Construction Supervision",
    "Project Management",
    "Surveying",
    "Engineering Software",
    "MarineStruc",
  ],

  authors: [
    {
      name: "Amir Damshekan",
      url: siteUrl,
    },
  ],

  creator: "Amir Damshekan",
  publisher: "Amir Damshekan",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Amir Damshekan | Civil Engineer",
    description:
      "Structural, marine and construction engineering from design through field execution.",
    url: siteUrl,
    siteName: "Amir Damshekan",
    locale: "en_CA",
    type: "website",
    images: [
      {
        url: "/amir-engineer.png",
        alt: "Amir Damshekan - Civil Engineer",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Amir Damshekan | Civil Engineer",
    description:
      "Structural, marine and construction engineering from design through field execution.",
    images: ["/amir-engineer.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08706f",
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Amir Damshekan",
  url: siteUrl,
  image: `${siteUrl}/amir-engineer.png`,
  jobTitle: "Civil Engineer",
  description:
    "Civil engineer working across structural, marine, construction, project management and surveying.",
  email: "mailto:info@amirdamshekan.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Vancouver",
    addressRegion: "BC",
    addressCountry: "CA",
  },
  knowsAbout: [
    "Civil Engineering",
    "Structural Engineering",
    "Steel Structures",
    "Concrete Structures",
    "Marine Structures",
    "Waterfront Structures",
    "Construction",
    "Project Management",
    "Surveying",
    "Engineering Software",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(personSchema),
          }}
        />
      </head>

      <body>{children}</body>
    </html>
  );
}