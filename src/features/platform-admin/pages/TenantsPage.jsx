import { Link } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.constants.js';
import { Button } from '../../../shared/components/Button.jsx';
import { EmptyState } from '../../../shared/components/EmptyState.jsx';
import { ErrorBanner } from '../../../shared/components/ErrorBanner.jsx';
import { StatsGrid } from '../components/StatsGrid.jsx';
import { PrivacyNotice } from '../components/PrivacyNotice.jsx';
import { TenantsTable } from '../components/TenantsTable.jsx';
import { useTenantsPage } from '../hooks/useTenantsPage.js';
import '../styles/platform-admin.css';

export function TenantsPage() {
  const {
    tenantsQuery,
    actions,
    actionError,
    successToast,
    setSuccessToast,
    data,
    tenantsError,
    changeTenantStatus,
  } = useTenantsPage();

  return (
    <div className="platform-tenants-page">
      <header className="platform-page-header">
        <h1>Tenants</h1>
        <Link className="platform-primary-link" to={ROUTES.PLATFORM_TENANT_NEW}>
          Onboard company
        </Link>
      </header>
      {successToast && (
        <div className="platform-success-toast" role="status">
          {successToast}
          <button type="button" onClick={() => setSuccessToast('')}>Dismiss</button>
        </div>
      )}
      <PrivacyNotice />
      {actionError && <ErrorBanner>{actionError}</ErrorBanner>}
      {tenantsQuery.isError ? (
        <div className="platform-load-error">
          <ErrorBanner>{tenantsError}</ErrorBanner>
          <Button className="platform-retry" onClick={() => tenantsQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          <StatsGrid summary={data?.summary} isLoading={tenantsQuery.isLoading} />
          {data && data.tenants.length === 0 && (
            <div className="platform-empty-onboard">
              <EmptyState title="No tenants yet.">Onboard your first company.</EmptyState>
            </div>
          )}
          {(!data || data.tenants.length > 0) && (
            <TenantsTable
              tenants={data?.tenants || []}
              isLoading={tenantsQuery.isLoading}
              pendingTenantId={actions.pendingTenantId}
              onSuspend={(tenant) => changeTenantStatus(actions.suspend, tenant)}
              onReactivate={(tenant) => changeTenantStatus(actions.reactivate, tenant)}
            />
          )}
        </>
      )}
    </div>
  );
}
