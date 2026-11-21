import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.constants.js';
import { EmptyState } from '../../../shared/components/EmptyState.jsx';
import { ErrorBanner } from '../../../shared/components/ErrorBanner.jsx';
import { StatCard } from '../../../shared/components/StatCard.jsx';
import { useLayoutUser } from '../../../shared/hooks/useLayoutUser.js';
import { formatNumber } from '../../../shared/utils/formatNumber.js';
import { formatRelativeTime } from '../../../shared/utils/formatRelativeTime.js';
import { mapApiError } from '../../../api/errorMapper.js';
import { useCompanyFiles } from '../hooks/useCompanyFiles.js';
import { useDeleteFile } from '../hooks/useDeleteFile.js';
import { useReplaceFile } from '../hooks/useReplaceFile.js';
import '../styles/company-files.css';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function CompanyFilesPage() {
  const { user } = useLayoutUser();
  const companyName = user?.company_name || user?.companyName || 'your company';

  const { data, isLoading, isError, error, refetch } = useCompanyFiles();
  const deleteMutation = useDeleteFile();
  const replaceMutation = useReplaceFile();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [replaceTarget, setReplaceTarget] = useState(null);
  const [replaceFile, setReplaceFile] = useState(null);
  const [replaceResult, setReplaceResult] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [toast, setToast] = useState(null);

  const summary = data?.summary || { files: 0, total_rows: 0, last_upload: null, limit: 10 };
  const files = data?.files || [];
  const isAtLimit = summary.files >= summary.limit;

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setToast(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
    } catch (err) {
      setActionError(mapApiError(err));
    }
  };

  const handleReplaceSubmit = async (e) => {
    e.preventDefault();
    if (!replaceTarget || !replaceFile) return;
    setActionError(null);
    setReplaceResult(null);

    if (!replaceFile.name.toLowerCase().endsWith('.csv')) {
      setActionError('Please upload a valid .csv file.');
      return;
    }
    if (replaceFile.size > 5 * 1024 * 1024) {
      setActionError('File size exceeds 5 MB limit.');
      return;
    }

    try {
      const res = await replaceMutation.mutateAsync({ id: replaceTarget.id, file: replaceFile });
      setReplaceResult(res);
      setToast(`${replaceTarget.name} replaced successfully`);
    } catch (err) {
      setActionError(mapApiError(err));
    }
  };

  const getStatusBadge = (file) => {
    const isOld = file.updated_at && (Date.now() - new Date(file.updated_at).getTime() > THIRTY_DAYS_MS);
    if (file.status === 'ready' && isOld) {
      return <span className="company-files__status-badge company-files__status--needs-update">Needs update after 30 days</span>;
    }
    if (file.status === 'ready') {
      return <span className="company-files__status-badge company-files__status--ready">Ready</span>;
    }
    if (file.status === 'processing') {
      return <span className="company-files__status-badge company-files__status--processing">Processing</span>;
    }
    return <span className="company-files__status-badge company-files__status--failed">Failed</span>;
  };

  return (
    <div className="company-files-page">
      <header className="company-files-header">
        <div>
          <h1>Company data</h1>
          <p>Upload your own CSV files and tell the chatbot what each file is about.</p>
        </div>
        <Link
          to={isAtLimit ? '#' : ROUTES.COMPANY_DATA_NEW}
          className={`button company-files__add-btn${isAtLimit ? ' is-disabled' : ''}`}
          aria-disabled={isAtLimit}
          title={isAtLimit ? `File limit reached (${summary.limit} files maximum)` : 'Add a new file'}
          onClick={(e) => {
            if (isAtLimit) e.preventDefault();
          }}
        >
          Add file
        </Link>
      </header>

      <div className="company-files__note" role="note">
        Only {companyName} can see these files. The chatbot answers only from your company&apos;s data.
      </div>

      {toast && (
        <div className="company-files-toast" role="status">
          <span>{toast}</span>
          <button
            type="button"
            className="company-files__action-btn"
            style={{ color: '#FFFFFF' }}
            onClick={() => setToast(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {actionError && <ErrorBanner>{actionError}</ErrorBanner>}

      {isError ? (
        <div>
          <ErrorBanner>{mapApiError(error)}</ErrorBanner>
          <button
            type="button"
            className="company-files-btn-secondary"
            style={{ marginTop: '12px' }}
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <section className="company-files-stats" aria-label="Company files summary">
            <StatCard label="Files" value={`${summary.files} of ${summary.limit}`} />
            <StatCard label="Total rows" value={formatNumber(summary.total_rows || 0)} />
            <StatCard label="Last upload" value={summary.last_upload ? formatRelativeTime(summary.last_upload) : 'Never'} />
          </section>

          {isLoading ? (
            <div className="company-files-table-container" style={{ padding: '32px', textAlign: 'center' }}>
              <p>Loading files...</p>
            </div>
          ) : files.length === 0 ? (
            <EmptyState title="No files yet.">Add your first CSV file.</EmptyState>
          ) : (
            <div className="company-files-table-container">
              <table className="company-files-table">
                <thead>
                  <tr>
                    <th>FILE</th>
                    <th>WHAT IT IS ABOUT</th>
                    <th>ROWS</th>
                    <th>UPDATED</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => {
                    const hiddenCount = file.hidden_columns_count || 0;
                    return (
                      <tr key={file.id}>
                        <td className="company-files__file-name">{file.name}</td>
                        <td>
                          <div className="company-files__desc-cell">
                            <span className="company-files__description">{file.description}</span>
                            {hiddenCount > 0 && (
                              <span className="company-files__hidden-tag">
                                {hiddenCount} {hiddenCount === 1 ? 'column' : 'columns'} hidden
                              </span>
                            )}
                          </div>
                        </td>
                        <td>{formatNumber(file.rows || 0)}</td>
                        <td>{formatRelativeTime(file.updated_at)}</td>
                        <td>{getStatusBadge(file)}</td>
                        <td>
                          <div className="company-files__actions">
                            <button
                              type="button"
                              className="company-files__action-btn"
                              onClick={() => {
                                setReplaceTarget(file);
                                setReplaceFile(null);
                                setReplaceResult(null);
                                setActionError(null);
                              }}
                            >
                              Replace file
                            </button>
                            <Link to={`/admin/company-data/${file.id}/edit`} className="company-files__action-btn">
                              Edit
                            </Link>
                            <button
                              type="button"
                              className="company-files__action-btn company-files__action-btn--delete"
                              onClick={() => {
                                setDeleteTarget(file);
                                setActionError(null);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="company-files-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-file-title">
          <div className="company-files-modal">
            <h2 id="delete-file-title">Delete {deleteTarget.name}?</h2>
            <p>
              Delete {deleteTarget.name}? Its {deleteTarget.rows} rows will be removed and the chatbot will stop answering from it. This can&apos;t be undone.
            </p>
            <div className="company-files-modal__actions">
              <button
                type="button"
                className="company-files-btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
              >
                Keep file
              </button>
              <button
                type="button"
                className="company-files-btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replace File Modal */}
      {replaceTarget && (
        <div className="company-files-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="replace-file-title">
          <div className="company-files-modal">
            <h2 id="replace-file-title">Replace file for {replaceTarget.name}</h2>
            <p>
              Upload a new CSV file. It must contain all previously configured columns for this file.
            </p>
            {replaceResult ? (
              <div className="company-files-result-box company-files-result-box--success" role="status">
                <div>
                  <strong>Upload complete: </strong>
                  {replaceResult.inserted} rows saved, {replaceResult.skipped} skipped.
                  {replaceResult.errors && replaceResult.errors.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>
                      First errors:
                      <ul>
                        {replaceResult.errors.slice(0, 5).map((err, idx) => (
                          <li key={idx}>
                            Row {err.row}: {err.reason} {err.column ? `(${err.column})` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleReplaceSubmit}>
                <div style={{ margin: '16px 0' }}>
                  <input
                    type="file"
                    accept=".csv"
                    data-testid="replace-file-input"
                    onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
                    aria-label="Choose new CSV file"
                  />
                </div>
                {actionError && <ErrorBanner>{actionError}</ErrorBanner>}
                <div className="company-files-modal__actions">
                  <button
                    type="button"
                    className="company-files-btn-secondary"
                    onClick={() => setReplaceTarget(null)}
                    disabled={replaceMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="company-files-btn-primary"
                    disabled={!replaceFile || replaceMutation.isPending}
                  >
                    {replaceMutation.isPending ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            )}
            {replaceResult && (
              <div className="company-files-modal__actions">
                <button
                  type="button"
                  className="company-files-btn-secondary"
                  onClick={() => setReplaceTarget(null)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
