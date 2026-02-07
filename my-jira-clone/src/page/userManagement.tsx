
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, UserPlus, Edit2, Trash2, Users, Search, X, Menu } from "lucide-react";
import { AuthService } from "../service/auth";
import { TeamService } from "../service/team";
import { DepartmentService } from "../service/department";
import { toast } from "sonner";
import { isLoggedIn, isAdmin } from "../helper/auth";
import type { UserDto } from "../service/auth";
import AppLayout from "../components/AppLayout";
export default function UserManagementPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedTeamForJoin, setSelectedTeamForJoin] = useState<{ userId: number; teamId: number | null } | null>(null);
  const [teamSearchKeyword, setTeamSearchKeyword] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    if (!isAdmin()) {
      navigate('/board');
      return;
    }
    loadUsers();
    loadTeams();
  }, [navigate]);
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await AuthService.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };
  const loadTeams = async () => {
    try {
      const data = await TeamService.getAll();
      setTeams(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading teams:', error);
    }
  };
  const handleDelete = async (userId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      return;
    }
    try {
      await AuthService.deleteUser(userId);
      toast.success('Đã xóa người dùng thành công');
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa người dùng');
    }
  };
  const handleJoinTeam = async (userId: number, teamId: number) => {
    try {
      await TeamService.addMember(teamId, userId);
      toast.success('Đã thêm người dùng vào team thành công');
      setSelectedTeamForJoin(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Không thể thêm người dùng vào team');
    }
  };
  const filteredUsers = users.filter(user => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
      user.fullName?.toLowerCase().includes(keyword) ||
      user.email?.toLowerCase().includes(keyword) ||
      user.username?.toLowerCase().includes(keyword) ||
      user.employeeCode?.toLowerCase().includes(keyword)
    );
  });
  if (loading && users.length === 0) {
    return (
      <AppLayout showProjects={false}>
        <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-slate-600 dark:text-slate-400">Đang tải danh sách người dùng...</span>
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
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý người dùng</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Quản lý tất cả người dùng trong hệ thống</p>
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
                    placeholder="Tìm kiếm người dùng theo tên, email, username..."
                    className="w-full pl-12 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setEditingUser(null);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-medium"
                >
                  <UserPlus className="w-5 h-5" />
                  Thêm người dùng
                </button>
              </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Tên</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Email</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Username</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Phòng ban</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Vai trò</th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16">
                        <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">
                          {searchKeyword ? 'Không tìm thấy người dùng phù hợp' : 'Chưa có người dùng nào'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="py-4 px-6 text-sm text-slate-900 dark:text-slate-100">{user.fullName || '-'}</td>
                        <td className="py-4 px-6 text-sm text-slate-900 dark:text-slate-100">{user.email || '-'}</td>
                        <td className="py-4 px-6 text-sm text-slate-900 dark:text-slate-100">{user.username || '-'}</td>
                        <td className="py-4 px-6 text-sm text-slate-900 dark:text-slate-100">{user.departmentName || '-'}</td>
                        <td className="py-4 px-6 text-sm text-slate-900 dark:text-slate-100">
                          {user.roleName && user.roleName.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {user.roleName.map((role, idx) => (
                                <span key={idx} className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                                  {role.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          ) : '-'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setShowAddForm(true);
                              }}
                              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                              title="Sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => {
                                  setSelectedTeamForJoin({ userId: user.id, teamId: null })
                                  setTeamSearchKeyword("")
                                }}
                                className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                title="Thêm vào team"
                              >
                                <Users className="w-4 h-4" />
                              </button>
                              {selectedTeamForJoin?.userId === user.id && (
                                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-10 min-w-[250px]">
                                  <div className="p-2">
                                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 px-2">Chọn team:</div>
                                    <div className="mb-2 px-2">
                                      <input
                                        type="text"
                                        value={teamSearchKeyword}
                                        onChange={(e) => setTeamSearchKeyword(e.target.value)}
                                        placeholder="Tìm kiếm team..."
                                        className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                    {teams.length === 0 ? (
                                      <div className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400">Không có team nào</div>
                                    ) : (
                                      <div className="max-h-48 overflow-y-auto">
                                        {teams
                                          .filter((team) => 
                                            !teamSearchKeyword || 
                                            team.name.toLowerCase().includes(teamSearchKeyword.toLowerCase())
                                          )
                                          .map((team) => (
                                            <button
                                              key={team.id}
                                              onClick={() => {
                                                handleJoinTeam(user.id, team.id)
                                                setTeamSearchKeyword("")
                                              }}
                                              className="w-full text-left px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
                                            >
                                              {team.name}
                                            </button>
                                          ))}
                                        {teams.filter((team) => 
                                          !teamSearchKeyword || 
                                          team.name.toLowerCase().includes(teamSearchKeyword.toLowerCase())
                                        ).length === 0 && (
                                          <div className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400">Không tìm thấy team</div>
                                        )}
                                      </div>
                                    )}
                                    <button
                                      onClick={() => {
                                        setSelectedTeamForJoin(null)
                                        setTeamSearchKeyword("")
                                      }}
                                      className="w-full text-left px-2 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded mt-1"
                                    >
                                      Hủy
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
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
      {(showAddForm || editingUser) && (
        <UserFormDialog
          isOpen={showAddForm || !!editingUser}
          onClose={() => {
            setShowAddForm(false);
            setEditingUser(null);
          }}
          user={editingUser}
          onSuccess={() => {
            setShowAddForm(false);
            setEditingUser(null);
            loadUsers();
          }}
        />
      )}
    </AppLayout>
  );
}
interface UserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserDto | null;
  onSuccess?: () => void;
}
function UserFormDialog({ isOpen, onClose, user, onSuccess }: UserFormDialogProps) {
  const [formData, setFormData] = useState({
    employeeCode: "",
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    departmentId: null as number | null,
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  useEffect(() => {
    if (isOpen) {
      loadDepartments();
    }
  }, [isOpen]);
  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const data = await DepartmentService.getAll();
      setDepartments(data);
    } catch (error: any) {
      console.error('Error loading departments:', error);
      toast.error('Không thể tải danh sách phòng ban');
    } finally {
      setLoadingDepartments(false);
    }
  };
  useEffect(() => {
    if (user) {
      const nameParts = (user.fullName || "").split(" ");
      setFormData({
        employeeCode: user.employeeCode || "",
        username: user.username || "",
        email: user.email || "",
        password: "",
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        departmentId: user.departmentId || null,
      });
    } else {
      setFormData({
        employeeCode: "",
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        departmentId: null,
      });
    }
  }, [user, isOpen]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    if (!user && !formData.password.trim()) {
      toast.error('Vui lòng nhập mật khẩu');
      return;
    }
    try {
      setIsSubmitting(true);
      if (user) {
        const selectedDepartment = departments.find(d => d.id === formData.departmentId);
        const departmentName = selectedDepartment?.name || "";
        await AuthService.updateUser(user.id, {
          email: formData.email.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          departmentId: formData.departmentId || undefined,
          departmentName: departmentName,
        });
        toast.success('Đã cập nhật người dùng thành công');
      } else {
        await AuthService.register({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          employeeCode: formData.employeeCode.trim() || undefined,
          departmentId: formData.departmentId || undefined,
        });
        toast.success('Đã thêm người dùng thành công');
      }
      onSuccess?.();
      onClose();
    } catch (error: any) {
      if (error?.code === 401) {
        return;
      }
      console.error('User operation error:', error);
      const errorMessage = error?.message || error?.data?.message || (user ? 'Không thể cập nhật người dùng' : 'Không thể thêm người dùng');
      toast.error(errorMessage);
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
            {user ? 'Sửa người dùng' : 'Thêm người dùng mới'}
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
              disabled={isSubmitting || !!user}
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
          {!user && (
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required={!user}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mật khẩu"
                disabled={isSubmitting}
                minLength={6}
              />
            </div>
          )}
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
            <select
              value={formData.departmentId || ""}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting || loadingDepartments}
            >
              <option value="">-- Chọn phòng ban --</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
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
              disabled={isSubmitting || !formData.username.trim() || !formData.email.trim() || (!user && !formData.password.trim())}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  {user ? 'Cập nhật' : 'Thêm người dùng'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}