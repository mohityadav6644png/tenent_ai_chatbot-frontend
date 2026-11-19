import { IconButton } from '../../../shared/components/IconButton.jsx';
import { Pill } from '../../../shared/components/Pill.jsx';

export function ChatHeader({ title, onMenuClick, sidebarOpen = false }) {
  return (
    <header className="conversation-header">
      <IconButton
        className="conversation-menu-button"
        aria-expanded={sidebarOpen}
        label="Open conversations"
        onClick={onMenuClick}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </IconButton>
      <h1>{title || 'New chat'}</h1>
      <Pill className="read-only-pill">Read-only · your company data</Pill>
    </header>
  );
}
