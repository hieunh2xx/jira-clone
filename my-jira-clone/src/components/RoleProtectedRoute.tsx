import { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { isLoggedIn, hasAnyRole, UserRole } from '../helper/auth';
interface RoleProtectedRouteProps {
  children: ReactElement;
  roles?: UserRole[];
  redirectTo?: string;
}
export function RoleProtectedRoute({ 
  children, 
  roles,
  redirectTo = '/board' 
}: RoleProtectedRouteProps) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  if (roles && roles.length > 0 && !hasAnyRole(roles)) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}