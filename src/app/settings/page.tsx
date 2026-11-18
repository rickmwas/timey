import { NotificationSettings } from "@/legacy-pages/shared/NotificationSettings";

export const metadata = {
  title: "Settings & Notifications | Timy",
  description: "Configure Web Push notifications, class reminders, and sound settings.",
};

export default function SettingsPage() {
  return <NotificationSettings />;
}
