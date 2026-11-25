import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.constants.js';
import { useAuth } from '../../auth/index.js';
import { Avatar } from '../../../shared/components/Avatar.jsx';
import { Button } from '../../../shared/components/Button.jsx';
import { IconButton } from '../../../shared/components/IconButton.jsx';
import { ConversationList } from './ConversationList.jsx';
import '../styles/conversation-sidebar.css';

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  open = false,
  onClose,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  const companyName = user?.company_name || user?.companyName || 'Company';
  const brandInitial = companyName.trim().charAt(0).toUpperCase() || 'C';

  return (
    <>
      {open && <button className="conversation-backdrop" onClick={onClose} aria-label="Close menu" />}
      <aside className={`conversation-sidebar${open ? ' is-open' : ''}`}>
        <div className="conversation-brand">
          <span className="conversation-brand__mark">{brandInitial}</span>
          <span><strong>{companyName}</strong><small>Data assistant</small></span>
        </div>
        <Button className="new-chat-button" onClick={onNewChat}>
          <span aria-hidden="true">+</span> New chat
        </Button>
        <section className="conversation-sidebar__recent">
          <h2>Recent</h2>
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={(id) => {
              onSelect(id);
              onClose?.();
            }}
          />
        </section>
        <footer className="conversation-sidebar__footer">
          <Avatar name={user?.name || 'Employee'} className="user-avatar" />
          <span className="conversation-sidebar__user">
            <strong>{user?.name || 'Employee'}</strong>
            <small>Employee</small>
          </span>
          <IconButton label="Log out" className="logout-icon" onClick={handleLogout}>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M10 17l5-5-5-5M15 12H3m9-8h6a2 2 0 012 2v12a2 2 0 01-2 2h-6" />
            </svg>
          </IconButton>
        </footer>
      </aside>
    </>
  );
}
