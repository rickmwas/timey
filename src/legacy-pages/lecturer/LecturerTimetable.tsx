"use client";

import { useMemo, useState } from "react";
import { Calendar, Clock, MapPin, Users, BookOpen } from "lucide-react";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/ui/Card";
import { TimetableCard } from "../../components/timetable/TimetableCard";
import { useAuth } from "../../contexts/AuthContext";
import { TIMETABLE_ENTRIES } from "../../data/mock";
import { DAY_LABELS, getTodayDay } from "../../lib/utils";
import type { Day } from "../../types";

const weekdays: Day[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

export function LecturerTimetable() {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState<Day>(getTodayDay());

  const myEntries = useMemo(
    () =>
      TIMETABLE_ENTRIES.filter(
        (entry) => entry.lecturerId === user?.id
      ).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [user?.id]
  );

  const dayEntries = myEntries.filter(
    (entry) => entry.day === selectedDay
  );

  const totalClasses = myEntries.length;
  const totalCourses = new Set(myEntries.map((entry) => entry.courseId)).size;
  const totalCohorts = new Set(myEntries.map((entry) => entry.cohortId)).size;
  const totalVenues = new Set(myEntries.map((entry) => entry.venueId)).size;

  return (
    <Layout breadcrumb={[{ label: "Teaching Timetable" }]}>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-slate-900">
          Teaching Timetable
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Your assigned classes, venues and teaching schedule
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar size={18} className="text-[#1a2f5c]" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Classes</p>
                <p className="text-xl font-semibold text-slate-900">
                  {totalClasses}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <BookOpen size={18} className="text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Courses</p>
                <p className="text-xl font-semibold text-slate-900">
                  {totalCourses}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Users size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Cohorts</p>
                <p className="text-xl font-semibold text-slate-900">
                  {totalCohorts}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <MapPin size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Venues</p>
                <p className="text-xl font-semibold text-slate-900">
                  {totalVenues}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-[#1a2f5c]" />
          <h2 className="text-sm font-semibold text-slate-800">
            Select Day
          </h2>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {weekdays.map((day) => {
            const count = myEntries.filter(
              (entry) =>
                entry.day === day && entry.status !== "CANCELLED"
            ).length;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDay === day
                    ? "bg-[#1a2f5c] text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {DAY_LABELS[day].slice(0, 3)}
                {count > 0 && (
                  <span
                    className={`ml-2 text-xs ${
                      selectedDay === day
                        ? "text-blue-100"
                        : "text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-800">
              {DAY_LABELS[selectedDay]} Classes
            </h2>
          </div>

          <div className="space-y-3">
            {dayEntries.length === 0 ? (
              <Card className="text-center py-12">
                <Calendar
                  size={28}
                  className="mx-auto text-slate-300 mb-3"
                />
                <p className="text-sm font-medium text-slate-600">
                  No classes scheduled
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  You have no teaching assignments on{" "}
                  {DAY_LABELS[selectedDay]}.
                </p>
              </Card>
            ) : (
              dayEntries.map((entry) => (
                <TimetableCard
                  key={entry.id}
                  entry={entry}
                />
              ))
            )}
          </div>
        </div>

        <div>
          <Card>
            <h2 className="text-sm font-semibold text-slate-800 mb-4">
              Weekly Overview
            </h2>

            <div className="space-y-3">
              {weekdays.map((day) => {
                const entries = myEntries.filter(
                  (entry) =>
                    entry.day === day &&
                    entry.status !== "CANCELLED"
                );

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedDay === day
                        ? "bg-blue-50 border border-blue-100"
                        : "bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center border border-slate-100">
                      <Calendar
                        size={15}
                        className="text-[#1a2f5c]"
                      />
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {DAY_LABELS[day]}
                      </p>
                      <p className="text-xs text-slate-500">
                        {entries.length === 0
                          ? "No classes"
                          : `${entries.length} ${
                              entries.length === 1
                                ? "class"
                                : "classes"
                            }`}
                      </p>
                    </div>

                    <span className="text-sm font-semibold text-slate-700">
                      {entries.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
