import { Link } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.constants.js';
import { Button } from '../../../shared/components/Button.jsx';

export function ReportRowActions({ report, disabled, onPause, onResume }) {
  const editPath = `${ROUTES.REPORTS}/${encodeURIComponent(report.id)}/edit`;
  return (
    <div className="reports-row-actions">
      <Link
        className="reports-row-action reports-row-action--primary"
        aria-label={`Edit ${report.name}`}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : undefined}
        to={editPath}
        onClick={(event) => { if (disabled) event.preventDefault(); }}
      >
        Edit
      </Link>
      {report.status === 'active' ? (
        <Button
          className="reports-row-action reports-row-action--danger"
          aria-label={`Pause ${report.name}`}
          disabled={disabled}
          onClick={onPause}
        >
          Pause
        </Button>
      ) : (
        <Button
          className="reports-row-action reports-row-action--primary"
          aria-label={`Resume ${report.name}`}
          disabled={disabled}
          onClick={onResume}
        >
          Resume
        </Button>
      )}
    </div>
  );
}
