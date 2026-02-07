import { useState, useEffect, useRef } from "react"
import { X, Search, UserPlus, Loader2 } from "lucide-react"
import { AuthService, UserDto } from "../service/auth"
import { toast } from "sonner"
interface AddMemberDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddMember: (userId: number) => Promise<void>
  existingMemberIds?: number[]
}
export default function AddMemberDialog({ isOpen, onClose, onAddMember, existingMemberIds = [] }: AddMemberDialogProps) {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [searchResults, setSearchResults] = useState<UserDto[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (!isOpen) {
      setSearchKeyword("")
      setSearchResults([])
      return
    }
  }, [isOpen])
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    if (searchKeyword.trim().length < 2) {
      setSearchResults([])
      return
    }
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearching(true)
        const users = await AuthService.searchUsers(searchKeyword.trim())
        const filtered = users.filter(u => !existingMemberIds.includes(u.id))
        setSearchResults(filtered)
      } catch (error: any) {
        toast.error(error.message || 'Không thể tìm kiếm users')
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchKeyword, existingMemberIds])
  const handleAddMember = async (user: UserDto) => {
    try {
      setIsAdding(true)
      await onAddMember(user.id)
      toast.success(`Đã thêm ${user.fullName} vào dự án`)
      setSearchKeyword("")
      setSearchResults([])
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Không thể thêm member')
    } finally {
      setIsAdding(false)
    }
  }
  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Thêm thành viên vào team</h2>
          <button
            onClick={onClose}
            disabled={isAdding}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm kiếm theo email, username hoặc tên..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isAdding}
            />
          </div>
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-slate-500 dark:text-slate-400">Đang tìm kiếm...</span>
            </div>
          )}
          {!isSearching && searchKeyword.trim().length >= 2 && searchResults.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400">Không tìm thấy user nào</p>
            </div>
          )}
          {!isSearching && searchKeyword.trim().length < 2 && (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400">Nhập ít nhất 2 ký tự để tìm kiếm</p>
            </div>
          )}
          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-sm font-semibold text-white">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        getInitials(user.fullName)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 truncate">{user.fullName}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      {user.departmentName && (
                        <p className="text-xs text-slate-400 dark:text-slate-500">{user.departmentName}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddMember(user)}
                    disabled={isAdding}
                    className="ml-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isAdding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Thêm
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}