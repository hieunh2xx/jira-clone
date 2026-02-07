import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { NOTIFICATION_API, type NotificationDto } from "../service/notification";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const [notificationsRes, countRes] = await Promise.all([
        NOTIFICATION_API.getNotifications(undefined, 20),
        NOTIFICATION_API.getUnreadCount(),
      ]);
      // apiClient đã extract data từ response, nên notificationsRes là NotificationDto[] trực tiếp
      setNotifications(Array.isArray(notificationsRes) ? notificationsRes : []);
      // countRes cũng đã được extract, nên là { count: number }
      setUnreadCount(countRes?.count || 0);
    } catch (error: any) {
      console.error("Error loading notifications:", error);
      toast.error("Không thể tải thông báo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current && 
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setPanelPosition({
        top: buttonRect.bottom + 8,
        left: buttonRect.right + 8
      });
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await NOTIFICATION_API.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      toast.error("Không thể đánh dấu đã đọc");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NOTIFICATION_API.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("Đã đánh dấu tất cả đã đọc");
    } catch (error: any) {
      toast.error("Không thể đánh dấu tất cả đã đọc");
    }
  };

  const handleDelete = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await NOTIFICATION_API.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      const deleted = notifications.find((n) => n.id === id);
      if (deleted && !deleted.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      toast.error("Không thể xóa thông báo");
    }
  };

  const handleNotificationClick = async (notification: NotificationDto) => {
    // Đánh dấu đã đọc nếu chưa đọc
    if (!notification.isRead) {
      try {
        await NOTIFICATION_API.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error: any) {
        console.error("Error marking as read:", error);
      }
    }

    // Đóng panel
    setIsOpen(false);

    // Điều hướng dựa trên type và các ID
    if (notification.type === "task_comment" && notification.taskId && notification.projectId) {
      // Điều hướng đến task detail
      navigate(`/board/${notification.projectId}/task/${notification.taskId}`);
    } else if (
      notification.type === "project_evaluation" &&
      notification.projectId &&
      notification.evaluationId
    ) {
      // Điều hướng đến trang đánh giá project
      navigate(`/projects/${notification.projectId}/evaluation`);
    } else if (notification.projectId) {
      // Điều hướng đến board của project
      navigate(`/board`, { state: { selectedProjectId: notification.projectId } });
    } else {
      // Nếu không có projectId, điều hướng đến board chính
      navigate(`/board`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "project_change":
      case "project_updated":
      case "project_completed":
      case "project_reopened":
      case "project_member_added":
      case "project_member_removed":
        return "📁";
      case "task_comment":
        return "💬";
      case "project_evaluation":
        return "⭐";
      default:
        return "🔔";
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
      });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <div className="relative z-50" ref={panelRef}>
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Thông báo"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {isOpen && (
        <div 
          className="fixed w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-[100] max-h-[600px] flex flex-col"
          style={{ 
            top: `${panelPosition.top}px`,
            left: `${panelPosition.left}px`
          }}
          ref={panelRef}
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Thông báo
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                Đang tải...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                Không có thông báo
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${
                      !notification.isRead
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-500 dark:text-slate-500">
                            {formatTime(notification.createdAt)}
                          </span>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {!notification.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                title="Đánh dấu đã đọc"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDelete(notification.id, e)}
                              className="p-1 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Xóa"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
