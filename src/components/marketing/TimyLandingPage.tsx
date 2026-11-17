import {
  ArrowDown,
  ArrowRight,
  Bell,
  BookOpen,
  Building2,
  Check,
  Users,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { LandingNavigation } from "./LandingNavigation";
import { LandingPhoto } from "./LandingPhoto";
import {
  AnnouncementsDemo,
  LecturerTimetableDemo,
  ScheduleChangeDemo,
  StudentTimetableDemo,
  TimetableOperationsDemo,
  VenueAvailabilityDemo,
} from "./ProductDemonstrations";

const photos = {
  campus: {
    src: "/images/landing/campus.jpg",
    alt: "Aerial view of a university campus in Kenya",
  },
  lectureHall: {
    src: "/images/landing/lecture-hall.jpg",
    alt: "Students seated in a university lecture hall",
  },
  classroom: {
    src: "/images/landing/classroom.jpg",
    alt: "A lecturer teaching a group of students in a university classroom",
  },
};

const photoCredits = [
  {
    creator: "Strathmore University Kenya",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Strathmore_University_Keri_Campus.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  {
    creator: "Uthusitse",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:University_of_Limpopo_Lecture_Hall.jpg",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  },
  {
    creator: "Harrison Keely",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Professor_teaching_students_in_a_Tennessee_university_classroom.jpg",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  },
];

function SectionEyebrow({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <p
      className={`text-xs font-bold uppercase tracking-widest ${
        tone === "dark" ? "text-blue-200" : "text-navy-600"
      }`}
    >
      {children}
    </p>
  );
}

function SectionAnchor({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex min-h-11 items-center gap-2 rounded-full font-semibold text-navy-800 transition-colors hover:text-navy-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-500"
    >
      {children}
      <ArrowRight aria-hidden="true" size={16} />
    </a>
  );
}

export function TimyLandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-md bg-white px-4 py-3 font-semibold text-navy-900 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-500"
      >
        Skip to content
      </a>
      <LandingNavigation />

      <main id="main-content">
        <section
          aria-labelledby="hero-title"
          className="overflow-hidden bg-navy-950 text-white"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <h1
                id="hero-title"
                className="font-display text-5xl leading-none tracking-tight sm:text-6xl lg:text-7xl"
              >
                A clearer view
                <br />
                of every class.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100 sm:text-xl">
                Timy brings academic timetables, venue coordination, class
                changes, announcements, and notifications together for Kisii
                University.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-navy-950 transition-colors hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  Explore how it works
                  <ArrowDown aria-hidden="true" size={17} />
                </a>
                <Link
                  href="/login"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 px-6 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  Sign In
                </Link>
              </div>
              <p className="mt-5 text-sm text-blue-200">
                Built for students, lecturers, and university administrators.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-2xl lg:mx-0">
              <LandingPhoto
                {...photos.campus}
                sizes="(max-width: 1023px) 100vw, 55vw"
                priority
                frameClassName="aspect-video shadow-2xl shadow-black/25"
                imageClassName="object-cover object-center"
              />
              <div
                role="img"
                aria-label="Illustrative Timy class update preview using generic sample information"
                className="absolute -bottom-5 left-4 hidden max-w-xs rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl sm:block lg:-left-8"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy-50 text-navy-900">
                    <Bell aria-hidden="true" size={18} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-navy-600">
                      Illustrative product view
                    </p>
                    <p className="mt-1 text-sm font-bold">Class update</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Check the latest timetable details for Course A.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="overview"
          tabIndex={-1}
          aria-labelledby="overview-title"
          className="scroll-mt-24 bg-white"
        >
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-8 lg:py-28">
            <div>
              <SectionEyebrow>The Timy system</SectionEyebrow>
              <h2
                id="overview-title"
                className="mt-4 max-w-xl font-display text-4xl leading-tight text-navy-950 sm:text-5xl"
              >
                One academic day. Many people who need the same answer.
              </h2>
            </div>
            <div className="max-w-2xl">
              <p className="text-lg leading-8 text-slate-600">
                From timetable setup and venue checks to class updates and
                student notifications, Timy gives each university role a
                dedicated way to work with the academic schedule.
              </p>
              <div className="mt-8 grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-3">
                <div>
                  <Users
                    aria-hidden="true"
                    className="text-navy-600"
                    size={21}
                  />
                  <h3 className="mt-3 font-semibold text-navy-950">Students</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Find class times, venues, and schedule updates.
                  </p>
                </div>
                <div>
                  <BookOpen
                    aria-hidden="true"
                    className="text-navy-600"
                    size={21}
                  />
                  <h3 className="mt-3 font-semibold text-navy-950">
                    Lecturers
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Review teaching schedules and share class changes.
                  </p>
                </div>
                <div>
                  <Building2
                    aria-hidden="true"
                    className="text-navy-600"
                    size={21}
                  />
                  <h3 className="mt-3 font-semibold text-navy-950">
                    Administrators
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Coordinate timetable information and university venues.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          tabIndex={-1}
          aria-labelledby="features-title"
          className="scroll-mt-24 bg-slate-50"
        >
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="max-w-3xl">
              <SectionEyebrow>What Timy helps you do</SectionEyebrow>
              <h2
                id="features-title"
                className="mt-4 font-display text-4xl leading-tight text-navy-950 sm:text-5xl"
              >
                A better connected academic schedule.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Each view is shaped around the people who use it, while
                timetable and venue information stays connected across the
                system.
              </p>
            </div>

            <section
              id="timetable-operations"
              tabIndex={-1}
              aria-labelledby="timetable-operations-title"
              className="scroll-mt-24 grid gap-10 border-t border-slate-200 py-14 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16"
            >
              <div className="max-w-xl">
                <SectionEyebrow>For administrators</SectionEyebrow>
                <h3
                  id="timetable-operations-title"
                  className="mt-4 font-display text-3xl leading-tight text-navy-950 sm:text-4xl"
                >
                  Manage schedules with a clearer process.
                </h3>
                <p className="mt-5 leading-7 text-slate-600">
                  Timy supports timetable administration, including schedule
                  import, preview, validation, and publishing. Administrators
                  can also coordinate venue information and review scheduling
                  conflicts in the same system.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  <li className="flex gap-3">
                    <Check
                      aria-hidden="true"
                      size={18}
                      className="mt-0.5 shrink-0 text-navy-600"
                    />
                    Review timetable information in one system.
                  </li>
                  <li className="flex gap-3">
                    <Check
                      aria-hidden="true"
                      size={18}
                      className="mt-0.5 shrink-0 text-navy-600"
                    />
                    Coordinate rooms and scheduling constraints.
                  </li>
                  <li className="flex gap-3">
                    <Check
                      aria-hidden="true"
                      size={18}
                      className="mt-0.5 shrink-0 text-navy-600"
                    />
                    Keep students and lecturers informed when schedules change.
                  </li>
                </ul>
              </div>
              <TimetableOperationsDemo />
            </section>

            <section
              id="venue-availability"
              tabIndex={-1}
              aria-labelledby="venues-title"
              className="scroll-mt-24 grid gap-10 border-t border-slate-200 py-14 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16"
            >
              <VenueAvailabilityDemo />
              <div className="max-w-xl lg:pl-4">
                <SectionEyebrow>Venues and conflicts</SectionEyebrow>
                <h3
                  id="venues-title"
                  className="mt-4 font-display text-3xl leading-tight text-navy-950 sm:text-4xl"
                >
                  Make room for a class without overlooking a conflict.
                </h3>
                <p className="mt-5 leading-7 text-slate-600">
                  Timy checks scheduling constraints such as venue, lecturer,
                  cohort, and capacity. Its authenticated scheduling service
                  also supports venue availability checks for a requested
                  class slot.
                </p>
                <p className="mt-4 leading-7 text-slate-600">
                  The illustration shows how the service evaluates a request.
                  It is not a screenshot of a portal control.
                </p>
                <div className="mt-6">
                  <SectionAnchor href="#how-it-works">
                    See how scheduling fits together
                  </SectionAnchor>
                </div>
              </div>
            </section>

            <section
              id="schedule-changes"
              tabIndex={-1}
              aria-labelledby="class-changes-title"
              className="scroll-mt-24 grid gap-10 border-t border-slate-200 py-14 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16"
            >
              <div className="max-w-xl">
                <SectionEyebrow>Class changes</SectionEyebrow>
                <h3
                  id="class-changes-title"
                  className="mt-4 font-display text-3xl leading-tight text-navy-950 sm:text-4xl"
                >
                  When plans change, make the next step clear.
                </h3>
                <p className="mt-5 leading-7 text-slate-600">
                  Classes can be cancelled or rescheduled, and Timy supports
                  sharing timetable changes with the people affected. The
                  scheduling API also supports postponement requests.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-slate-500">
                  Postponement is represented as an API capability, not as a
                  portal control.
                </p>
              </div>
              <ScheduleChangeDemo />
            </section>

            <section
              id="student-timetable"
              tabIndex={-1}
              aria-labelledby="student-title"
              className="scroll-mt-24 grid gap-10 border-t border-slate-200 py-14 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16"
            >
              <StudentTimetableDemo />
              <div className="max-w-xl lg:pl-4">
                <SectionEyebrow>For students</SectionEyebrow>
                <h3
                  id="student-title"
                  className="mt-4 font-display text-3xl leading-tight text-navy-950 sm:text-4xl"
                >
                  Know where your next class is.
                </h3>
                <p className="mt-5 leading-7 text-slate-600">
                  Students can check their timetable and class information,
                  including scheduled time and venue. When a class changes,
                  timetable updates and notifications help students follow the
                  latest information.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-sm">
                  {["Class time", "Venue", "Schedule updates"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section
              id="lecturer-timetable"
              tabIndex={-1}
              aria-labelledby="lecturer-title"
              className="scroll-mt-24 grid gap-10 border-t border-slate-200 py-14 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16"
            >
              <div className="space-y-7">
                <div className="max-w-xl">
                  <SectionEyebrow>For lecturers</SectionEyebrow>
                  <h3
                    id="lecturer-title"
                    className="mt-4 font-display text-3xl leading-tight text-navy-950 sm:text-4xl"
                  >
                    A practical view of the teaching week.
                  </h3>
                  <p className="mt-5 leading-7 text-slate-600">
                    Lecturers can review assigned classes and teaching
                    schedules, then share class updates through the available
                    system workflows.
                  </p>
                </div>
                <LandingPhoto
                  {...photos.classroom}
                  sizes="(max-width: 1023px) 100vw, 45vw"
                  frameClassName="aspect-[4/3]"
                />
              </div>
              <LecturerTimetableDemo />
            </section>

            <section
              id="announcements-notifications"
              tabIndex={-1}
              aria-labelledby="announcements-title"
              className="scroll-mt-24 grid gap-10 border-t border-slate-200 py-14 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16"
            >
              <AnnouncementsDemo />
              <div className="max-w-xl lg:pl-4">
                <SectionEyebrow>Announcements and notifications</SectionEyebrow>
                <h3
                  id="announcements-title"
                  className="mt-4 font-display text-3xl leading-tight text-navy-950 sm:text-4xl"
                >
                  Important academic updates, in context.
                </h3>
                <p className="mt-5 leading-7 text-slate-600">
                  Administrators can share academic announcements, while
                  timetable notifications help users keep up with relevant
                  class changes. Students and lecturers can check the details
                  that affect their schedule.
                </p>
                <p className="mt-4 leading-7 text-slate-600">
                  These examples use generic sample messages, not live
                  university announcements.
                </p>
              </div>
            </section>
          </div>
        </section>

        <section
          id="how-it-works"
          tabIndex={-1}
          aria-labelledby="how-title"
          className="scroll-mt-24 bg-white"
        >
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <div>
                <SectionEyebrow>How Timy works</SectionEyebrow>
                <h2
                  id="how-title"
                  className="mt-4 font-display text-4xl leading-tight text-navy-950 sm:text-5xl"
                >
                  From schedule planning to class time.
                </h2>
                <p className="mt-5 max-w-lg leading-7 text-slate-600">
                  Timy connects the people who coordinate an academic
                  timetable with the people who need to use it.
                </p>
                <div className="mt-7">
                  <LandingPhoto
                    {...photos.lectureHall}
                    sizes="(max-width: 1023px) 100vw, 38vw"
                    frameClassName="aspect-[4/3]"
                  />
                </div>
              </div>
              <ol className="divide-y divide-slate-200 border-y border-slate-200">
                {[
                  {
                    number: "01",
                    title: "Administrators organize",
                    description:
                      "Timetable and venue information is managed through the administrative system.",
                  },
                  {
                    number: "02",
                    title: "Scheduling constraints are checked",
                    description:
                      "Timy supports conflict checks and venue availability checks for class scheduling.",
                  },
                  {
                    number: "03",
                    title: "Students and lecturers review",
                    description:
                      "Each role can access the timetable information relevant to their academic work.",
                  },
                  {
                    number: "04",
                    title: "Updates are shared",
                    description:
                      "Announcements and class notifications help users follow schedule changes.",
                  },
                ].map((step) => (
                  <li
                    key={step.number}
                    className="grid gap-3 py-6 sm:grid-cols-[3.5rem_1fr] sm:gap-5 sm:py-8"
                  >
                    <span className="font-display text-2xl text-navy-500">
                      {step.number}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-navy-950">
                        {step.title}
                      </h3>
                      <p className="mt-2 max-w-xl leading-7 text-slate-600">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-16 grid gap-8 border-t border-slate-200 pt-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <div>
                <SectionEyebrow>Getting started</SectionEyebrow>
                <h3 className="mt-4 font-display text-3xl leading-tight text-navy-950 sm:text-4xl">
                  Get access through your university.
                </h3>
                <p className="mt-4 max-w-lg leading-7 text-slate-600">
                  Timy uses the university account system. There is no public
                  registration form.
                </p>
              </div>
              <ol className="grid gap-6 sm:grid-cols-3">
                {[
                  {
                    number: "01",
                    title: "Request an account",
                    description:
                      "Contact your university administrator for access.",
                  },
                  {
                    number: "02",
                    title: "Sign in",
                    description:
                      "Use the account details provided by the university.",
                  },
                  {
                    number: "03",
                    title: "Open your portal",
                    description:
                      "Timy takes you to the dashboard for your role.",
                  },
                ].map((step) => (
                  <li key={step.number}>
                    <span className="font-display text-2xl text-navy-500">
                      {step.number}
                    </span>
                    <h4 className="mt-3 font-semibold text-navy-950">
                      {step.title}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {step.description}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="bg-navy-50">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-center lg:px-8 lg:py-20">
            <div>
              <SectionEyebrow>Why Timy</SectionEyebrow>
              <h2 className="mt-4 font-display text-3xl leading-tight text-navy-950 sm:text-4xl">
                Less timetable uncertainty. More time for learning.
              </h2>
            </div>
            <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {[
                "See class time and venue information in one place.",
                "Keep lecturer schedules connected to class planning.",
                "Check scheduling conflicts and venue availability.",
                "Share cancellations, rescheduling, and academic updates.",
              ].map((benefit) => (
                <li key={benefit} className="flex gap-3 leading-7 text-slate-700">
                  <Check
                    aria-hidden="true"
                    size={19}
                    className="mt-1 shrink-0 text-navy-600"
                  />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="faqs"
          tabIndex={-1}
          aria-labelledby="faq-title"
          className="scroll-mt-24 bg-white"
        >
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20 lg:px-8 lg:py-28">
            <div>
              <SectionEyebrow>Frequently asked questions</SectionEyebrow>
              <h2
                id="faq-title"
                className="mt-4 font-display text-4xl leading-tight text-navy-950 sm:text-5xl"
              >
                A few helpful details.
              </h2>
            </div>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {[
                {
                  question: "What is Timy?",
                  answer:
                    "Timy is an academic timetable and venue management system that supports communication between students, lecturers, and university administrators.",
                },
                {
                  question: "Who can use Timy?",
                  answer:
                    "Students, lecturers, and administrators sign in through the existing university system and see the tools available for their role.",
                },
                {
                  question: "How do I get an account?",
                  answer:
                    "Accounts are provided by the university. Contact your university administrator or the office responsible for academic timetables to request access.",
                },
                {
                  question: "What can I do in Timy?",
                  answer:
                    "You can view role appropriate timetable information, manage schedules and venues if your role allows it, review schedule conflicts, and follow academic announcements and class updates.",
                },
                {
                  question: "How will I know when a class changes?",
                  answer:
                    "Timy shares schedule updates through its existing notification workflows. Sign in to check the latest timetable details.",
                },
                {
                  question: "Are the examples on this page live?",
                  answer:
                    "No. The examples are illustrative and use generic sample data. Sign in to access the authenticated portal.",
                },
              ].map((item) => (
                <details key={item.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 rounded-sm text-left font-semibold text-navy-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-500">
                    {item.question}
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy-50 text-navy-900 transition-transform motion-reduce:transition-none group-open:rotate-180">
                      <ArrowDown aria-hidden="true" size={15} />
                    </span>
                  </summary>
                  <p className="mt-4 max-w-2xl pr-8 leading-7 text-slate-600">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          id="access"
          aria-labelledby="access-title"
          className="bg-navy-950 text-white"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <SectionEyebrow tone="dark">Ready to use Timy?</SectionEyebrow>
              <h2
                id="access-title"
                className="mt-4 font-display text-4xl leading-tight sm:text-5xl"
              >
                Your academic schedule starts here.
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-blue-100">
                Sign in to continue to the Timy portal. If you need an account,
                ask your university administrator for access.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-navy-950 transition-colors hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Sign In
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 px-6 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-navy-950 pb-8 text-blue-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 border-t border-white/15 px-4 pt-7 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-sm font-display text-xl text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Timy
          </Link>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a
              href="#overview"
              className="rounded-sm hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              About Timy
            </a>
            <a
              href="#features"
              className="rounded-sm hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Features
            </a>
            <Link
              href="/login"
              className="rounded-sm hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-sm hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Sign Up
            </Link>
          </nav>
          <p className="text-sm text-blue-200">
            Academic timetable and venue management for Kisii University
          </p>
        </div>
        <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 text-xs leading-relaxed text-blue-200 sm:flex-row sm:items-start sm:justify-between">
            <p>
              Timy is an academic system for Kisii University. Photography on
              this page is illustrative.
            </p>
            <p>
              Image credits:{" "}
              {photoCredits.map((photo, index) => (
                <span key={photo.creator}>
                  {index > 0 ? " · " : ""}
                  <a
                    href={photo.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:text-white"
                  >
                    {photo.creator}
                  </a>
                  {" ("}
                  <a
                    href={photo.licenseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:text-white"
                  >
                    {photo.license}
                  </a>
                  {")"}
                </span>
              ))}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
