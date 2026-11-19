import { StatusBadge } from '../../../shared/components/StatusBadge.jsx';
import { useReportsTable } from '../hooks/useReportsTable.js';
import { ReportRowActions } from './ReportRowActions.jsx';

const COLUMNS = ['Report', 'Schedule', 'Recipients', 'Status', 'Actions'];

export function ReportsTable({ reports, isLoading, pendingIds, onPause, onResume }) {
  const rows = useReportsTable(reports);

  return (
    <div className="reports-table-card">
      <div className="reports-table-scroll">
        <table className="reports-table" aria-busy={isLoading}>
          <thead>
            <tr>{COLUMNS.map((column) => <th key={column} scope="col">{column}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }, (_, index) => (
                <tr className="reports-skeleton-row" key={`skeleton-${index}`} aria-hidden="true">
                  {COLUMNS.map((column) => <td key={column}><span /></td>)}
                </tr>
              ))
              : rows.map((report) => {
                return (
                  <tr key={report.id}>
                    <td className="reports-name">{report.name}</td>
                    <td>{report.scheduleLabel}</td>
                    <td title={report.recipientsTitle}>{report.recipientsLabel}</td>
                    <td><StatusBadge status={report.status} label={report.statusLabel} /></td>
                    <td className="reports-actions-cell">
                      <ReportRowActions
                        report={report}
                        disabled={pendingIds.includes(report.id)}
                        onPause={() => onPause(report)}
                        onResume={() => onResume(report)}
                      />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
