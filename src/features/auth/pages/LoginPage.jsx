import { Navigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.constants.js';
import { LoginForm } from '../components/LoginForm.jsx';
import { useAuth } from '../hooks/useAuth.js';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const token = searchParams.get('token');

  if (token) {
    return <Navigate to={`${ROUTES.ACCEPT_INVITE}?token=${encodeURIComponent(token)}`} replace />;
  }

  if (!isLoading && isAuthenticated && user) {
    const destination = {
      employee: ROUTES.CHAT,
      company_admin: ROUTES.ADMIN_USERS,
      super_admin: ROUTES.PLATFORM_TENANTS,
    }[user.role] || ROUTES.CHAT;
    return <Navigate to={destination} replace />;
  }

  return <LoginForm />;
}
