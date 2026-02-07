import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Building2, Plus, Edit2, Trash2, Search, X } from "lucide-react";
import { DepartmentService, DepartmentDto } from "../service/department";
import { toast } from "sonner";
import { isLoggedIn, isAdmin, canManageDepartment } from "../helper/auth";
import AppLayout from "../components/AppLayout";
export default function DepartmentManagementPage() {
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentDto | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    if (!canManageDepartment()) {
      navigate('/board');
      return;
    }
    loadDepartments();
  }, [navigate]);
  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await DepartmentService.getAll();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải danh sách phòng ban');
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) {
      return;
    }
    try {
      await DepartmentService.delete(id);
      toast.success('Đã xóa phòng ban thành công');
      loadDepartments();
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa phòng ban');
    }
  };
  const filteredDepartments = departments.filter(dept => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
      dept.name?.toLowerCase().includes(keyword) ||
      dept.code?.toLowerCase().includes(keyword) ||
      dept.description?.toLowerCase().includes(keyword)
    );
  });
  if (loading && departments.length === 0) {
    return (
      <AppLayout showProjects={false}>
        <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-slate-600 dark:text-slate-400">Đang tải danh sách phòng ban...</span>
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout showProjects={false}>
      <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý phòng ban</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Quản lý tất cả các phòng ban trong hệ thống</p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Tìm kiếm phòng ban theo tên, mã, mô tả..."
                    className="w-full pl-12 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setEditingDepartment(null);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Thêm phòng ban
                </button>
              </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Tên</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Mã</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Mô tả</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Số nhân viên</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Số team</th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16">
                        <Building2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">
                          {searchKeyword ? 'Không tìm thấy phòng ban phù hợp' : 'Chưa có phòng ban nào'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredDepartments.map((dept) => (
                      <tr key={dept.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="py-4 px-6 text-sm text-slate-900 dark:text-slate-100">{dept.name || '-'}</td>
                        <td className="py-4 px-6 text-sm text-slate-900 dark:text-slate-100">{dept.code || '-'}</td>
                        <td className="py-4 px-6 text-sm text-slate-900 dark:text-slate-100">{dept.description || '-'}</td>
                        <td className="py-4 px-6 text-sm text-slate-900 dark:text-slate-100">{dept.totalUsers || 0}</td>
                        <td className="py-4 px-6 text-sm text-slate-900 dark:text-slate-100">{dept.totalTeams || 0}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingDepartment(dept);
                                setShowAddForm(true);
                              }}
                              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                              title="Sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {isAdmin() && (
                              <button
                                onClick={() => handleDelete(dept.id)}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </div>
      </div>
      {(showAddForm || editingDepartment) && (
        <DepartmentFormDialog
          isOpen={showAddForm || !!editingDepartment}
          onClose={() => {
            setShowAddForm(false);
            setEditingDepartment(null);
          }}
          department={editingDepartment}
          onSuccess={() => {
            setShowAddForm(false);
            setEditingDepartment(null);
            loadDepartments();
          }}
        />
      )}
    </AppLayout>
  );
}
interface DepartmentFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  department?: DepartmentDto | null;
  onSuccess?: () => void;
}
function DepartmentFormDialog({ isOpen, onClose, department, onSuccess }: DepartmentFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name || "",
        code: department.code || "",
        description: department.description || "",
      });
    } else {
      setFormData({
        name: "",
        code: "",
        description: "",
      });
    }
  }, [department, isOpen]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vui lòng điền tên phòng ban');
      return;
    }
    try {
      setIsSubmitting(true);
      if (department) {
        await DepartmentService.update(department.id, {
          name: formData.name.trim(),
          code: formData.code.trim() || undefined,
          description: formData.description.trim() || undefined,
        });
        toast.success('Đã cập nhật phòng ban thành công');
      } else {
        await DepartmentService.create({
          name: formData.name.trim(),
          code: formData.code.trim() || undefined,
          description: formData.description.trim() || undefined,
        });
        toast.success('Đã thêm phòng ban thành công');
      }
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || (department ? 'Không thể cập nhật phòng ban' : 'Không thể thêm phòng ban'));
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {department ? 'Sửa phòng ban' : 'Thêm phòng ban mới'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
              Tên phòng ban <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tên phòng ban"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
              Mã phòng ban
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mã phòng ban (tùy chọn)"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả phòng ban (tùy chọn)"
              rows={3}
              disabled={isSubmitting}
            />
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
              disabled={isSubmitting || !formData.name.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4" />
                  {department ? 'Cập nhật' : 'Thêm phòng ban'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}