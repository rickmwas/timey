"use client";

import { useState, useEffect } from "react";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  Bell,
  BellRing,
  Volume2,
  Clock,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Sparkles,
} from "lucide-react";
import {
  isPushNotificationSupported,
  getCurrentPushSubscription,
  subscribeToWebPush,
  unsubscribeFromWebPush,
} from "../../lib/push-client";
import { playVenueChangeChime, unlockAudioContext } from "../../lib/audio-chime";
import { useAuth } from "../../contexts/AuthContext";

export function NotificationSettings() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Preference switches (stored in localStorage)
  const [remind30m, setRemind30m] = useState<boolean>(true);
  const [remind10m, setRemind10m] = useState<boolean>(true);
  const [testChimePlaying, setTestChimePlaying] = useState<boolean>(false);

  useEffect(() => {
    const supported = isPushNotificationSupported();
    setIsSupported(supported);

    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }

    if (typeof window !== "undefined") {
      const stored30 = localStorage.getItem("timy_reminder_30m");
      if (stored30 !== null) setRemind30m(stored30 === "true");

      const stored10 = localStorage.getItem("timy_reminder_10m");
      if (stored10 !== null) setRemind10m(stored10 === "true");
    }

    // Check existing subscription
    getCurrentPushSubscription().then((sub) => {
      setIsSubscribed(Boolean(sub));
    });
  }, []);

  const handleTogglePush = async () => {
    setIsLoading(true);
    setStatusMessage(null);

    if (isSubscribed) {
      const res = await unsubscribeFromWebPush();
      if (res.success) {
        setIsSubscribed(false);
        setStatusMessage("Push notifications disabled on this device.");
      } else {
        setStatusMessage(res.error || "Failed to unsubscribe.");
      }
    } else {
      const res = await subscribeToWebPush();
      if (typeof window !== "undefined" && "Notification" in window) {
        setPermission(Notification.permission);
      }
      if (res.success) {
        setIsSubscribed(true);
        setStatusMessage("Successfully enrolled for lockscreen push notifications!");
      } else {
        setStatusMessage(res.error || "Failed to subscribe to push alerts.");
      }
    }
    setIsLoading(false);
  };

  const handleToggle30m = () => {
    const newVal = !remind30m;
    setRemind30m(newVal);
    localStorage.setItem("timy_reminder_30m", String(newVal));
  };

  const handleToggle10m = () => {
    const newVal = !remind10m;
    setRemind10m(newVal);
    localStorage.setItem("timy_reminder_10m", String(newVal));
  };

  const handleTestRinger = () => {
    unlockAudioContext();
    setTestChimePlaying(true);
    playVenueChangeChime();
    setTimeout(() => setTestChimePlaying(false), 1500);
  };

  return (
    <Layout breadcrumb={[{ label: "Settings" }, { label: "Notifications & Alerts" }]}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl text-slate-900 tracking-tight">Notification Settings</h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure real-time class chimes, lockscreen Web Push, and automated countdown alerts.
          </p>
        </div>

        {statusMessage && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 text-sm rounded-xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Lockscreen Web Push Notifications */}
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <BellRing size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Lockscreen Web Push</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Delivers real-time notifications even when your phone screen is off or the browser is in the background. Uses W3C Push API and VAPID.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isSubscribed
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSubscribed ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    {isSubscribed ? "Subscribed on this device" : "Inactive"}
                  </span>
                  {permission === "denied" && (
                    <span className="text-xs text-rose-600 flex items-center gap-1">
                      <AlertCircle size={12} /> Blocked in browser settings
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant={isSubscribed ? "outline" : "primary"}
              size="sm"
              disabled={isLoading || !isSupported}
              onClick={handleTogglePush}
              className="shrink-0"
            >
              {isLoading
                ? "Connecting..."
                : isSubscribed
                ? "Disable"
                : "Enable Push"}
            </Button>
          </div>
        </Card>

        {/* Automated Class Countdown Reminders */}
        <Card className="p-5">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-1">
            <Clock size={18} className="text-blue-600" />
            Class Countdown Alarms
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Receive automated background alerts prior to upcoming lectures in your enrolled cohort.
          </p>

          <div className="divide-y divide-slate-100">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">30 Minutes Before Class</p>
                <p className="text-xs text-slate-500">Early reminder to prepare materials and head to lecture hall</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={remind30m}
                onClick={handleToggle30m}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                  remind30m ? "bg-blue-600 justify-end" : "bg-slate-200 justify-start"
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
              </button>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">10 Minutes Before Class (Urgent)</p>
                <p className="text-xs text-slate-500">Urgent chime & buzzer to ensure you are seated on time</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={remind10m}
                onClick={handleToggle10m}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                  remind10m ? "bg-blue-600 justify-end" : "bg-slate-200 justify-start"
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
              </button>
            </div>
          </div>
        </Card>

        {/* Audio Ringing & Haptics Test */}
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Volume2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Sound & Haptics</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Synthesized two-tone electronic campus chime (F5 698.46Hz &rarr; A5 880Hz) with 200ms tactile device vibration.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestRinger}
              className={`shrink-0 ${testChimePlaying ? "border-amber-500 text-amber-600 bg-amber-50" : ""}`}
            >
              {testChimePlaying ? "Ringing..." : "Test Chime"}
            </Button>
          </div>
        </Card>

        {/* System & PWA Status */}
        <Card className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/30 border-dashed">
          <div className="flex items-center gap-3">
            <Smartphone size={20} className="text-slate-600" />
            <div>
              <p className="text-xs font-semibold text-slate-800">Progressive Web App Architecture</p>
              <p className="text-[11px] text-slate-500">
                Timy runs fully offline using Service Worker cache storage and synchronizes updates with Kisii University servers in East Africa Time (UTC+3).
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
