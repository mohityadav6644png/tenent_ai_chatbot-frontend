import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/index.js';
import { ROUTES } from '../routes.constants.js';

export function RoleRoute({ allowedRoles }) {
  const { user } = useAuth();

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to={user?.role === 'super_admin' ? ROUTES.PLATFORM_ADMIN : ROUTES.CHAT} replace />;
  }

  return <Outlet />;
}
