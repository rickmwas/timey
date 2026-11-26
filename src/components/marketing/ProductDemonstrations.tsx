import {
  ArrowDownRight,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  Clock3,
  FileCheck2,
  MapPin,
  Megaphone,
  Users,
} from "lucide-react";

function ExampleLabel() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-900">
      <span className="size-1.5 rounded-full bg-navy-500" aria-hidden="true" />
      Illustrative view
    </span>
  );
}

function DemoHeader({ title }: { title: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-navy-50 text-navy-900">
          <CalendarDays aria-hidden="true" size={17} />
        </span>
        <span className="font-semibold text-slate-900">{title}</span>
      </div>
      <ExampleLabel />
    </div>
  );
}

export function TimetableOperationsDemo() {
  return (
    <div
      role="img"
      aria-label="Illustrative timetable administration preview showing schedule import, preview, validation, and publishing"
      className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-navy-900/5 sm:p-7"
    >
      <DemoHeader title="Timetable operations" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { step: "01", label: "Import schedule", icon: CalendarDays },
          { step: "02", label: "Preview entries", icon: FileCheck2 },
          { step: "03", label: "Validate conflicts", icon: Check },
          { step: "04", label: "Publish timetable", icon: MapPin },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.step} className="min-w-0">
              <span className="grid size-11 place-items-center rounded-2xl bg-navy-50 text-navy-900">
                <Icon aria-hidden="true" size={19} />
              </span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Step {item.step}
                </span>
                <span className="mt-1 block text-sm font-semibold text-slate-800">
                  {item.label}
                </span>
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-7 rounded-2xl bg-slate-50 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Example schedule
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Sample data, not a live timetable
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            <Check aria-hidden="true" size={14} />
            Reviewed
          </span>
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 border-t border-slate-200 pt-4 text-sm">
          <span className="font-medium text-slate-700">Course A</span>
          <span className="text-right text-slate-500">Room 1</span>
          <span className="font-medium text-slate-700">Course B</span>
          <span className="text-right text-slate-500">Room 2</span>
        </div>
      </div>
    </div>
  );
}

export function VenueAvailabilityDemo() {
  return (
    <div
      role="img"
      aria-label="Illustrative service flow showing a requested class time checked against venue, lecturer, cohort, and capacity constraints"
      className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-navy-900/5 sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-navy-600">
            Service illustration
          </p>
          <h3 className="mt-2 font-display text-2xl text-navy-900">
            One slot, checked from every angle
          </h3>
        </div>
        <span className="rounded-full border border-navy-200 px-3 py-1.5 text-xs font-semibold text-navy-800">
          Authenticated API
        </span>
      </div>
      <div className="mt-7 rounded-2xl bg-navy-950 p-5 text-white sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
          Requested class slot
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium">
          <span className="inline-flex items-center gap-2">
            <Clock3 aria-hidden="true" size={16} />
            Day and time
          </span>
          <span className="inline-flex items-center gap-2">
            <Users aria-hidden="true" size={16} />
            Cohort and lecturer
          </span>
        </div>
        <div className="my-5 flex items-center justify-center text-blue-200">
          <ArrowDownRight aria-hidden="true" size={24} />
        </div>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {["Venue overlap", "Lecturer overlap", "Cohort overlap", "Capacity"].map(
            (check) => (
              <li
                key={check}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5"
              >
                <Check aria-hidden="true" size={15} className="text-blue-200" />
                {check}
              </li>
            ),
          )}
        </ul>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Availability checks are shown as a service flow, not as a current
        portal control.
      </p>
    </div>
  );
}

export function ScheduleChangeDemo() {
  return (
    <div
      role="img"
      aria-label="Illustrative timeline showing a class change moving from a scheduling action to a user update"
      className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-navy-900/5 sm:p-7"
    >
      <DemoHeader title="Class change flow" />
      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
        <div className="rounded-2xl bg-slate-50 p-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Before
          </span>
          <p className="mt-2 font-semibold text-slate-800">Original schedule</p>
          <p className="mt-1 text-sm text-slate-500">Course A · Room 1</p>
        </div>
        <ArrowRight
          aria-hidden="true"
          className="hidden text-navy-400 sm:block"
          size={18}
        />
        <div className="rounded-2xl border border-navy-100 bg-navy-50 p-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-navy-600">
            Action
          </span>
          <p className="mt-2 font-semibold text-navy-900">Schedule update</p>
          <p className="mt-1 text-sm text-navy-800">
            Cancel · reschedule · postpone
          </p>
        </div>
        <ArrowRight
          aria-hidden="true"
          className="hidden text-navy-400 sm:block"
          size={18}
        />
        <div className="rounded-2xl bg-slate-50 p-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            After
          </span>
          <p className="mt-2 font-semibold text-slate-800">Clear next step</p>
          <p className="mt-1 text-sm text-slate-500">Updated class details</p>
        </div>
      </div>
      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
        <Bell aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-navy-700" />
        <p className="text-sm leading-relaxed text-slate-600">
          Existing notification workflows share schedule updates with users.
          Postponement is represented as an authenticated API capability, not a
          portal control.
        </p>
      </div>
    </div>
  );
}

