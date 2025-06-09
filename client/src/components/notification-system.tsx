import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import type { NotificationData } from '@shared/schema';

interface NotificationSystemProps {
  notifications: NotificationData[];
  onRemove: (id: string) => void;
}

export function NotificationSystem({ notifications, onRemove }: NotificationSystemProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 space-y-2">
      {notifications.map((notification) => {
        const bgColor = 
          notification.type === 'success' ? 'bg-green-500' :
          notification.type === 'error' ? 'bg-red-500' : 'bg-orange-500';
        
        const Icon = 
          notification.type === 'success' ? CheckCircle :
          notification.type === 'error' ? XCircle : AlertTriangle;

        return (
          <div
            key={notification.id}
            className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 transition-all duration-300 min-w-80`}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium flex-1">{notification.message}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(notification.id)}
              className="text-white hover:text-gray-200 hover:bg-transparent p-1 h-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
