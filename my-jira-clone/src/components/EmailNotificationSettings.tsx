
import { useState, useEffect } from "react";
import { 
  Mail, 
  Bell, 
  BellOff, 
  Save, 
  Check, 
  X,
  AlertCircle,
  Info,
  Settings,
  Send
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../helper/api";
import { ENDPOINTS } from "../constants/endpoints";
interface NotificationPreferences {
  taskStatusChange: boolean;
  taskAssigned: boolean;
  newComment: boolean;
  dueDateReminder: boolean;
  overdueReminder: boolean;
}
interface EmailNotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}
export default function EmailNotificationSettings({ isOpen, onClose }: EmailNotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    const saved = localStorage.getItem('email_notification_preferences');
    return saved ? JSON.parse(saved) : {
      taskStatusChange: true,
      taskAssigned: true,
      newComment: true,
      dueDateReminder: true,
      overdueReminder: true,
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('email_notification_preferences', JSON.stringify(preferences));
      toast.success("Đã lưu cài đặt thông báo");
    } catch (error) {
      toast.error("Không thể lưu cài đặt");
    } finally {
      setIsSaving(false);
    }
  };
  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast.error("Vui lòng nhập email");
      return;
    }
    setIsSendingTest(true);
    try {
      await apiClient.post(ENDPOINTS.EMAIL.SEND_TEST, { email: testEmail });
      toast.success(`Đã gửi email test đến ${testEmail}`);
    } catch (error: any) {
      toast.error(error.message || "Không thể gửi email test");
    } finally {
      setIsSendingTest(false);
    }
  };
  const notificationTypes = [
    {
      key: 'taskStatusChange' as const,
      title: 'Thay đổi trạng thái task',
      description: 'Nhận thông báo khi task được chuyển sang trạng thái mới',
      icon: <Bell className="w-5 h-5" />,
    },
    {
      key: 'taskAssigned' as const,
      title: 'Được giao task mới',
      description: 'Nhận thông báo khi bạn được giao một task mới',
      icon: <Mail className="w-5 h-5" />,
    },
    {
      key: 'newComment' as const,
      title: 'Bình luận mới',
      description: 'Nhận thông báo khi có bình luận mới trên task của bạn',
      icon: <Mail className="w-5 h-5" />,
    },
    {
      key: 'dueDateReminder' as const,
      title: 'Nhắc nhở deadline',
      description: 'Nhận thông báo trước 1 ngày khi task sắp đến hạn',
      icon: <AlertCircle className="w-5 h-5" />,
    },
    {
      key: 'overdueReminder' as const,
      title: 'Task quá hạn',
      description: 'Nhận thông báo hàng ngày về các task đã quá hạn',
      icon: <AlertCircle className="w-5 h-5" />,
    },
  ];
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Cài đặt thông báo Email
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Quản lý các thông báo email bạn muốn nhận
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-6">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Về thông báo Email</p>
              <p>
                Hệ thống sẽ gửi email thông báo đến địa chỉ email của bạn khi có các sự kiện quan trọng. 
                Bạn có thể tùy chỉnh loại thông báo muốn nhận bên dưới.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {notificationTypes.map((type) => (
              <div
                key={type.key}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    preferences[type.key] 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                      : 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                  }`}>
                    {type.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      {type.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {type.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(type.key)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    preferences[type.key] 
                      ? 'bg-blue-600' 
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      preferences[type.key] ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h3 className="font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Send className="w-5 h-5" />
              Gửi email test
            </h3>
            <div className="flex gap-3">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Nhập email để test..."
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendTestEmail}
                disabled={isSendingTest || !testEmail}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingTest ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Gửi test
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <p className="font-medium mb-1">Dành cho Admin</p>
                <p>
                  Để cấu hình SMTP server, vui lòng chỉnh sửa file <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">appsettings.json</code> trên server:
                </p>
                <pre className="mt-2 p-3 bg-amber-100 dark:bg-amber-900/40 rounded text-xs overflow-x-auto">
{`"EmailSettings": {
  "SmtpServer": "smtp.gmail.com",
  "SmtpPort": 587,
  "SmtpUsername": "your-email@gmail.com",
  "SmtpPassword": "your-app-password",
  "FromEmail": "your-email@gmail.com",
  "FromName": "ProjectHub",
  "EnableSsl": true,
  "IsEnabled": true
}`}
                </pre>
                <p className="mt-2">
                  <strong>Lưu ý:</strong> Với Gmail, bạn cần tạo "App Password" trong cài đặt bảo mật tài khoản Google.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Lưu cài đặt
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}