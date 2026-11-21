import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.constants.js';
import { ErrorBanner } from '../../../shared/components/ErrorBanner.jsx';
import { Spinner } from '../../../shared/components/Spinner.jsx';
import { formatNumber } from '../../../shared/utils/formatNumber.js';
import { formatRelativeTime } from '../../../shared/utils/formatRelativeTime.js';
import { mapApiError } from '../../../api/errorMapper.js';
import { useCompanyFile } from '../hooks/useCompanyFile.js';
import { useUpdateFile } from '../hooks/useUpdateFile.js';
import '../styles/company-files.css';

function mapTypeName(type) {
  switch (type) {
    case 'number': return 'Number';
    case 'date': return 'Date';
    case 'boolean': return 'Yes-No';
    default: return 'Text';
  }
}

export function EditFilePage() {
  const { fileId } = useParams();
  const navigate = useNavigate();

  const { data: fileData, isLoading, isError, error } = useCompanyFile(fileId);
  const updateMutation = useUpdateFile();

  const [fileName, setFileName] = useState('');
  const [nameError, setNameError] = useState(null);
  const [uploadMode, setUploadMode] = useState('replace');
  const [description, setDescription] = useState('');
  const [columns, setColumns] = useState([]);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (fileData) {
      setFileName(fileData.name || '');
      setUploadMode(fileData.upload_mode || 'replace');
      setDescription(fileData.description || '');
      setColumns(
        (fileData.columns || []).map((col) => ({
          key: col.key,
          label: col.label || col.key,
          type: col.type,
          example: col.example,
          meaning: col.meaning || '',
          hidden: Boolean(col.hidden),
        })),
      );
    }
  }, [fileData]);

  const handleColumnMeaningChange = (key, meaning) => {
    setColumns((prev) =>
      prev.map((col) => (col.key === key ? { ...col, meaning } : col)),
    );
  };

  const handleColumnHiddenChange = (key, hidden) => {
    setColumns((prev) =>
      prev.map((col) => (col.key === key ? { ...col, hidden } : col)),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNameError(null);
    setFormError(null);

    if (!fileName || fileName.trim().length < 2 || fileName.trim().length > 60) {
      setNameError('File name must be between 2 and 60 characters.');
      return;
    }
    if (!description || description.trim().length < 5 || description.trim().length > 500) {
      setFormError('Description must be between 5 and 500 characters.');
      return;
    }

    const updates = {
      name: fileName.trim(),
      description: description.trim(),
      upload_mode: uploadMode,
      columns: columns.map((col) => ({
        key: col.key,
        meaning: col.meaning ? col.meaning.trim() : undefined,
        hidden: col.hidden,
      })),
    };

    try {
      await updateMutation.mutateAsync({ id: fileId, updates });
      navigate(ROUTES.COMPANY_DATA, { state: { toast: `${updates.name} updated` } });
    } catch (err) {
      if (err?.code === 'FILE_EXISTS' || err?.message?.includes('FILE_EXISTS')) {
        setNameError('A file with this name already exists.');
      } else {
        setFormError(mapApiError(err));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="company-files-page" style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spinner size="large" />
        <p style={{ marginTop: '12px', color: '#6B7280' }}>Loading file details...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="company-files-page">
        <ErrorBanner>{mapApiError(error)}</ErrorBanner>
        <div style={{ marginTop: '16px' }}>
          <Link to={ROUTES.COMPANY_DATA} className="company-files-btn-secondary">
            Back to company files
          </Link>
        </div>
      </div>
    );
  }

  const isFormValid =
    fileName.trim().length >= 2 &&
    fileName.trim().length <= 60 &&
    description.trim().length >= 5 &&
    description.trim().length <= 500;

  return (
    <div className="company-files-page">
      <header className="company-files-header">
        <div>
          <h1>Edit file</h1>
          <p>
            {formatNumber(fileData?.row_count || 0)} rows · updated {formatRelativeTime(fileData?.updated_at)}
          </p>
        </div>
      </header>

      <div className="company-files-form-layout">
        <section className="company-files-card">
          <form onSubmit={handleSubmit} noValidate>
            {/* 1. File Name & Upload Mode */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label htmlFor="file-name-input" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                  File name
                </label>
                <input
                  id="file-name-input"
                  type="text"
                  value={fileName}
                  maxLength={60}
                  style={{ width: '100%', padding: '10px 12px', border: nameError ? '1px solid #DC2626' : '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', minHeight: '44px' }}
                  onChange={(e) => {
                    setFileName(e.target.value);
                    setNameError(null);
                  }}
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={nameError ? 'file-name-error' : undefined}
                />
                {nameError && (
                  <span id="file-name-error" style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {nameError}
                  </span>
                )}
              </div>

              <div>
                <label htmlFor="upload-mode-select" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                  When you upload this file again
                </label>
                <select
                  id="upload-mode-select"
                  value={uploadMode}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', minHeight: '44px', background: '#FFFFFF' }}
                  onChange={(e) => setUploadMode(e.target.value)}
                >
                  <option value="replace">Replace all rows</option>
                  <option value="append">Add new rows only</option>
                </select>
              </div>
            </div>

            {/* 2. Description Textarea */}
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="file-description-input" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                What is in this file?
              </label>
              <textarea
                id="file-description-input"
                rows={3}
                value={description}
                maxLength={500}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', lineHeight: 1.5 }}
                onChange={(e) => setDescription(e.target.value)}
              />
              <span style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginTop: '4px' }}>
                {description.length}/500 characters (minimum 5)
              </span>
            </div>

            {/* 3. Columns Table */}
            {columns.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
                  Columns ({columns.length})
                </label>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflowX: 'auto' }}>
                  <table className="company-files-columns-table">
                    <thead>
                      <tr>
                        <th>COLUMN</th>
                        <th>TYPE</th>
                        <th>EXAMPLE</th>
                        <th>MEANING</th>
                        <th style={{ textAlign: 'center' }}>HIDE FROM CHATBOT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns.map((col) => (
                        <tr key={col.key}>
                          <td>
                            <code>{col.key}</code>
                          </td>
                          <td>{mapTypeName(col.type)}</td>
                          <td style={{ color: '#6B7280', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {col.example !== null && col.example !== undefined ? String(col.example) : '-'}
                          </td>
                          <td>
                            <input
                              type="text"
                              maxLength={120}
                              value={col.meaning}
                              placeholder="Optional description"
                              aria-label={`Meaning of ${col.label || col.key}`}
                              onChange={(e) => handleColumnMeaningChange(col.key, e.target.value)}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={col.hidden}
                              aria-label={`Hide ${col.label || col.key} from the chatbot`}
                              onChange={(e) => handleColumnHiddenChange(col.key, e.target.checked)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {formError && (
              <div style={{ marginBottom: '20px' }}>
                <ErrorBanner>{formError}</ErrorBanner>
              </div>
            )}

            {/* 4. Form Actions */}
            <div className="company-files-form-actions">
              <button
                type="submit"
                className="company-files-btn-primary"
                disabled={!isFormValid || updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save changes'}
              </button>
              <Link to={ROUTES.COMPANY_DATA} className="company-files-btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </section>

        {/* Side Card */}
        <aside className="company-files-side-card" aria-labelledby="side-card-heading">
          <h2 id="side-card-heading">How it works</h2>
          <p>
            The chatbot reads your column names, types, and a few example values. A short meaning for each column makes its answers more accurate.
          </p>

          <h2>Hidden columns</h2>
          <p>
            Hidden columns are stored, but the chatbot never reads or shows them. Hide phone numbers, emails, and anything private.
          </p>
        </aside>
      </div>
    </div>
  );
}
