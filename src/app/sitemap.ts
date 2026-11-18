import type { MetadataRoute } from "next";
import { getAppUrl } from "@/server/config/app-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: new URL("/", getAppUrl()).toString(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
