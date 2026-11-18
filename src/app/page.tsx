import { TimyLandingPage } from "@/components/marketing/TimyLandingPage";
import { getAppUrl } from "@/server/config/app-url";

export default function Page() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Timy",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    description:
      "Timy helps students, lecturers, and university administrators manage academic timetables, venue availability, class changes, announcements, and notifications at Kisii University.",
    url: new URL("/", getAppUrl()).toString(),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <TimyLandingPage />
    </>
  );
}
