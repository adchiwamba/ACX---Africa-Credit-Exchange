import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from './utils';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
}

interface NotificationContextType {
  notify: (type: NotificationType, title: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((type: NotificationType, title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, type, title, message }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed top-8 right-8 z-[100] flex flex-col gap-4 max-w-md w-full">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className={cn(
                "p-6 rounded-[32px] shadow-2xl border-2 flex items-start gap-4 transition-all bg-white dark:bg-[#1E293B]",
                notification.type === 'success' ? "border-guava-green/20" :
                notification.type === 'error' ? "border-red-500/20" :
                notification.type === 'warning' ? "border-guava-orange/20" : "border-blue-500/20"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                notification.type === 'success' ? "bg-guava-green/10 text-guava-green" :
                notification.type === 'error' ? "bg-red-500/10 text-red-500" :
                notification.type === 'warning' ? "bg-guava-orange/10 text-guava-orange" : "bg-blue-500/10 text-blue-500"
              )}>
                {notification.type === 'success' && <CheckCircle className="w-6 h-6" />}
                {notification.type === 'error' && <AlertCircle className="w-6 h-6" />}
                {notification.type === 'warning' && <AlertCircle className="w-6 h-6" />}
                {notification.type === 'info' && <Info className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-guava-dark dark:text-white truncate">{notification.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{notification.message}</p>
              </div>
              <button 
                onClick={() => removeNotification(notification.id)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotify must be used within a NotificationProvider');
  }
  return context;
}
