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
import { useConnections } from '../hooks/useConnections.js';
import { usePreviewConnection } from '../hooks/usePreviewConnection.js';
import { useCreateConnection } from '../hooks/useCreateConnection.js';
import { useConnectionActions } from '../hooks/useConnectionActions.js';
import '../styles/company-files.css';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function CompanyFilesPage() {
  const { user } = useLayoutUser();
  const companyName = user?.company_name || user?.companyName || 'your company';

  const { data, isLoading, isError, error, refetch } = useCompanyFiles();
  const deleteMutation = useDeleteFile();
  const replaceMutation = useReplaceFile();

  const { data: connsData } = useConnections();
  const previewMutation = usePreviewConnection();
  const createConnMutation = useCreateConnection();
  const { accept, dismiss, refresh, remove } = useConnectionActions();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [replaceTarget, setReplaceTarget] = useState(null);
  const [replaceFile, setReplaceFile] = useState(null);
  const [replaceResult, setReplaceResult] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [toast, setToast] = useState(null);

  const [isAddConnectionOpen, setIsAddConnectionOpen] = useState(false);
  const [deleteConnTarget, setDeleteConnTarget] = useState(null);
  const [fromFileId, setFromFileId] = useState('');
  const [fromCol, setFromCol] = useState('');
  const [toFileId, setToFileId] = useState('');
  const [toCol, setToCol] = useState('');
  const [previewResult, setPreviewResult] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [createConnError, setCreateConnError] = useState(null);

  const summary = data?.summary || { files: 0, total_rows: 0, last_upload: null, limit: 10 };
  const files = data?.files || [];
  const connections = connsData?.connections || [];
  const isAtLimit = summary.files >= summary.limit;

  const handleOpenAddConnection = () => {
    setIsAddConnectionOpen(true);
    const firstF = files[0] || null;
    setFromFileId(firstF?.id || '');
    const firstNonHiddenLeft = (firstF?.columns || []).find((c) => !c.hidden)?.key || '';
    setFromCol(firstNonHiddenLeft);

    const defaultRight = files.find((f) => f.id !== firstF?.id) || firstF || null;
    setToFileId(defaultRight?.id || '');
    const firstNonHiddenRight = (defaultRight?.columns || []).find((c) => !c.hidden)?.key || '';
    setToCol(firstNonHiddenRight);

    setPreviewResult(null);
    setPreviewError(null);
    setCreateConnError(null);
  };

  const handleCheckConnection = async () => {
    setPreviewError(null);
    setPreviewResult(null);
    try {
      const res = await previewMutation.mutateAsync({
        left_file_id: fromFileId,
        left_key: fromCol,
        right_file_id: toFileId,
        right_key: toCol,
      });
      setPreviewResult(res);
    } catch (err) {
      setPreviewError(mapApiError(err));
    }
  };

  const handleSaveConnection = async (e) => {
    e.preventDefault();
    if (!previewResult || !previewResult.ok) return;
    setCreateConnError(null);
    try {
      const fromF = files.find((f) => f.id === fromFileId);
      const toF = files.find((f) => f.id === toFileId);
      const name = `${fromF?.name || 'File 1'} → ${toF?.name || 'File 2'}`;
      await createConnMutation.mutateAsync({
        left_file_id: fromFileId,
        left_key: fromCol,
        right_file_id: toFileId,
        right_key: toCol,
        name,
      });
      setIsAddConnectionOpen(false);
      setToast('Connection created successfully');
    } catch (err) {
      setCreateConnError(mapApiError(err));
    }
  };

  const handleDeleteConnConfirm = async () => {
    if (!deleteConnTarget) return;
    try {
      await remove.mutateAsync(deleteConnTarget.id);
      setToast('Connection deleted');
      setDeleteConnTarget(null);
    } catch (err) {
      setActionError(mapApiError(err));
    }
  };

  const getConnectionStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') {
      return <span className="connections__badge connections__badge--active">Active</span>;
    }
    if (s === 'refreshing') {
      return <span className="connections__badge connections__badge--refreshing">Refreshing</span>;
    }
    if (s === 'needs_attention') {
      return <span className="connections__badge connections__badge--needs-attention">Needs attention</span>;
    }
    return <span className="connections__badge connections__badge--suggested">Suggested</span>;
  };

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

          {/* Connections Section */}
          <section className="connections-section" aria-labelledby="connections-heading">
            <header className="connections-header">
              <div>
                <h2 id="connections-heading">Connections</h2>
                <p>Connect files that share a column so the chatbot can answer questions that use both.</p>
              </div>
              <button
                type="button"
                className="button company-files__add-btn"
                onClick={handleOpenAddConnection}
                disabled={files.length < 2}
                title={files.length < 2 ? 'Need at least 2 files to connect' : 'Add connection'}
              >
                Add connection
              </button>
            </header>

            {connections.length === 0 ? (
              <EmptyState title="No connections yet.">
                Connect files that share a column so the chatbot can answer questions that use both.
              </EmptyState>
            ) : (
              <div className="company-files-table-container">
                <table className="company-files-table">
                  <thead>
                    <tr>
                      <th>CONNECTION</th>
                      <th>LINKED THROUGH</th>
                      <th>MATCH</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {connections.map((conn) => {
                      const connName = conn.name || `${conn.left?.file_name || 'File'} → ${conn.right?.file_name || 'File'}`;
                      const linkedThrough = `${conn.left?.key || ''} = ${conn.right?.key || ''}`;
                      const matchPct = Math.round((conn.match_rate || 0) * 100);
                      const isSuggested = (conn.status || '').toLowerCase() === 'suggested';
                      return (
                        <tr key={conn.id}>
                          <td className="company-files__file-name">{connName}</td>
                          <td>{linkedThrough}</td>
                          <td>{matchPct}%</td>
                          <td>{getConnectionStatusBadge(conn.status)}</td>
                          <td>
                            <div className="company-files__actions">
                              {isSuggested ? (
                                <>
                                  <button
                                    type="button"
                                    className="company-files__action-btn"
                                    onClick={() => accept.mutate(conn.id)}
                                    disabled={accept.isPending}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    className="company-files__action-btn company-files__action-btn--delete"
                                    onClick={() => dismiss.mutate(conn.id)}
                                    disabled={dismiss.isPending}
                                  >
                                    Dismiss
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="company-files__action-btn"
                                    onClick={() => refresh.mutate(conn.id)}
                                    disabled={refresh.isPending}
                                  >
                                    Refresh
                                  </button>
                                  <button
                                    type="button"
                                    className="company-files__action-btn company-files__action-btn--delete"
                                    onClick={() => setDeleteConnTarget(conn)}
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
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

      {/* Add Connection Modal */}
      {isAddConnectionOpen && (
        <div className="company-files-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="add-connection-title">
          <div className="company-files-modal" style={{ maxWidth: '520px' }}>
            <h2 id="add-connection-title">Add connection</h2>
            <form onSubmit={handleSaveConnection}>
              <div className="connections-form-row">
                <label htmlFor="from-file-select">The file with many rows, for example Orders</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <select
                    id="from-file-select"
                    value={fromFileId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setFromFileId(newId);
                      const fObj = files.find((f) => f.id === newId);
                      const nonHidden = (fObj?.columns || []).filter((c) => !c.hidden);
                      setFromCol(nonHidden[0]?.key || '');
                      setPreviewResult(null);
                      setPreviewError(null);
                    }}
                    aria-label="From file"
                  >
                    {files.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  <select
                    id="from-column-select"
                    value={fromCol}
                    onChange={(e) => {
                      setFromCol(e.target.value);
                      setPreviewResult(null);
                      setPreviewError(null);
                    }}
                    aria-label="From column"
                  >
                    {(files.find((f) => f.id === fromFileId)?.columns || [])
                      .filter((c) => !c.hidden)
                      .map((c) => (
                        <option key={c.key} value={c.key}>{c.label || c.key}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="connections-form-row">
                <label htmlFor="to-file-select">The file with one row per value, for example Customers</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <select
                    id="to-file-select"
                    value={toFileId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setToFileId(newId);
                      const fObj = files.find((f) => f.id === newId);
                      const nonHidden = (fObj?.columns || []).filter((c) => !c.hidden);
                      setToCol(nonHidden[0]?.key || '');
                      setPreviewResult(null);
                      setPreviewError(null);
                    }}
                    aria-label="To file"
                  >
                    {files.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  <select
                    id="to-column-select"
                    value={toCol}
                    onChange={(e) => {
                      setToCol(e.target.value);
                      setPreviewResult(null);
                      setPreviewError(null);
                    }}
                    aria-label="To column"
                  >
                    {(files.find((f) => f.id === toFileId)?.columns || [])
                      .filter((c) => !c.hidden)
                      .map((c) => (
                        <option key={c.key} value={c.key}>{c.label || c.key}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div style={{ margin: '14px 0' }}>
                <button
                  type="button"
                  className="company-files-btn-secondary"
                  onClick={handleCheckConnection}
                  disabled={!fromFileId || !toFileId || !fromCol || !toCol || previewMutation.isPending}
                  style={{ minHeight: '44px', width: '100%' }}
                >
                  {previewMutation.isPending ? 'Checking...' : 'Check connection'}
                </button>
              </div>

              {previewResult && (
                <div>
                  {previewResult.right_unique === false ? (
                    <div className="connections-box connections-box--danger" role="alert">
                      {toCol} has duplicate values, so it cannot be used as the &apos;one&apos; side
                    </div>
                  ) : (
                    <>
                      <div className="connections-box connections-box--info">
                        Match percentage: {Math.round(previewResult.match_rate * 100)}% ({previewResult.matched} of {previewResult.left_rows} rows matched)
                        {previewResult.unmatched_samples && previewResult.unmatched_samples.length > 0 && (
                          <div style={{ marginTop: '4px', fontSize: '12px' }}>
                            Unmatched samples: {previewResult.unmatched_samples.slice(0, 5).join(', ')}
                          </div>
                        )}
                      </div>
                      {(previewResult.warning || previewResult.match_rate < 0.9) && (
                        <div className="connections-box connections-box--warning" role="alert">
                          Warning: match rate is below 90% ({Math.round(previewResult.match_rate * 100)}%). Some rows will not link.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {previewError && (
                <div className="connections-box connections-box--danger" role="alert">
                  {typeof previewError === 'string' && previewError.toLowerCase().includes('duplicate') ? (
                    `${toCol} has duplicate values, so it cannot be used as the 'one' side`
                  ) : (
                    previewError
                  )}
                </div>
              )}

              {createConnError && <ErrorBanner>{createConnError}</ErrorBanner>}

              <div className="company-files-modal__actions">
                <button
                  type="button"
                  className="company-files-btn-secondary"
                  onClick={() => setIsAddConnectionOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="company-files-btn-primary"
                  disabled={!previewResult?.ok || createConnMutation.isPending}
                >
                  {createConnMutation.isPending ? 'Saving...' : 'Save connection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Connection Confirmation Modal */}
      {deleteConnTarget && (
        <div className="company-files-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-conn-title">
          <div className="company-files-modal">
            <h2 id="delete-conn-title">Delete this connection?</h2>
            <p>
              Delete this connection? The chatbot will stop answering questions that use both files.
            </p>
            <div className="company-files-modal__actions">
              <button
                type="button"
                className="company-files-btn-secondary"
                onClick={() => setDeleteConnTarget(null)}
                disabled={remove.isPending}
              >
                Keep connection
              </button>
              <button
                type="button"
                className="company-files-btn-danger"
                onClick={handleDeleteConnConfirm}
                disabled={remove.isPending}
              >
                {remove.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
