import { useEffect, useState } from "react"
import { X, UserPlus, Loader2 } from "lucide-react"
import { AuthService } from "../service/auth"
import { toast } from "sonner"
import { DepartmentDto, DepartmentService } from "../service/department"
interface AddUserDialogProps {
  isOpen: boolean
  onClose: () => void
  onUserAdded?: () => void
}
export default function AddUserDialog({ isOpen, onClose, onUserAdded }: AddUserDialogProps) {
  const [formData, setFormData] = useState({
    employeeCode: "",
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    departmentId: null as number | null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [departments, setDepartments] = useState<DepartmentDto[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoadingDepartments(true)
        const data = await DepartmentService.getAll()
        setDepartments(data)
      } catch (error: any) {
        console.error(error)
        toast.error(error?.message || "Không thể tải danh sách phòng ban")
      } finally {
        setLoadingDepartments(false)
      }
    }
    if (isOpen) {
      loadDepartments()
    }
  }, [isOpen])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }
    try {
      setIsSubmitting(true)
      await AuthService.register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        employeeCode: formData.employeeCode.trim() || undefined,
        departmentId: formData.departmentId || undefined,
      })
      toast.success('Đã thêm user thành công')
      setFormData({
        employeeCode: "",
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        departmentId: null,
      })
      onUserAdded?.()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Không thể thêm user')
    } finally {
      setIsSubmitting(false)
    }
  }
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Thêm người dùng mới</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
                Họ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Họ"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
                Tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tên"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
              Tên đăng nhập <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tên đăng nhập"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập địa chỉ email"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mật khẩu"
              disabled={isSubmitting}
              minLength={6}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
              Mã nhân viên
            </label>
            <input
              type="text"
              value={formData.employeeCode}
              onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mã nhân viên (tùy chọn)"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
              Phòng ban
            </label>
            {loadingDepartments ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tải phòng ban...
              </div>
            ) : (
              <select
                value={formData.departmentId ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    departmentId: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="">Chọn phòng ban</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Chọn phòng ban để phân loại nhân sự (có thể để trống).
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.username.trim() || !formData.email.trim() || !formData.password.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Thêm người dùng
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}