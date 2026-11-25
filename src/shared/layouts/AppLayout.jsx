import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ROUTES } from '../../app/routes.constants.js';
import { ROLES } from '../constants/roles.js';
import { ROLE_NAV_ITEMS } from '../../config/permissions.js';
import { useLayoutUser } from '../hooks/useLayoutUser.js';
import { Button } from '../components/Button.jsx';
import { Pill } from '../components/Pill.jsx';

const ROLE_LABELS = {
  [ROLES.EMPLOYEE]: 'Employee',
  [ROLES.COMPANY_ADMIN]: 'Company Admin',
  [ROLES.SUPER_ADMIN]: 'Platform admin',
};

export function AppLayout() {
  const { user, logout } = useLayoutUser();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isUsersPage = pathname.startsWith(ROUTES.ADMIN_USERS);
  const companyAdmin = user?.role === ROLES.COMPANY_ADMIN;
  const isCompanyAdminPage = companyAdmin && (
    isUsersPage ||
    pathname.startsWith(ROUTES.REPORTS) ||
    pathname.startsWith(ROUTES.COMPANY_DATA)
  );
  const navItems = ROLE_NAV_ITEMS[user?.role] || ROLE_NAV_ITEMS[ROLES.EMPLOYEE];
  const companyName = user?.company_name || user?.companyName || (user?.role === ROLES.SUPER_ADMIN ? 'Platform' : 'Company');

  async function handleLogout() {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  return (
    <div className={`app-shell${companyAdmin ? ' app-shell--admin' : ''}`}>
      {menuOpen && <button className="chat-sidebar__backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <aside className={`chat-sidebar${companyAdmin ? ' chat-sidebar--admin' : ''}${menuOpen ? ' is-open' : ''}`}>
        <div className="chat-sidebar__company">{companyName}</div>
        <nav className="chat-sidebar__nav" aria-label="Main navigation">
          {navItems.map(({ label, to }) => (
            to ? (
              <NavLink
                className="chat-sidebar__link"
                end={label !== 'Users'}
                key={label}
                to={to}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </NavLink>
            ) : (
              <span className="chat-sidebar__link is-disabled" aria-disabled="true" key={label}>
                {label}
              </span>
            )
          ))}
        </nav>
        <div className="chat-sidebar__identity">
          <span className="chat-sidebar__name">{user?.name || 'Employee'}</span>
          <span className="chat-sidebar__role">{ROLE_LABELS[user?.role] || 'Employee'}</span>
          <Button className="chat-sidebar__logout" onClick={handleLogout}>Sign out</Button>
        </div>
      </aside>
      <div className="chat-workspace">
        {!isCompanyAdminPage && (
          <header className="chat-header">
            <h1>Ask your data</h1>
            <Pill>{companyAdmin ? 'Company admin' : 'Employee · Read-only'}</Pill>
          </header>
        )}
        {companyAdmin && (
          <Button
            className="chat-sidebar__menu"
            aria-label="Open navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <span aria-hidden="true">☰</span>
          </Button>
        )}
        <main className={`chat-main${isCompanyAdminPage ? ' company-admin-main' : ''}`}><Outlet /></main>
      </div>
    </div>
  );
}
