import { ReactNode } from 'react';
import { hasRole, hasAnyRole, hasMinimumRole, UserRole } from '../helper/auth';
interface RoleGuardProps {
  children: ReactNode;
  roles?: UserRole[];
  requireAll?: boolean;
  minimumRole?: UserRole;
  fallback?: ReactNode;
}
export function RoleGuard({ 
  children, 
  roles, 
  requireAll = false,
  minimumRole,
  fallback = null 
}: RoleGuardProps) {
  let hasPermission = true;
  if (roles && roles.length > 0) {
    hasPermission = requireAll 
      ? hasAnyRole(roles)
      : hasAnyRole(roles);
  }
  if (minimumRole) {
    hasPermission = hasPermission && hasMinimumRole(minimumRole);
  }
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
export function useRolePermission(roles?: UserRole[], minimumRole?: UserRole): boolean {
  if (roles && roles.length > 0) {
    return hasAnyRole(roles);
  }
  if (minimumRole) {
    return hasMinimumRole(minimumRole);
  }
  return true;
}