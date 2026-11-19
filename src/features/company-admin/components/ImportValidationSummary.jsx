import { buildErrorReportCsv, triggerCsvDownload } from '../services/buildErrorReportCsv.js';

export function ImportValidationSummary({ preview, datasetKey }) {
  if (!preview) return null;

  const { validRows, invalidRows, missingColumns, unknownColumns, errors } = preview;

  const handleDownloadErrors = (e) => {
    e.preventDefault();
    const csv = buildErrorReportCsv(errors);
    triggerCsvDownload(`${datasetKey || 'dataset'}_errors.csv`, csv);
  };

  const isCapped = errors.length > 0 && invalidRows > errors.length;
  const downloadLinkText = isCapped
    ? `Download error report (first ${errors.length} problems)`
    : 'Download error report';

  return (
    <div className="import-validation-summary">
      {missingColumns.length > 0 && (
        <div className="import-summary-box import-summary-box--missing" role="alert">
          Your file is missing these columns: {missingColumns.join(', ')}.
        </div>
      )}

      {missingColumns.length === 0 && (
        <div className="import-summary-box import-summary-box--ready" role="status">
          <span>
            {validRows} rows are ready. {invalidRows} rows have problems and will be skipped.{' '}
          </span>
          {invalidRows > 0 && (
            <button
              type="button"
              className="import-error-report-btn"
              onClick={handleDownloadErrors}
            >
              {downloadLinkText}
            </button>
          )}
        </div>
      )}

      {unknownColumns.length > 0 && (
        <p className="import-unknown-columns-note">
          These columns will be ignored: {unknownColumns.join(', ')}.
        </p>
      )}
    </div>
  );
}
