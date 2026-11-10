import Providers from "./providers";
import type { Metadata } from "next";
 import "./globals.css";

export const metadata: Metadata = {
  title: "Timy — Academic Timetable & Venue Management | Kisii University",
  description:
    "Kisii University Academic Timetable and Venue Management System. View conflict-free schedules, check venue availability, and receive instant lecture updates.",
  keywords: [
    "Kisii University",
    "Timetable",
    "Lecture Hall",
    "LH 26",
    "Computing Sciences",
    "Academic Schedule"
  ]
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
