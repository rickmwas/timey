import type { Metadata, Viewport } from "next";
import { getAppUrl } from "@/server/config/app-url";
import Providers from "./providers";
import "./globals.css";

const siteTitle = "Timy | Academic Timetable and Venue Management";
const siteDescription =
  "Timy helps students, lecturers, and university administrators manage academic timetables, venue availability, class changes, announcements, and notifications at Kisii University.";
const socialImage = "/images/landing/timy-social-card.png";
const appUrl = getAppUrl();

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: siteTitle,
    template: "%s | Timy",
  },
  description: siteDescription,
  applicationName: "Timy",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Timy",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: socialImage,
        width: 1200,
        height: 630,
        alt: "Timy academic timetable and venue management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [socialImage],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Timy",
  },
  keywords: [
    "Kisii University",
    "Timetable",
    "Lecture Hall",
    "LH 26",
    "Computing Sciences",
    "Academic Schedule"
  ],
};

export const viewport: Viewport = {
  themeColor: "#1a2f5c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <Providers>{children}</Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg) { console.log('[PWA] Service Worker registered with scope: ', reg.scope); },
                    function(err) { console.warn('[PWA] Service Worker registration failed: ', err); }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
