import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/index.js';
import { ROUTES } from '../routes.constants.js';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw' }}>
        <div style={{ textAlign: 'center', color: 'var(--platform-muted, #64748b)' }}>
          <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--chat-teal, #0f766e)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
