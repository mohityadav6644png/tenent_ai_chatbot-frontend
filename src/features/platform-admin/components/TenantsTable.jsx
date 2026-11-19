import { EmptyState } from '../../../shared/components/EmptyState.jsx';
import { StatusBadge } from '../../../shared/components/StatusBadge.jsx';
import { useTenantsTable } from '../hooks/useTenantsTable.js';
import { TenantRowActions } from './TenantRowActions.jsx';

const HEADERS = ['Company', 'Status', 'Users', 'Queries (month)', 'Actions'];

export function TenantsTable({
  tenants,
  isLoading,
  pendingTenantId,
  onSuspend,
  onReactivate,
}) {
  const rows = useTenantsTable(tenants);

  if (!isLoading && tenants.length === 0) {
    return <EmptyState title="No tenants yet.">Onboard your first company.</EmptyState>;
  }

  return (
    <div className="tenants-table-card">
      <div className="tenants-table-scroll">
        <table className="tenants-table" aria-label="Companies">
          <thead>
            <tr>{HEADERS.map((header) => <th scope="col" key={header}>{header}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }, (_, index) => (
                <tr className="tenant-skeleton-row" key={index}>
                  {HEADERS.map((header) => <td key={header}><span /></td>)}
                </tr>
              ))
              : rows.map(({ tenant, status, userCount, queriesMonth }) => (
                  <tr key={tenant.id}>
                    <td className="tenant-name">{tenant.name}</td>
                    <td><StatusBadge status={status.tone} label={status.label} /></td>
                    <td>{userCount}</td>
                    <td>{queriesMonth}</td>
                    <td className="tenant-actions-cell">
                      <TenantRowActions
                        tenant={tenant}
                        isPending={pendingTenantId === tenant.id}
                        onSuspend={onSuspend}
                        onReactivate={onReactivate}
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
