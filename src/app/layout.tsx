import Providers from "./providers";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Timy — Academic Timetable & Venue Management | Kisii University",
  description:
    "Kisii University Academic Timetable and Venue Management System. View conflict-free schedules, check venue availability, and receive instant lecture updates.",
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
  ]
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
