import type { MetadataRoute } from "next";
import { getAppUrl } from "@/server/config/app-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api",
        "/dashboard",
        "/timetable",
        "/import",
        "/conflicts",
        "/rescheduling",
        "/venues",
        "/courses",
        "/cohorts",
        "/departments",
        "/announcements",
        "/notifications",
        "/admin",
        "/login",
        "/signup",
      ],
    },
    sitemap: new URL("/sitemap.xml", getAppUrl()).toString(),
  };
}
