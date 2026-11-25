import { Navigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.constants.js';
import { LoginForm } from '../components/LoginForm.jsx';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  if (token) {
    return <Navigate to={`${ROUTES.ACCEPT_INVITE}?token=${encodeURIComponent(token)}`} replace />;
  }
  return <LoginForm />;
}
