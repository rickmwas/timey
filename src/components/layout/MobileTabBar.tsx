"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Bell, Settings } from "lucide-react";
import { useNotifications } from "../../hooks/use-notifications";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../lib/utils";

export function MobileTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  if (!user) return null;

  const settingsHref = user.role === "ADMIN" ? "/admin/settings" : "/settings";

  const tabs = [
    {
      to: "/dashboard",
      label: "Home",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      to: "/timetable",
      label: "Schedule",
      icon: Calendar,
      isActive: pathname.startsWith("/timetable"),
    },
    {
      to: "/notifications",
      label: "Alerts",
      icon: Bell,
      isActive: pathname.startsWith("/notifications"),
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      to: settingsHref,
      label: "Settings",
      icon: Settings,
      isActive: pathname.startsWith("/settings") || pathname.startsWith("/admin/settings"),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 10px)",
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive;

          return (
            <Link
              key={tab.to}
              href={tab.to}
              className={cn(
                "relative flex flex-col items-center justify-center min-w-[64px] min-h-[48px] py-1 px-3 rounded-2xl transition-all duration-150 active:scale-95 touch-manipulation",
                active
                  ? "text-[#1a2f5c] font-semibold"
                  : "text-slate-600 hover:text-slate-800"
              )}
            >
              <div className="relative">
                <Icon
                  size={20}
                  className={cn(
                    "transition-transform duration-150",
                    active ? "scale-110 stroke-[2.5]" : "stroke-[1.8]"
                  )}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 min-w-[17px] h-[17px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] tracking-tight mt-1 leading-none",
                  active ? "text-[#1a2f5c] font-bold" : "text-slate-600"
                )}
              >
                {tab.label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-8 h-1 bg-[#1a2f5c] rounded-full -mb-1 animate-fade-in" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
