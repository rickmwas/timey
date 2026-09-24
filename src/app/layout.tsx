import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

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
    "Academic Schedule",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        {children}
      </body>
    </html>
  );
}
