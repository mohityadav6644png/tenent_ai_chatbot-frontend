import { useState, useRef } from 'react';
import { TextField } from '../../../shared/components/TextField.jsx';
import { Button } from '../../../shared/components/Button.jsx';
import { useImportCompanyCsv } from '../hooks/useImportCompanyCsv.js';
import { mapCsvImportError, readCsvHeaderRow, autoDetectCsvColumns } from '../mappers/errorMapper.js';

export function formatFileSize(bytes) {
  if (bytes == null || isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file) {
  if (!file) return 'Please choose a file.';
  const name = file.name || '';
  if (!name.toLowerCase().endsWith('.csv')) {
    return 'Please choose a CSV file (.csv).';
  }
  if (file.size === 0) {
    return 'The chosen file is empty. Please choose a non-empty CSV file.';
  }
  if (file.size > 5 * 1024 * 1024) {
    return 'File exceeds the 5 MB limit. Please choose a smaller file.';
  }
  return null;
}

export function ImportCsvCard() {
  const [file, setFile] = useState(null);
  const [titleColumn, setTitleColumn] = useState('');
  const [contentColumn, setContentColumn] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [availableHeaders, setAvailableHeaders] = useState([]);

  const fileInputRef = useRef(null);
  const mutation = useImportCompanyCsv();

  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;
    setErrorMessage('');
    setSuccessMessage('');
    setFile(selectedFile);
    setAvailableHeaders([]);

    const clientError = validateFile(selectedFile);
    if (clientError) {
      setErrorMessage(clientError);
      return;
    }

    try {
      const headers = await readCsvHeaderRow(selectedFile);
      if (headers && headers.length > 0) {
        setAvailableHeaders(headers);
      }
    } catch {
      // ignore
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDropzoneKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleReplaceFile = () => {
    setErrorMessage('');
    setSuccessMessage('');
    setAvailableHeaders([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!file) {
      setErrorMessage('Please select a CSV file first.');
      return;
    }

    const clientError = validateFile(file);
    if (clientError) {
      setErrorMessage(clientError);
      return;
    }

    try {
      const response = await mutation.mutateAsync({
        file,
        titleColumn: titleColumn.trim() || undefined,
        contentColumn: contentColumn.trim() || undefined,
      });

      const count =
        response.imported_count ??
        response.total_records_imported ??
        response.records_count ??
        0;

      setSuccessMessage(`${count} records imported.`);
      setFile(null);
      setTitleColumn('');
      setContentColumn('');
      setErrorMessage('');
      setAvailableHeaders([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const { message, foundHeaders, isMissingColumns } = await mapCsvImportError(err, file);
      setErrorMessage(message);

      if (isMissingColumns && foundHeaders.length > 0) {
        setTitleColumn(foundHeaders[0] || '');
        setContentColumn(foundHeaders[1] || '');
      }
    }
  };

  return (
    <section className="company-data-card" aria-labelledby="import-csv-heading">
      <h2 id="import-csv-heading" className="company-data-card__title">
        Import from CSV
      </h2>
      <p className="company-data-card__sub">
        Add many records at once. Your file needs a title column and a content column.
      </p>

      {successMessage && (
        <div className="company-data-banner company-data-banner--success" role="status">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div
          id="csv-import-error"
          className="company-data-banner company-data-banner--error"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <form className="company-data-form" onSubmit={handleSubmit} noValidate>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="visually-hidden"
          data-testid="csv-file-input"
          id="csv-file-input"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) handleFileChange(selected);
          }}
        />

        {!file ? (
          <div
            className={`company-data-dropzone${isDragging ? ' is-dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            tabIndex={0}
            role="button"
            aria-label="Upload CSV file. Drop file here or press Enter to choose file"
            onKeyDown={handleDropzoneKeyDown}
            onClick={() => fileInputRef.current?.click()}
          >
            <p className="company-data-dropzone__main-text">Drop a CSV file here</p>
            <p className="company-data-dropzone__sub-text">or choose a file from your computer</p>
            <button
              type="button"
              className="company-data-dropzone__btn"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Choose file
            </button>
          </div>
        ) : (
          <div className="company-data-file-box">
            <div className="company-data-file-box__info">
              <span className="company-data-file-box__name">{file.name}</span>
              <span className="company-data-file-box__size">{formatFileSize(file.size)}</span>
            </div>
            <button
              type="button"
              className="company-data-replace-btn"
              onClick={handleReplaceFile}
            >
              Replace file
            </button>
          </div>
        )}

        <div className="company-data-columns-row">
          <TextField
            id="import-title-column"
            label="Title column"
            placeholder="Auto-detect"
            value={titleColumn}
            list="csv-headers-list"
            onChange={(e) => {
              if (successMessage) setSuccessMessage('');
              setTitleColumn(e.target.value);
            }}
            aria-describedby={
              errorMessage ? 'columns-hint csv-import-error' : 'columns-hint'
            }
          />
          <TextField
            id="import-content-column"
            label="Content column"
            placeholder="Auto-detect"
            value={contentColumn}
            list="csv-headers-list"
            onChange={(e) => {
              if (successMessage) setSuccessMessage('');
              setContentColumn(e.target.value);
            }}
            aria-describedby={
              errorMessage ? 'columns-hint csv-import-error' : 'columns-hint'
            }
          />
        </div>

        <datalist id="csv-headers-list">
          {availableHeaders.map((h) => (
            <option key={h} value={h} />
          ))}
        </datalist>

        <p id="columns-hint" className="company-data-hint">
          Leave both empty to auto-detect names like Document Title, title, Body Content, or content.
        </p>

        <div className="company-data-form__actions">
          <Button
            type="submit"
            className="company-data-btn"
            disabled={!file || mutation.isPending}
          >
            {mutation.isPending ? 'Importing...' : 'Import records'}
          </Button>
        </div>
      </form>
    </section>
  );
}
