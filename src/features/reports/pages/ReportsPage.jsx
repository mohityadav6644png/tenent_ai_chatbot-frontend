import { Link } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.constants.js';
import { Button } from '../../../shared/components/Button.jsx';
import { EmptyState } from '../../../shared/components/EmptyState.jsx';
import { ErrorBanner } from '../../../shared/components/ErrorBanner.jsx';
import { useReportsPage } from '../hooks/useReportsPage.js';
import { ReportsTable } from '../components/ReportsTable.jsx';
import '../styles/reports.css';

export function ReportsPage() {
  const { reportsQuery, actions, reports, reportsError } = useReportsPage();

  return (
    <div className="reports-page">
      <header className="reports-page-header">
        <div>
          <h1>Reports</h1>
          <p>Scheduled emails built from your company data.</p>
        </div>
        <Link className="button reports-new-button" to={ROUTES.REPORTS_NEW}>New report</Link>
      </header>
      {actions.toast && (
        <div
          className={`reports-toast${actions.toast.type === 'error' ? ' reports-toast--error' : ''}`}
          role="status"
        >
          {actions.toast.message}
          <Button aria-label="Dismiss notification" onClick={actions.clearToast}>Dismiss</Button>
        </div>
      )}
      {reportsQuery.isError ? (
        <div className="reports-load-error">
          <ErrorBanner>{reportsError}</ErrorBanner>
          <Button className="reports-retry" onClick={() => reportsQuery.refetch()}>Retry</Button>
        </div>
      ) : reports.length === 0 && !reportsQuery.isPending ? (
        <div className="reports-table-card reports-empty">
          <EmptyState title="No reports yet.">Create your first scheduled report.</EmptyState>
          <Link className="button reports-new-button" to={ROUTES.REPORTS_NEW}>New report</Link>
        </div>
      ) : (
        <ReportsTable
          reports={reports}
          isLoading={reportsQuery.isPending}
          pendingIds={actions.pendingIds}
          onPause={(report) => actions.pause.mutate(report.id)}
          onResume={(report) => actions.resume.mutate(report.id)}
        />
      )}
    </div>
  );
}
