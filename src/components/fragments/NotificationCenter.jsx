/**
 * NotificationCenter - shows game notifications
 */
import React from 'react';
import useUIStore from '@stores/useUIStore';

export default function NotificationCenter() {
  const notifications = useUIStore(s => s.notifications);
  const removeNotification = useUIStore(s => s.removeNotification);
  
  if (notifications.length === 0) return null;
  
  return (
    <div id="notification-center">
      {notifications.slice(0, 5).map(n => (
        <div
          key={n.id}
          className={`notification ${n.type || ''}`}
          onClick={() => removeNotification(n.id)}
        >
          <div className="head">{n.title || 'Notification'}</div>
          <div className="body">{n.body || ''}</div>
        </div>
      ))}
    </div>
  );
}
