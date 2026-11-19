import { Link } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.constants.js';
import { Button } from '../../../shared/components/Button.jsx';
import { EmptyState } from '../../../shared/components/EmptyState.jsx';
import { ErrorBanner } from '../../../shared/components/ErrorBanner.jsx';
import { UsersStats } from '../components/UsersStats.jsx';
import { UsersTable } from '../components/UsersTable.jsx';
import { useUsersPage } from '../hooks/useUsersPage.js';
import '../styles/users.css';

export function UsersPage() {
  const {
    companyName,
    usersQuery,
    actions,
    actionError,
    toast,
    setToast,
    data,
    usersError,
    runAction,
  } = useUsersPage();
  return (
    <div className="users-page">
      <header className="users-page-header">
        <div>
          <h1>Users</h1>
          <p>Manage who in {companyName} can use the chatbot.</p>
        </div>
        <Link className="button users-invite-button" to={`${ROUTES.ADMIN_USERS}/invite`}>
          Invite user
        </Link>
      </header>
      {toast && (
        <div className="users-toast" role="status">
          {toast}
          <Button aria-label="Dismiss notification" onClick={() => setToast('')}>Dismiss</Button>
        </div>
      )}
      {actionError && <ErrorBanner>{actionError}</ErrorBanner>}
      {usersQuery.isError ? (
        <div className="users-load-error">
          <ErrorBanner>{usersError}</ErrorBanner>
          <Button className="users-retry" onClick={() => usersQuery.refetch()}>Retry</Button>
        </div>
      ) : (
        <>
          <UsersStats summary={data?.summary} isLoading={usersQuery.isPending} />
          {data && data.users.length === 0 ? (
            <div className="users-empty">
              <EmptyState title="No users yet.">Invite your first teammate.</EmptyState>
            </div>
          ) : (
            <UsersTable
              users={data?.users || []}
              isLoading={usersQuery.isPending}
              pendingIds={actions.pendingIds}
              onDeactivate={(target) => runAction(actions.deactivate, target)}
              onResend={(target) => runAction(
                actions.resend,
                target,
                `Invite sent to ${target.email}`,
              )}
              onCancel={(target) => runAction(actions.cancel, target)}
            />
          )}
        </>
      )}
    </div>
  );
}
