import { InviteUserForm } from '../components/InviteUserForm.jsx';
import '../styles/invite.css';

export function InviteUserPage() {
  return (
    <div className="invite-page">
      <header className="invite-page-header">
        <h1>Invite user</h1>
        <p>They will get an email link to set a password.</p>
      </header>
      <InviteUserForm />
    </div>
  );
}
