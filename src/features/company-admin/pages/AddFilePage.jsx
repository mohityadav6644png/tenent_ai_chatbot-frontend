import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.constants.js';
import { ErrorBanner } from '../../../shared/components/ErrorBanner.jsx';
import { Spinner } from '../../../shared/components/Spinner.jsx';
import { formatNumber } from '../../../shared/utils/formatNumber.js';
import { mapApiError } from '../../../api/errorMapper.js';
import { useCompanyFiles } from '../hooks/useCompanyFiles.js';
import { useCreateFile } from '../hooks/useCreateFile.js';
import { usePreviewFile } from '../hooks/usePreviewFile.js';
import '../styles/company-files.css';

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mapTypeName(type) {
  switch (type) {
    case 'number': return 'Number';
    case 'date': return 'Date';
    case 'boolean': return 'Yes-No';
    default: return 'Text';
  }
}

export function AddFilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const { data: filesData } = useCompanyFiles();
  const previewMutation = usePreviewFile();
  const createMutation = useCreateFile();

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [nameError, setNameError] = useState(null);
  const [uploadMode, setUploadMode] = useState('replace');
  const [description, setDescription] = useState('');
  const [columns, setColumns] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [formError, setFormError] = useState(null);

  const summary = filesData?.summary || { files: 0, limit: 10 };

  const handleFileChange = async (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setPreviewError('Only .csv files are supported.');
      setSelectedFile(null);
      return;
    }
    if (file.size === 0) {
      setPreviewError('The selected file is empty.');
      setSelectedFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPreviewError('File size exceeds the 5 MB limit.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setPreviewError(null);
    setFormError(null);
    setNameError(null);

    const baseName = file.name.replace(/\.csv$/i, '').trim();
    setFileName(baseName);

    try {
      const res = await previewMutation.mutateAsync(file);
      setPreviewData(res);
      setColumns(
        (res.columns || []).map((col) => ({
          key: col.key,
          label: col.label,
          type: col.type,
          example: col.example,
          suggested_hidden: Boolean(col.suggested_hidden),
          meaning: '',
          hidden: Boolean(col.suggested_hidden),
        })),
      );
    } catch (err) {
      setPreviewError(mapApiError(err));
      setPreviewData(null);
    }
  };

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

  const downloadErrorReport = () => {
    if (!previewData?.errors || previewData.errors.length === 0) return;
    const header = 'Row,Column,Reason\r\n';
    const lines = previewData.errors.map(
      (e) => `${e.row},"${(e.column || '').replace(/"/g, '""')}","${(e.reason || '').replace(/"/g, '""')}"`,
    );
    const blob = new Blob([header + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName || 'file'}_error_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNameError(null);
    setFormError(null);

    if (!selectedFile) {
      setFormError('Please select a CSV file.');
      return;
    }
    if (!fileName || fileName.trim().length < 2 || fileName.trim().length > 60) {
      setNameError('File name must be between 2 and 60 characters.');
      return;
    }
    if (!description || description.trim().length < 5 || description.trim().length > 500) {
      setFormError('Description must be between 5 and 500 characters.');
      return;
    }
    if (!previewData || previewData.valid_rows <= 0) {
      setFormError('The file has no valid rows to import.');
      return;
    }

    const meta = {
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
      await createMutation.mutateAsync({ file: selectedFile, meta });
      navigate(ROUTES.COMPANY_DATA, { state: { toast: `${meta.name} added` } });
    } catch (err) {
      if (err?.code === 'FILE_EXISTS' || err?.message?.includes('FILE_EXISTS')) {
        setNameError('A file with this name already exists.');
      } else {
        setFormError(mapApiError(err));
      }
    }
  };

  const isFormValid =
    Boolean(selectedFile) &&
    Boolean(previewData) &&
    !previewError &&
    previewData.valid_rows > 0 &&
    fileName.trim().length >= 2 &&
    fileName.trim().length <= 60 &&
    description.trim().length >= 5 &&
    description.trim().length <= 500;

  return (
    <div className="company-files-page">
      <header className="company-files-header">
        <div>
          <h1>Add file</h1>
          <p>Upload a CSV, name it, and tell the chatbot what it contains.</p>
        </div>
      </header>

      <div className="company-files-form-layout">
        {/* Main Form Card */}
        <section className="company-files-card">
          <form onSubmit={handleSubmit} noValidate>
            {/* 1. File Upload / Dropzone */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
                CSV File
              </label>

              {!selectedFile ? (
                <div
                  className="company-files-dropzone"
                  tabIndex={0}
                  role="button"
                  aria-label="Upload CSV file"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      handleFileChange(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <p className="company-files-dropzone__title">Drop a CSV file here</p>
                  <p className="company-files-dropzone__subtitle">or choose a file from your computer</p>
                  <button type="button" className="company-files-dropzone__btn">
                    Choose file
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    data-testid="file-dropzone-input"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                  />
                </div>
              ) : (
                <div className="company-files-file-selected">
                  <div className="company-files-file-selected__info">
                    <span className="company-files-file-selected__name">{selectedFile.name}</span>
                    <span className="company-files-file-selected__meta">
                      {previewData
                        ? `${formatNumber(previewData.total_rows)} rows · ${previewData.columns?.length || 0} columns · ${formatFileSize(selectedFile.size)}`
                        : `${formatFileSize(selectedFile.size)}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="company-files-file-selected__replace"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewData(null);
                      setColumns([]);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    Replace file
                  </button>
                </div>
              )}

              {previewMutation.isPending && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', color: '#0F6B73' }}>
                  <Spinner size="small" />
                  <span>Scanning file structure and checking data types...</span>
                </div>
              )}
            </div>

            {/* 2. File Name & Upload Mode */}
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

            {/* 3. Description Textarea */}
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="file-description-input" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                What is in this file?
              </label>
              <textarea
                id="file-description-input"
                rows={3}
                value={description}
                maxLength={500}
                placeholder="Describe what data this file holds and when the chatbot should use it..."
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', lineHeight: 1.5 }}
                onChange={(e) => setDescription(e.target.value)}
              />
              <span style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginTop: '4px' }}>
                {description.length}/500 characters (minimum 5)
              </span>
            </div>

            {/* 4. Columns Table */}
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
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <input
                                type="checkbox"
                                checked={col.hidden}
                                aria-label={`Hide ${col.label || col.key} from the chatbot`}
                                onChange={(e) => handleColumnHiddenChange(col.key, e.target.checked)}
                              />
                              {col.suggested_hidden && (
                                <span className="company-files__personal-tag">Looks personal</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. Result box */}
            {previewData && (
              <div
                className="company-files-result-box company-files-result-box--success"
                style={{ marginBottom: '20px' }}
                role="status"
              >
                <div>
                  <strong>{formatNumber(previewData.valid_rows)}</strong> rows are ready.
                  {previewData.invalid_rows > 0 && (
                    <span> {formatNumber(previewData.invalid_rows)} rows have problems and will be skipped.</span>
                  )}
                </div>
                {previewData.invalid_rows > 0 && (
                  <button
                    type="button"
                    className="company-files-download-link"
                    onClick={downloadErrorReport}
                  >
                    Download error report
                  </button>
                )}
              </div>
            )}

            {previewError && (
              <div
                className="company-files-result-box company-files-result-box--error"
                style={{ marginBottom: '20px' }}
                role="alert"
              >
                <span>{previewError}</span>
              </div>
            )}

            {formError && (
              <div style={{ marginBottom: '20px' }}>
                <ErrorBanner>{formError}</ErrorBanner>
              </div>
            )}

            {/* 6. Form Actions */}
            <div className="company-files-form-actions">
              <button
                type="submit"
                className="company-files-btn-primary"
                disabled={!isFormValid || createMutation.isPending}
              >
                {createMutation.isPending ? 'Importing...' : 'Import file'}
              </button>
              <Link to={ROUTES.COMPANY_DATA} className="company-files-btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </section>

        {/* 7. Side Card */}
        <aside className="company-files-side-card" aria-labelledby="side-card-heading">
          <h2 id="side-card-heading">How it works</h2>
          <p>
            The chatbot reads your column names, types, and a few example values. A short meaning for each column makes its answers more accurate.
          </p>

          <h2>Hidden columns</h2>
          <p>
            Hidden columns are stored, but the chatbot never reads or shows them. Hide phone numbers, emails, and anything private.
          </p>

          <h2>Files used</h2>
          <p>
            {summary.files} of {summary.limit} files
          </p>

          {previewData?.limits && (
            <>
              <h2>Limits</h2>
              <ul>
                <li>Max file size: {previewData.limits.max_mb} MB</li>
                <li>Max rows: {formatNumber(previewData.limits.max_rows)}</li>
                <li>Max columns: {previewData.limits.max_columns}</li>
              </ul>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
