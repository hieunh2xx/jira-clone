import { useState, useMemo, useEffect } from "react";
import { X, UserPlus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { UserDto } from "../interface/dto";
import { DepartmentService, DepartmentDto } from "../service/department";
interface AssigneeSelectorProps {
  allUsers: UserDto[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}
const ITEMS_PER_PAGE = 20;
const getColorFromName = (name: string): string => {
  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#F97316",
    "#6366F1",
    "#14B8A6",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
const getLastname = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 0 ? parts[parts.length - 1] : fullName;
};
const getInitials = (fullName: string): string => {
  const lastname = getLastname(fullName);
  return lastname.charAt(0).toUpperCase();
};
interface UserAvatarProps {
  user: UserDto;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}
export function UserAvatar({ user, size = "md", showName = false }: UserAvatarProps) {
  const lastname = getLastname(user.fullName || user.username);
  const initials = getInitials(user.fullName || user.username);
  const color = getColorFromName(lastname);
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };
  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white`}
        style={{ backgroundColor: color }}
        title={user.fullName || user.username}
      >
        {initials}
      </div>
      {showName && (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {user.fullName || user.username}
        </span>
      )}
    </div>
  );
}
export default function AssigneeSelector({
  allUsers,
  selectedIds,
  onChange,
  disabled = false,
}: AssigneeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  useEffect(() => {
    if (isOpen && departments.length === 0) {
      loadDepartments();
    }
  }, [isOpen]);
  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const depts = await DepartmentService.getAll();
      setDepartments(depts);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };
  const selectedUsers = useMemo(() => {
    return allUsers.filter((u) => selectedIds.includes(u.id));
  }, [allUsers, selectedIds]);
  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      if (selectedIds.includes(user.id)) return false;
      if (selectedDepartmentId !== null && user.departmentId !== selectedDepartmentId) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullName = (user.fullName || "").toLowerCase();
        const username = (user.username || "").toLowerCase();
        const email = (user.email || "").toLowerCase();
        const employeeCode = (user.employeeCode || "").toLowerCase();
        const departmentName = (user.departmentName || "").toLowerCase();
        if (
          !fullName.includes(query) &&
          !username.includes(query) &&
          !email.includes(query) &&
          !employeeCode.includes(query) &&
          !departmentName.includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [allUsers, selectedIds, searchQuery, selectedDepartmentId]);
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const availableUsers = filteredUsers.slice(startIndex, endIndex);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDepartmentId]);
  const handleToggleUser = (userId: number) => {
    if (disabled) return;
    const newIds = selectedIds.includes(userId)
      ? selectedIds.filter((id) => id !== userId)
      : [...selectedIds, userId];
    onChange(newIds);
  };
  const handleRemoveUser = (userId: number, e?: React.MouseEvent) => {
    if (disabled) return;
    e?.stopPropagation();
    e?.preventDefault();
    const newIds = selectedIds.filter((id) => id !== userId);
    onChange(newIds);
  };
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Người được giao
      </label>
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedUsers.map((user) => {
            const lastname = getLastname(user.fullName || user.username);
            const initials = getInitials(user.fullName || user.username);
            const color = getColorFromName(lastname);
            return (
              <div
                key={user.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center font-semibold text-white text-xs"
                  style={{ backgroundColor: color }}
                >
                  {initials}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user.fullName || user.username}
                </span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveUser(user.id, e)}
                    className="ml-1 p-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {!disabled && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm người phụ trách</span>
        </button>
      )}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery("");
            }}
          />
          <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-slate-800 shadow-xl z-50 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Chọn người phụ trách
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setSearchQuery("");
                    setSelectedDepartmentId(null);
                    setCurrentPage(1);
                  }}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-3">
                <select
                  value={selectedDepartmentId === null ? "" : selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả bộ phận</option>
                  {loadingDepartments ? (
                    <option disabled>Đang tải...</option>
                  ) : (
                    departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.totalUsers})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo tên, email, mã nhân viên..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {availableUsers.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {searchQuery || selectedDepartmentId !== null
                    ? "Không tìm thấy người dùng"
                    : "Tất cả người dùng đã được chọn"}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {availableUsers.map((user) => {
                      const lastname = getLastname(user.fullName || user.username);
                      const initials = getInitials(user.fullName || user.username);
                      const color = getColorFromName(lastname);
                      const isSelected = selectedIds.includes(user.id);
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleToggleUser(user.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                              : "hover:bg-gray-50 dark:hover:bg-slate-700"
                          }`}
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0"
                            style={{ backgroundColor: color }}
                          >
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {user.fullName || user.username}
                              {isSelected && (
                                <span className="ml-2 text-blue-600 dark:text-blue-400">✓</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {user.email}
                              {user.employeeCode && ` • ${user.employeeCode}`}
                              {user.departmentName && ` • ${user.departmentName}`}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Trước
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Trang {currentPage} / {totalPages} ({filteredUsers.length} người)
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sau
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery("");
                  setSelectedDepartmentId(null);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}