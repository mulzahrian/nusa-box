import { useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';

function Toast({ item }) {
  const removeNotification = useUIStore((state) => state.removeNotification);

  useEffect(() => {
    const timer = window.setTimeout(() => removeNotification(item.id), 3000);
    return () => window.clearTimeout(timer);
  }, [item.id, removeNotification]);

  return (
    <article className="notification-toast" data-tone={item.tone || item.type}>
      <strong className="notification-toast__title">{item.title || 'NOTIFIKASI'}</strong>
      <span className="notification-toast__body">{item.message}</span>
    </article>
  );
}

export default function Notification() {
  const notifications = useUIStore((state) => state.notifications);

  if (!notifications.length) {
    return null;
  }

  return (
    <div className="notification-stack">
      {notifications.map((item) => (
        <Toast key={item.id} item={item} />
      ))}
    </div>
  );
}
