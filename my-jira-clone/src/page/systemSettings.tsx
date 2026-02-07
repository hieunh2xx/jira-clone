import { useState } from "react"
import { Settings, Mail, Database, Shield, Save, RotateCcw, Copy, Check, AlertCircle, Info, Menu } from "lucide-react"
import Sidebar from "../components/Sidebar"
import { useSidebar } from "../hooks/useSidebar"
import type { Project } from "../interface/types"
import { toast } from "sonner"
interface SystemSettings {
  emailSmtpServer: string
  emailSmtpPort: number
  emailFrom: string
  emailFromName: string
  emailEnableSsl: boolean
  emailIsEnabled: boolean
  databaseServer: string
  databaseName: string
  logLevel: string
}
const DEFAULT_SETTINGS: SystemSettings = {
  emailSmtpServer: "smtp.gmail.com",
  emailSmtpPort: 587,
  emailFrom: "hieunguyenhuy2001@gmail.com",
  emailFromName: "ProjectHub",
  emailEnableSsl: true,
  emailIsEnabled: true,
  databaseServer: "KVDOF0500",
  databaseName: "project_management_db",
  logLevel: "Information"
}
export default function SystemSettingsPage() {
  const [sidebarProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<number>(0)
  const { isOpen, toggleSidebar } = useSidebar()
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS)
  const [originalSettings, setOriginalSettings] = useState<SystemSettings>(DEFAULT_SETTINGS)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState<'email' | 'database' | 'security' | 'general'>('general')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }
  const handleSave = () => {
    toast.success("Cài đặt đã được lưu thành công!")
    setOriginalSettings(settings)
    setHasChanges(false)
  }
  const handleReset = () => {
    if (confirm("Bạn có chắc chắn muốn hủy những thay đổi?")) {
      setSettings(originalSettings)
      setHasChanges(false)
      toast.info("Đã hủy những thay đổi")
    }
  }
  const handleCopyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success("Đã sao chép!")
    setTimeout(() => setCopiedField(null), 2000)
  }
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar
        projects={sidebarProjects}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        disableNavigation={true}
        isOpen={isOpen}
        onToggleSidebar={toggleSidebar}
      />
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {!isOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute top-4 left-4 z-40 p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
            title="Hiện sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cài đặt hệ thống</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Quản lý cấu hình và cài đặt của hệ thống ProjectHub
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                disabled={!hasChanges}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4" />
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Lưu cài đặt
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-8">
          <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
            {[
              { id: 'general' as const, label: 'Chung', icon: Settings },
              { id: 'email' as const, label: 'Email', icon: Mail },
              { id: 'database' as const, label: 'Cơ sở dữ liệu', icon: Database },
              { id: 'security' as const, label: 'Bảo mật', icon: Shield },
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
          <div className="max-w-4xl">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-500" />
                    Thông tin hệ thống
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Tên ứng dụng</p>
                      <p className="text-lg font-medium text-slate-900 dark:text-white">ProjectHub</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Phiên bản</p>
                      <p className="text-lg font-medium text-slate-900 dark:text-white">1.0.0</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Môi trường</p>
                      <p className="text-lg font-medium text-slate-900 dark:text-white">Production</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Cấp độ Log</p>
                      <select
                        value={settings.logLevel}
                        onChange={(e) => handleSettingChange('logLevel', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="Debug">Debug</option>
                        <option value="Information">Information</option>
                        <option value="Warning">Warning</option>
                        <option value="Error">Error</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-500" />
                      Cài đặt Email SMTP
                    </h2>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.emailIsEnabled}
                        onChange={(e) => handleSettingChange('emailIsEnabled', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {settings.emailIsEnabled ? 'Bật' : 'Tắt'}
                      </span>
                    </label>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                        Máy chủ SMTP
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={settings.emailSmtpServer}
                          onChange={(e) => handleSettingChange('emailSmtpServer', e.target.value)}
                          className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <button
                          onClick={() => handleCopyToClipboard(settings.emailSmtpServer, 'smtp')}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          {copiedField === 'smtp' ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                          Cổng
                        </label>
                        <input
                          type="number"
                          value={settings.emailSmtpPort}
                          onChange={(e) => handleSettingChange('emailSmtpPort', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.emailEnableSsl}
                            onChange={(e) => handleSettingChange('emailEnableSsl', e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-medium text-slate-900 dark:text-white">Bật SSL/TLS</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                        Email gửi
                      </label>
                      <input
                        type="email"
                        value={settings.emailFrom}
                        onChange={(e) => handleSettingChange('emailFrom', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                        Tên hiển thị
                      </label>
                      <input
                        type="text"
                        value={settings.emailFromName}
                        onChange={(e) => handleSettingChange('emailFromName', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-900 dark:text-blue-300 flex gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Lưu ý:</strong> Hãy kiểm tra email và credentials trước khi lưu. Bạn có thể test cấu hình này tại mục "Thông báo Email" trong sidebar.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'database' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-500" />
                    Cài đặt Cơ sở dữ liệu
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                        Máy chủ cơ sở dữ liệu
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={settings.databaseServer}
                          onChange={(e) => handleSettingChange('databaseServer', e.target.value)}
                          className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          disabled
                        />
                        <button
                          onClick={() => handleCopyToClipboard(settings.databaseServer, 'db-server')}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          {copiedField === 'db-server' ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                        Tên cơ sở dữ liệu
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={settings.databaseName}
                          onChange={(e) => handleSettingChange('databaseName', e.target.value)}
                          className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          disabled
                        />
                        <button
                          onClick={() => handleCopyToClipboard(settings.databaseName, 'db-name')}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          {copiedField === 'db-name' ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-900 dark:text-yellow-300 flex gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Cảnh báo:</strong> Cài đặt cơ sở dữ liệu là chỉ đọc. Để thay đổi, vui lòng liên hệ quản trị viên hệ thống.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    Cài đặt Bảo mật
                  </h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">
                        ✓ Xác thực JWT được bật
                      </p>
                      <p className="text-sm text-green-800 dark:text-green-400">
                        Thời gian hết hạn token: 24 giờ
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">
                        ✓ Mã hóa mật khẩu được bật
                      </p>
                      <p className="text-sm text-green-800 dark:text-green-400">
                        Thuật toán: bcrypt with 12 rounds
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">
                        ✓ CORS được cấu hình
                      </p>
                      <p className="text-sm text-green-800 dark:text-green-400">
                        Cho phép tất cả origins (*)
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                        ℹ️ SSL/TLS
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-400">
                        Được bật trên production
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}