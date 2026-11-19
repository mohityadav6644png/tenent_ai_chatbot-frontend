import { Link, useParams } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.constants.js';
import { Button } from '../../../shared/components/Button.jsx';
import { EmptyState } from '../../../shared/components/EmptyState.jsx';
import { ErrorBanner } from '../../../shared/components/ErrorBanner.jsx';
import { TenantDetailContent } from '../components/TenantDetailContent.jsx';
import { TenantDetailSkeleton } from '../components/TenantDetailSkeleton.jsx';
import { useTenantDetailPage } from '../hooks/useTenantDetailPage.js';
import '../styles/platform-admin.css';

export function TenantDetailPage() {
  const { tenantId } = useParams();
  const {
    tenantQuery,
    actions,
    actionError,
    notFound,
    tenant,
    tenantError,
    changeStatus,
  } = useTenantDetailPage(tenantId);

  return (
    <div className="tenant-detail-page">
      <Link className="tenant-detail-back" to={ROUTES.PLATFORM_TENANTS}>Back to tenants</Link>
      {notFound ? (
        <div className="tenant-detail-empty">
          <EmptyState title="Tenant not found">
            <Link to={ROUTES.PLATFORM_TENANTS}>Return to tenants</Link>
          </EmptyState>
        </div>
      ) : tenantQuery.isPending ? (
        <TenantDetailSkeleton />
      ) : tenantQuery.isError ? (
        <div className="platform-load-error">
          <ErrorBanner>{tenantError}</ErrorBanner>
          <Button className="platform-retry" onClick={() => tenantQuery.refetch()}>Retry</Button>
        </div>
      ) : (
        <TenantDetailContent
          tenant={tenant}
          isPending={actions.isPending}
          actionError={actionError}
          onSuspend={(id) => changeStatus(actions.suspend, id)}
          onReactivate={(id) => changeStatus(actions.reactivate, id)}
        />
      )}
    </div>
  );
}
