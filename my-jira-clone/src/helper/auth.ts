
export type UserRole = 'system_admin' | 'department_manager' | 'team_lead' | 'member';
const ROLE_HIERARCHY: Record<UserRole, number> = {
  system_admin: 4,
  department_manager: 3,
  team_lead: 2,
  member: 1,
};
export const getUserRoles = (): UserRole[] => {
  const role = localStorage.getItem('roleName');
  if (!role) return [];
  try {
    const roles = JSON.parse(role) as string[];
    return roles.filter((r): r is UserRole => 
      ['system_admin', 'department_manager', 'team_lead', 'member'].includes(r)
    );
  } catch {
    return [];
  }
};
export const isLoggedIn = (): boolean => {
  return !!localStorage.getItem('access_token');
};
export const getCurrentUser = () => {
  const sessionUser = sessionStorage.getItem('session_user');
  return sessionUser ? JSON.parse(sessionUser) : null;
};
export const hasRole = (role: UserRole | string): boolean => {
  const roles = getUserRoles();
  return roles.includes(role as UserRole);
};
export const hasAnyRole = (roles: UserRole[]): boolean => {
  const userRoles = getUserRoles();
  return roles.some(role => userRoles.includes(role));
};
export const hasAllRoles = (roles: UserRole[]): boolean => {
  const userRoles = getUserRoles();
  return roles.every(role => userRoles.includes(role));
};
export const hasMinimumRole = (minimumRole: UserRole): boolean => {
  const userRoles = getUserRoles();
  const minLevel = ROLE_HIERARCHY[minimumRole];
  return userRoles.some(role => {
    const roleLevel = ROLE_HIERARCHY[role];
    return roleLevel >= minLevel;
  });
};
export const isAdmin = (): boolean => {
  return hasRole('system_admin');
};
export const canManageDepartment = (): boolean => {
  return hasAnyRole(['system_admin', 'department_manager']);
};
export const canManageTeam = (): boolean => {
  return hasAnyRole(['system_admin', 'department_manager', 'team_lead']);
};
export const canCreateProject = (): boolean => {
  return hasAnyRole(['system_admin', 'department_manager', 'team_lead']);
};
export const canDeleteProject = (): boolean => {
  return hasAnyRole(['system_admin', 'department_manager']);
};
export const canManageTasks = (): boolean => {
  return hasAnyRole(['system_admin', 'department_manager', 'team_lead']);
};
export const canDeleteTasks = (): boolean => {
  return hasAnyRole(['system_admin', 'department_manager', 'team_lead']);
};
export const canAssignTasks = (): boolean => {
  return hasAnyRole(['system_admin', 'department_manager', 'team_lead']);
};
export const canMoveTask = (task?: { assigneeIds?: number[] }): boolean => {
  if (canManageTasks() && !isAdmin()) {
    return true;
  }
  if (task?.assigneeIds && task.assigneeIds.length > 0) {
    const userId = getUserId();
    if (userId !== null) {
      return task.assigneeIds.includes(userId);
    }
  }
  return false;
};
export const getUserId = (): number | null => {
  const id = localStorage.getItem('userId');
  return id ? Number(id) : null;
};
export const getUserFullName = (): string | null => {
  return localStorage.getItem('fullName');
};
export const getUserEmail = (): string | null => {
  return localStorage.getItem('email');
};
export const clearAllCache = () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
    if ('indexedDB' in window) {
      indexedDB.databases?.().then(databases => {
        databases.forEach(db => {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
          }
        });
      }).catch(err => {
        console.warn('Error clearing IndexedDB:', err);
      });
    }
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      const domainParts = window.location.hostname.split('.');
      if (domainParts.length > 1) {
        const parentDomain = '.' + domainParts.slice(-2).join('.');
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${parentDomain}`;
      }
    }
    console.log('[Auth] All cache, storage, cookies, and session cleared');
  } catch (error) {
    console.error('[Auth] Error clearing cache:', error);
  }
};
export const logout = () => {
  clearAllCache();
  window.location.href = '/login';
};
export const handleUnauthorized = () => {
  console.warn('[Auth] Unauthorized access detected, clearing cache and redirecting to login');
  clearAllCache();
  setTimeout(() => {
    window.location.href = '/login';
  }, 100);
};