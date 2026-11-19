import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../app/routes.constants.js';
import { useLayoutUser } from '../hooks/useLayoutUser.js';
import { Button } from '../components/Button.jsx';
import './platform-layout.css';

const PLATFORM_LINKS = [
  { label: 'Tenants', to: ROUTES.PLATFORM_TENANTS },
  { label: 'System health', to: ROUTES.PLATFORM_SYSTEM_HEALTH },
  { label: 'Usage and costs', to: ROUTES.PLATFORM_USAGE },
  { label: 'Audit log', to: ROUTES.PLATFORM_AUDIT },
];

export function PlatformLayout() {
  const { user, logout } = useLayoutUser();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  return (
    <div className="platform-shell">
      {menuOpen && <button className="platform-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <aside className={`platform-sidebar${menuOpen ? ' is-open' : ''}`}>
        <div className="platform-brand">
          <strong>Platform Console</strong>
          <span>Super Admin</span>
        </div>
        <nav className="platform-nav" aria-label="Platform navigation">
          {PLATFORM_LINKS.map(({ label, to, end }) => (
            <NavLink
              end={end}
              key={to}
              to={to}
              className={({ isActive }) => `platform-nav__link${isActive ? ' is-active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <footer className="platform-identity">
          <strong>{user?.name || 'Platform owner'}</strong>
          <span>Platform owner</span>
          <Button className="platform-logout" onClick={handleLogout}>Log out</Button>
        </footer>
      </aside>
      <main className="platform-content">
        <Button
          className="platform-menu-button"
          aria-label="Open platform navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <span aria-hidden="true">☰</span>
        </Button>
        <Outlet />
      </main>
    </div>
  );
}
