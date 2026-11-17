"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  playVenueChangeChime,
  triggerSystemNotification,
  unlockAudioContext,
} from "../lib/audio-chime";

export interface RealtimeEventPayload {
  type: string;
  courseCode?: string;
  courseTitle?: string;
  oldVenue?: string;
  newVenue?: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  message?: string;
  timestamp?: string;
}

export function useRealtimeNotifications(onEventReceived?: () => void) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEventPayload | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const enableAudioAndAlerts = useCallback(async () => {
    // 1. Unlock Web Audio
    const audioOk = unlockAudioContext();
    setIsAudioUnlocked(audioOk);

    // 2. Request Notification Permission
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    }
    return audioOk;
  }, []);

  const handleIncomingAlert = useCallback(
    (data: RealtimeEventPayload) => {
      setLastEvent(data);

      // Play synthesized ascending chime & haptic vibration
      playVenueChangeChime();

      // Trigger native lockscreen / system notification
      const alertTitle = data.courseCode
        ? `Timy Alert: ${data.courseCode} ${data.type.toLowerCase()}`
        : "Timy: Schedule Update";
      const alertBody =
        data.message ||
        `Class venue changed to ${data.newVenue || "updated room"} on ${data.day || "scheduled day"}.`;

      triggerSystemNotification(alertTitle, alertBody);

      // Trigger callback (e.g. reload timetable)
      if (onEventReceived) {
        onEventReceived();
      }
    },
    [onEventReceived]
  );

  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    // 1. Service Worker Push Message Bridge (instant relay from Web Push)
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "TIMY_PUSH_NOTIFICATION") {
        handleIncomingAlert(event.data.payload);
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    }

    // 2. Revalidate when tab becomes visible or receives focus
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        onEventReceived?.();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);
    window.addEventListener("online", handleVisibilityOrFocus);

    // 3. Lightweight Fallback Sync (every 15s when active)
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        onEventReceived?.();
      }
    }, 15000);

    // 4. Server-Sent Events (SSE) Stream
    const params = new URLSearchParams();
    if (user.cohortId) params.append("cohortId", user.cohortId);
    if (user.id) params.append("userId", user.id);

    const sseUrl = `/api/v1/notifications/stream?${params.toString()}`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
    };

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "CONNECTED") {
          return;
        }
        handleIncomingAlert(data);
      } catch (err) {
        console.warn("[SSE] Parse message warning:", err);
      }
    };

    es.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setIsConnected(false);

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      }
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      window.removeEventListener("online", handleVisibilityOrFocus);
      clearInterval(pollInterval);
    };
  }, [user, handleIncomingAlert, onEventReceived]);

  return {
    isConnected,
    isAudioUnlocked,
    lastEvent,
    enableAudioAndAlerts,
    simulateAlert: handleIncomingAlert,
  };
}
