import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Users, Plus, Edit2, Trash2, Search, X, UserPlus, UserMinus } from "lucide-react";
import { TeamService, TeamDto, CreateTeamRequest, UpdateTeamRequest } from "../service/team";
import { DepartmentService, DepartmentDto } from "../service/department";
import { AuthService, UserDto } from "../service/auth";
import { toast } from "sonner";
import { isLoggedIn, canManageTeam, isAdmin } from "../helper/auth";
import AppLayout from "../components/AppLayout";
export default function TeamManagementPage() {
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamDto | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<TeamDto | null>(null);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    if (!canManageTeam()) {
      navigate('/board');
      return;
    }
    loadTeams();
  }, [navigate]);
  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await TeamService.getAll(searchKeyword || undefined);
      setTeams(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải danh sách nhóm');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadTeams();
  }, [searchKeyword]);
  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhóm này?')) {
      return;
    }
    try {
      await TeamService.delete(id);
      toast.success('Đã xóa nhóm thành công');
      loadTeams();
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa nhóm');
    }
  };
  const filteredTeams = teams.filter(team => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
      team.name?.toLowerCase().includes(keyword) ||
      team.departmentName?.toLowerCase().includes(keyword) ||
      team.leadName?.toLowerCase().includes(keyword) ||
      team.description?.toLowerCase().includes(keyword)
    );
  });
  if (loading && teams.length === 0) {
    return (
      <AppLayout showProjects={false}>
        <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-slate-600 dark:text-slate-400">Đang tải danh sách nhóm...</span>
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý nhóm</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Quản lý tất cả các nhóm trong hệ thống</p>
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
                    placeholder="Tìm kiếm nhóm theo tên, phòng ban, trưởng nhóm..."
                    className="w-full pl-12 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setEditingTeam(null);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Thêm nhóm
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Tên nhóm</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Phòng ban</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Trưởng nhóm</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Số thành viên</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Mô tả</th>
                      <th className="text-center py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeams.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-16">
                          <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                          <p className="text-slate-500 dark:text-slate-400">
                            {searchKeyword ? 'Không tìm thấy nhóm phù hợp' : 'Chưa có nhóm nào'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredTeams.map((team) => (
                        <tr key={team.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="py-4 px-6 text-sm text-slate-900 dark:text-slate-100 font-medium">{team.name || '-'}</td>
                          <td className="py-4 px-6 text-sm text-slate-900 dark:text-slate-100">{team.departmentName || '-'}</td>
                          <td className="py-4 px-6 text-sm text-slate-900 dark:text-slate-100">{team.leadName || '-'}</td>
                          <td className="py-4 px-6 text-sm text-slate-900 dark:text-slate-100">{team.memberIds?.length || 0}</td>
                          <td className="py-4 px-6 text-sm text-slate-900 dark:text-slate-100">{team.description || '-'}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedTeam(team);
                                  setShowMemberDialog(true);
                                }}
                                className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                title="Quản lý thành viên"
                              >
                                <Users className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingTeam(team);
                                  setShowAddForm(true);
                                }}
                                className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                title="Sửa"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {isAdmin() && (
                                <button
                                  onClick={() => handleDelete(team.id)}
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
      {(showAddForm || editingTeam) && (
        <TeamFormDialog
          isOpen={showAddForm || !!editingTeam}
          onClose={() => {
            setShowAddForm(false);
            setEditingTeam(null);
          }}
          team={editingTeam}
          onSuccess={() => {
            loadTeams();
            setShowAddForm(false);
            setEditingTeam(null);
          }}
        />
      )}
      {showMemberDialog && selectedTeam && (
        <TeamMemberDialog
          isOpen={showMemberDialog}
          onClose={() => {
            setShowMemberDialog(false);
            setSelectedTeam(null);
          }}
          team={selectedTeam}
          onSuccess={() => {
            loadTeams();
          }}
        />
      )}
    </AppLayout>
  );
}
interface TeamFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  team?: TeamDto | null;
  onSuccess?: () => void;
}
function TeamFormDialog({ isOpen, onClose, team, onSuccess }: TeamFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    departmentId: null as number | null,
    leadId: null as number | null,
    description: "",
  });
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  useEffect(() => {
    if (isOpen) {
      loadDepartments();
      loadUsers();
    }
  }, [isOpen]);
  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const data = await DepartmentService.getAll();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error('Không thể tải danh sách phòng ban');
    } finally {
      setLoadingDepartments(false);
    }
  };
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await AuthService.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoadingUsers(false);
    }
  };
  useEffect(() => {
    if (team && isOpen) {
      setFormData({
        name: team.name || "",
        code: team.code || "",
        departmentId: team.departmentId || null,
        leadId: team.leadId || null,
        description: team.description || "",
      });
    } else if (!team && isOpen) {
      setFormData({
        name: "",
        code: "",
        departmentId: null,
        leadId: null,
        description: "",
      });
    }
  }, [team, isOpen]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vui lòng điền tên nhóm');
      return;
    }
    if (!formData.departmentId) {
      toast.error('Vui lòng chọn phòng ban');
      return;
    }
    try {
      setIsSubmitting(true);
      const payload: any = {
        name: formData.name.trim(),
        departmentId: formData.departmentId,
      };
      if (formData.code && formData.code.trim()) {
        payload.code = formData.code.trim();
      }
      if (formData.leadId) {
        payload.leadId = formData.leadId;
      }
      if (formData.description && formData.description.trim()) {
        payload.description = formData.description.trim();
      }
      if (team) {
        await TeamService.update(team.id, payload);
        toast.success('Đã cập nhật nhóm thành công');
      } else {
        await TeamService.create(payload);
        toast.success('Đã thêm nhóm thành công');
      }
      setFormData({
        name: "",
        code: "",
        departmentId: null,
        leadId: null,
        description: "",
      });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Team operation error:', error);
      const errorMessage = error?.message || error?.data?.message || (team ? 'Không thể cập nhật nhóm' : 'Không thể thêm nhóm');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {team ? 'Sửa nhóm' : 'Thêm nhóm mới'}
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
              Tên nhóm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tên nhóm"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
              Mã nhóm
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mã nhóm (tùy chọn)"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
              Phòng ban <span className="text-red-500">*</span>
            </label>
            {loadingDepartments ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tải...
              </div>
            ) : (
              <select
                required
                value={formData.departmentId ?? ""}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value ? Number(e.target.value) : null })}
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
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
              Trưởng nhóm
            </label>
            {loadingUsers ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tải...
              </div>
            ) : (
              <select
                value={formData.leadId ?? ""}
                onChange={(e) => setFormData({ ...formData, leadId: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="">Chọn trưởng nhóm (tùy chọn)</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.email})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả nhóm (tùy chọn)"
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
              disabled={isSubmitting || !formData.name.trim() || !formData.departmentId}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  {team ? 'Cập nhật' : 'Thêm nhóm'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
interface TeamMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamDto;
  onSuccess?: () => void;
}
function TeamMemberDialog({ isOpen, onClose, team, onSuccess }: TeamMemberDialogProps) {
  const [allUsers, setAllUsers] = useState<UserDto[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  useEffect(() => {
    if (isOpen) {
      loadData();
      setSearchKeyword("");
    }
  }, [isOpen, team]);
  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, teamDetail] = await Promise.all([
        AuthService.getAllUsers(),
        TeamService.getById(team.id)
      ]);
      const users = Array.isArray(usersData) ? usersData : [];
      setAllUsers(users);
      if (teamDetail && teamDetail.memberIds) {
        const members = users.filter(u => teamDetail.memberIds?.includes(u.id));
        setTeamMembers(members);
      }
    } catch (error: any) {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };
  const handleAddMember = async (userId: number) => {
    try {
      setIsSubmitting(true);
      await TeamService.addMember(team.id, userId);
      toast.success('Đã thêm thành viên thành công');
      loadData();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Không thể thêm thành viên');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?')) {
      return;
    }
    try {
      setIsSubmitting(true);
      await TeamService.removeMember(team.id, userId);
      toast.success('Đã xóa thành viên thành công');
      loadData();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa thành viên');
    } finally {
      setIsSubmitting(false);
    }
  };
  const availableUsers = allUsers.filter(u => !teamMembers.some(m => m.id === u.id));
  const filterUsers = (users: UserDto[]) => {
    if (!searchKeyword.trim()) return users;
    const keyword = searchKeyword.toLowerCase().trim();
    return users.filter(user => 
      user.fullName?.toLowerCase().includes(keyword) ||
      user.email?.toLowerCase().includes(keyword) ||
      user.username?.toLowerCase().includes(keyword)
    );
  };
  const filteredTeamMembers = filterUsers(teamMembers);
  const filteredAvailableUsers = filterUsers(availableUsers);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Quản lý thành viên - {team.name}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm kiếm thành viên theo tên, email..."
              className="w-full pl-12 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Thành viên hiện tại ({teamMembers.length})
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : filteredTeamMembers.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {searchKeyword ? 'Không tìm thấy thành viên phù hợp' : 'Chưa có thành viên nào'}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredTeamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{member.fullName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={isSubmitting}
                      className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                      title="Xóa thành viên"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Thêm thành viên
            </h3>
            {filteredAvailableUsers.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {searchKeyword ? 'Không tìm thấy người dùng phù hợp' : availableUsers.length === 0 ? 'Tất cả người dùng đã là thành viên' : 'Không có kết quả tìm kiếm'}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredAvailableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.fullName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                    <button
                      onClick={() => handleAddMember(user.id)}
                      disabled={isSubmitting}
                      className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50"
                      title="Thêm thành viên"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}