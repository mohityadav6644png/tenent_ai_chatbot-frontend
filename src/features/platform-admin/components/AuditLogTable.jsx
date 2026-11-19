import { StatusBadge } from '../../../shared/components/StatusBadge.jsx';
import { useAuditLogTable } from '../hooks/useAuditLogTable.js';

export function AuditLogTable({ events, isLoading }) {
  const rows = useAuditLogTable(events);

  return (
    <section className="platform-audit-section">
      <h2>Audit log</h2>
      <div className="tenants-table-card">
        <div className="tenants-table-scroll">
          <table className="tenants-table platform-audit-table">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Actor</th>
                <th scope="col">Action</th>
                <th scope="col">Target</th>
                <th scope="col">Result</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }, (_, index) => (
                  <tr className="platform-audit-skeleton-row" key={index} aria-hidden="true">
                    <td><span /></td><td><span /></td><td><span /></td>
                    <td><span /></td><td><span /></td>
                  </tr>
                ))
                : rows.map((event) => (
                  <tr key={event.id}>
                    <td><time dateTime={event.occurred_at} title={event.timeTitle}>{event.time}</time></td>
                    <td>{event.actor}</td>
                    <td>{event.action}</td>
                    <td>{event.target}</td>
                    <td><StatusBadge status={event.resultDisplay.tone} label={event.resultDisplay.label} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      {!isLoading && rows.length === 0 && (
        <p className="platform-audit-empty">No audit events yet.</p>
      )}
    </section>
  );
}
