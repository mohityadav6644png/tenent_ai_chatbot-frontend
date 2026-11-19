import { StatusBadge } from '../../../shared/components/StatusBadge.jsx';
import { useUsersTable } from '../hooks/useUsersTable.js';
import { UserRowActions } from './UserRowActions.jsx';

export function UsersTable({ users, isLoading, pendingIds, onDeactivate, onResend, onCancel }) {
  const rows = useUsersTable(users);

  return (
    <div className="tenants-table-card users-table-card">
      <div className="tenants-table-scroll users-table-scroll">
        <table className="users-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }, (_, index) => (
                <tr className="users-skeleton-row" key={index} aria-hidden="true">
                  {Array.from({ length: 5 }, (_unused, cell) => (
                    <td key={cell}><span /></td>
                  ))}
                </tr>
              ))
              : rows.map((user) => (
                <tr key={user.id}>
                  <td className="users-name">{user.name}</td>
                  <td className="users-email">{user.email}</td>
                  <td><StatusBadge status={user.roleDisplay.tone} label={user.roleDisplay.label} /></td>
                  <td><StatusBadge status={user.statusDisplay.tone} label={user.statusDisplay.label} /></td>
                  <td className="users-actions-cell">
                    <UserRowActions
                      user={user}
                      isPending={pendingIds.includes(user.id)}
                      onDeactivate={onDeactivate}
                      onResend={onResend}
                      onCancel={onCancel}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
