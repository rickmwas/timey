"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { TimetableEntry } from "../types";
import {
  playThirtyMinReminder,
  playTenMinUrgentReminder,
  triggerSystemNotification,
} from "../lib/audio-chime";

export interface CountdownState {
  nextEntry: TimetableEntry | null;
  minutesUntilStart: number | null;
  hasFired30m: boolean;
  hasFired10m: boolean;
}

export function useClassCountdown(todayEntries: TimetableEntry[]) {
  const [countdown, setCountdown] = useState<CountdownState>({
    nextEntry: null,
    minutesUntilStart: null,
    hasFired30m: false,
    hasFired10m: false,
  });

  const fired30mRef = useRef<Set<string>>(new Set());
  const fired10mRef = useRef<Set<string>>(new Set());

  const checkCountdowns = useCallback(() => {
    if (!todayEntries || todayEntries.length === 0) {
      setCountdown({ nextEntry: null, minutesUntilStart: null, hasFired30m: false, hasFired10m: false });
      return;
    }

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    // Find the closest upcoming class today
    const upcoming = todayEntries
      .filter((e) => e.status !== "CANCELLED")
      .map((e) => {
        const [h, m] = (e.startTime || "08:00").split(":").map(Number);
        const classMins = h * 60 + m;
        return { entry: e, diffMins: classMins - currentMins };
      })
      .filter((item) => item.diffMins > 0)
      .sort((a, b) => a.diffMins - b.diffMins)[0];

    if (!upcoming) {
      setCountdown({ nextEntry: null, minutesUntilStart: null, hasFired30m: false, hasFired10m: false });
      return;
    }

    const { entry, diffMins } = upcoming;
    const entryId = entry.id;

    // Check 30-minute alarm threshold (between 25 and 30 mins)
    if (diffMins <= 30 && diffMins > 25 && !fired30mRef.current.has(entryId)) {
      fired30mRef.current.add(entryId);
      playThirtyMinReminder();
      triggerSystemNotification(
        `Upcoming: ${entry.course.code} in 30 minutes`,
        `Class begins at ${entry.startTime} in ${entry.venue.code} (${entry.venue.building}).`
      );
    }

    // Check 10-minute urgent alarm threshold (between 5 and 10 mins)
    if (diffMins <= 10 && diffMins > 0 && !fired10mRef.current.has(entryId)) {
      fired10mRef.current.add(entryId);
      playTenMinUrgentReminder();
      triggerSystemNotification(
        `🚨 Hurry: ${entry.course.code} in 10 minutes!`,
        `Proceed to ${entry.venue.code} (${entry.venue.building}). Class starts at ${entry.startTime}.`
      );
    }

    setCountdown({
      nextEntry: entry,
      minutesUntilStart: diffMins,
      hasFired30m: fired30mRef.current.has(entryId),
      hasFired10m: fired10mRef.current.has(entryId),
    });
  }, [todayEntries]);

  useEffect(() => {
    checkCountdowns();
    const interval = setInterval(checkCountdowns, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [checkCountdowns]);

  // Demo simulation helpers
  const triggerSimulated30m = useCallback((customEntry?: TimetableEntry) => {
    const target = customEntry || countdown.nextEntry || todayEntries[0];
    playThirtyMinReminder();
    triggerSystemNotification(
      `Upcoming: ${target ? target.course.code : "SOEN 311"} in 30 minutes`,
      `Class begins in 30m at ${target ? target.venue.code : "LH 26"} (${target ? target.venue.building : "Science Complex"}).`
    );
  }, [countdown.nextEntry, todayEntries]);

  const triggerSimulated10m = useCallback((customEntry?: TimetableEntry) => {
    const target = customEntry || countdown.nextEntry || todayEntries[0];
    playTenMinUrgentReminder();
    triggerSystemNotification(
      `🚨 Hurry: ${target ? target.course.code : "SOEN 311"} starts in 10 minutes!`,
      `Proceed immediately to ${target ? target.venue.code : "LH 26"}. Class starting shortly.`
    );
  }, [countdown.nextEntry, todayEntries]);

  return {
    ...countdown,
    triggerSimulated30m,
    triggerSimulated10m,
  };
}
