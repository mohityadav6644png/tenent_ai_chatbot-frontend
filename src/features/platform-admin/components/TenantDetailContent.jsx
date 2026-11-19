import { CompanyAdminsTable } from './CompanyAdminsTable.jsx';
import { PrivacyNotice } from './PrivacyNotice.jsx';
import { TenantDetailHeader } from './TenantDetailHeader.jsx';
import { TenantStats } from './TenantStats.jsx';
import { ErrorBanner } from '../../../shared/components/ErrorBanner.jsx';

export function TenantDetailContent({ tenant, isPending, actionError, onSuspend, onReactivate }) {
  return (
    <>
      <TenantDetailHeader
        tenant={tenant}
        isPending={isPending}
        onSuspend={onSuspend}
        onReactivate={onReactivate}
      />
      <PrivacyNotice />
      {actionError && <ErrorBanner>{actionError}</ErrorBanner>}
      <TenantStats stats={tenant.stats} />
      <CompanyAdminsTable admins={tenant.admins} />
    </>
  );
}
