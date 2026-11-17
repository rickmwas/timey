"use client";

import { useState } from "react";
import {
  Volume2,
  VolumeX,
  Bell,
  Smartphone,
  Radio,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { playVenueChangeChime } from "@/lib/audio-chime";

interface DemoSimulatorToolbarProps {
  isSseConnected: boolean;
  isAudioUnlocked: boolean;
  onEnableAudio: () => Promise<boolean>;
  onSimulate30m: () => void;
  onSimulate10m: () => void;
  onSimulateReschedule: () => void;
}

export function DemoSimulatorToolbar({
  isSseConnected,
  isAudioUnlocked,
  onEnableAudio,
  onSimulate30m,
  onSimulate10m,
  onSimulateReschedule,
}: DemoSimulatorToolbarProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const { isInstallable, isInstalled, installPwa } = usePwaInstall();

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full sm:w-auto">
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200">
        {/* Header / Toggle Pill */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer select-none bg-slate-800/60 hover:bg-slate-800/90"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isSseConnected ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isSseConnected ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
            </span>
            <span className="text-xs font-semibold tracking-wide">
              {isSseConnected ? "Live Phone Stream Active" : "Stream Connecting..."}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <span className="hidden sm:inline">Presentation Demo Tools</span>
            {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </div>
        </div>

        {/* Collapsible Controls */}
        {isExpanded && (
          <div className="p-3.5 space-y-2.5 text-xs">
            {/* Install PWA Prompt (if available) */}
            {isInstallable && !isInstalled && (
              <button
                onClick={installPwa}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-md transition-all active:scale-95"
              >
                <Download size={14} />
                <span>Install Timy as Mobile App (PWA)</span>
              </button>
            )}

            {/* Audio & Notification Unlock Button */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/70 border border-slate-700/50">
              <div className="flex items-center gap-2">
                {isAudioUnlocked ? (
                  <Volume2 size={16} className="text-emerald-400" />
                ) : (
                  <VolumeX size={16} className="text-amber-400" />
                )}
                <div>
                  <p className="font-semibold text-slate-200">
                    {isAudioUnlocked ? "Audio & Chimes Primed" : "Audio Permissions"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isAudioUnlocked ? "Ringing & Lockscreen Push Ready" : "Tap once to enable phone ringing"}
                  </p>
                </div>
              </div>

              {!isAudioUnlocked && (
                <button
                  onClick={onEnableAudio}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow transition-all active:scale-95"
                >
                  Enable Sound
                </button>
              )}
            </div>

            {/* Simulation Action Buttons for Demo Presentation */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider px-0.5">
                Simulate Live Presentation Events:
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onSimulate30m}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium transition-all active:scale-95"
                  title="Simulate 30 minutes before class countdown alarm"
                >
                  <Clock size={13} className="text-blue-400" />
                  <span>30m Warning</span>
                </button>

                <button
                  onClick={onSimulate10m}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-200 font-medium transition-all active:scale-95"
                  title="Simulate urgent 10 minutes to class countdown alert"
                >
                  <Bell size={13} className="text-amber-400" />
                  <span>10m Urgent</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onSimulateReschedule}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-200 font-medium transition-all active:scale-95"
                  title="Simulate immediate venue swap incoming alert"
                >
                  <Sparkles size={13} className="text-emerald-400" />
                  <span>Simulate Swap</span>
                </button>

                <button
                  onClick={() => playVenueChangeChime()}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium transition-all active:scale-95"
                  title="Play Apple/Google ascending notification chord"
                >
                  <Radio size={13} className="text-sky-400" />
                  <span>Test Chime</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
