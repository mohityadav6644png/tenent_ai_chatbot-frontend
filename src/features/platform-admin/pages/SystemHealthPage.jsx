import { Button } from '../../../shared/components/Button.jsx';
import { ErrorBanner } from '../../../shared/components/ErrorBanner.jsx';
import { AuditLogTable } from '../components/AuditLogTable.jsx';
import { HealthGrid } from '../components/HealthGrid.jsx';
import { useSystemHealthPage } from '../hooks/useSystemHealthPage.js';
import '../styles/platform-admin.css';

export function SystemHealthPage() {
  const { healthQuery, auditQuery, healthError, auditError } = useSystemHealthPage();

  return (
    <div className="platform-health-page">
      <header className="platform-health-header">
        <h1>System health</h1>
        <p>Platform status and recent audit events (metadata only).</p>
      </header>
      <section className="platform-health-region" aria-label="Platform health" aria-live="polite">
        {healthQuery.isError ? (
          <div className="platform-section-error">
            <ErrorBanner>{healthError}</ErrorBanner>
            <Button className="platform-retry" onClick={() => healthQuery.refetch()}>Retry</Button>
          </div>
        ) : (
          <HealthGrid
            components={healthQuery.data?.components || []}
            isLoading={healthQuery.isPending}
          />
        )}
      </section>
      {auditQuery.isError ? (
        <section className="platform-audit-section">
          <h2>Audit log</h2>
          <div className="platform-section-error">
            <ErrorBanner>{auditError}</ErrorBanner>
            <Button className="platform-retry" onClick={() => auditQuery.refetch()}>Retry</Button>
          </div>
        </section>
      ) : (
        <AuditLogTable
          events={auditQuery.data?.events || []}
          isLoading={auditQuery.isPending}
        />
      )}
    </div>
  );
}
