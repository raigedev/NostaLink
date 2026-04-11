import { getNotifications } from "@/app/actions/notifications";
import NotificationList from "@/components/notifications/NotificationList";

export default async function NotificationsPage() {
  const notifications = await getNotifications(50);
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔔 Notifications</h1>
      <NotificationList notifications={notifications} />
    </div>
  );
}
