import type { Metadata } from "next";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