export function StudentTimetableDemo() {
  return (
    <div
      role="img"
      aria-label="Illustrative student timetable with day selection and two sample class entries"
      className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-navy-900/5 sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-navy-600">
            Student view
          </p>
          <h3 className="mt-2 font-display text-2xl text-navy-900">
            My timetable
          </h3>
        </div>
        <ExampleLabel />
      </div>
      <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-100 pb-4 text-xs font-semibold">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
          <span
            key={day}
            className={
              index === 0
                ? "rounded-full bg-navy-900 px-3 py-2 text-white"
                : "rounded-full bg-slate-50 px-3 py-2 text-slate-500"
            }
          >
            {day}
          </span>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {[
          { time: "09:00 to 11:00", course: "Course A", venue: "Lecture Hall 1" },
          { time: "13:00 to 15:00", course: "Course B", venue: "Room 2" },
        ].map((entry) => (
          <div
            key={entry.course}
            className="flex gap-4 rounded-2xl border border-slate-100 p-4"
          >
            <span className="mt-1 h-12 w-1 shrink-0 rounded-full bg-navy-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500">{entry.time}</p>
              <p className="mt-1 font-semibold text-slate-900">{entry.course}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin aria-hidden="true" size={14} />
                {entry.venue}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LecturerTimetableDemo() {
  return (
    <div
      role="img"
      aria-label="Illustrative lecturer timetable with assigned class information and a weekly overview"
      className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-navy-900/5 sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-navy-600">
            Lecturer view
          </p>
          <h3 className="mt-2 font-display text-2xl text-navy-900">
            Teaching timetable
          </h3>
        </div>
        <ExampleLabel />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Selected day
          </p>
          <p className="mt-2 font-semibold text-slate-900">Monday</p>
          <div className="mt-4 divide-y divide-slate-200">
            {["Course A · Room 1", "Course B · Room 2"].map((entry, index) => (
              <div key={entry} className="py-3 first:pt-0 last:pb-0">
                <p className="text-xs text-slate-500">
                  {index === 0 ? "09:00 to 11:00" : "13:00 to 15:00"}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {entry}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-navy-950 p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
            Week at a glance
          </p>
          <div className="mt-4 space-y-3">
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, index) => (
              <div key={day} className="flex items-center gap-3 text-sm">
                <span className="w-8 text-blue-200">{day}</span>
                <span className="h-1.5 flex-1 rounded-full bg-white/10">
                  <span
                    className={`block h-full rounded-full bg-blue-300 ${
                      index % 2 === 0 ? "w-2/3" : "w-1/3"
                    }`}
                  />
                </span>
                <span className="text-xs text-blue-100">
                  {index % 2 === 0 ? "Classes" : "View"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnnouncementsDemo() {
  return (
    <div
      role="img"
      aria-label="Illustrative academic announcement and notification list using generic sample messages"
      className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-navy-900/5 sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-navy-50 text-navy-900">
            <Megaphone aria-hidden="true" size={19} />
          </span>
          <div>
            <p className="font-semibold text-slate-900">Campus updates</p>
            <p className="text-xs text-slate-500">Sample announcements</p>
          </div>
        </div>
        <ExampleLabel />
      </div>
      <div className="mt-5 divide-y divide-slate-100">
        <article className="flex gap-3 py-4 first:pt-0">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-navy-50 text-navy-800">
            <Megaphone aria-hidden="true" size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Academic announcement
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              A course update shared with its selected cohort.
            </p>
          </div>
        </article>
        <article className="flex gap-3 py-4 last:pb-0">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-800">
            <Bell aria-hidden="true" size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Timetable notification
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Check your timetable for the latest class information.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
