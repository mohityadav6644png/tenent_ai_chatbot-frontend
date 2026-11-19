export function RequiredColumnsCard({ dataset, onDownloadTemplate }) {
  const label = dataset?.label || 'Dataset';
  const recordLabel = dataset?.recordLabel || 'record';
  const requiredColumns = dataset?.requiredColumns || [];

  return (
    <aside className="import-side-card" aria-labelledby="side-card-required-heading">
      <h2 id="side-card-required-heading" className="import-side-card__heading">
        Required columns
      </h2>
      <p className="import-side-card__text">
        {label} need these columns in the first row of your file.
      </p>

      <div className="import-chips-container">
        {requiredColumns.map((col) => (
          <code key={col} className="import-column-chip">
            {col}
          </code>
        ))}
      </div>

      <h2 className="import-side-card__heading import-side-card__heading--tips">
        Tips
      </h2>
      <p className="import-side-card__text">
        Use dates like 2026-05-01. Use one row per {recordLabel}. Save the file as CSV (UTF-8).
      </p>

      <button
        type="button"
        className="import-template-download-btn"
        onClick={onDownloadTemplate}
      >
        Download template
      </button>
    </aside>
  );
}
