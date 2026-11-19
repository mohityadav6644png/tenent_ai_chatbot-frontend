import { formatNumber } from '../../../shared/utils/formatNumber.js';

export function formatFileSize(bytes) {
  if (bytes == null || isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SelectedFileBox({ file, preview, onReplace }) {
  if (!file) return null;

  const sizeStr = formatFileSize(file.size);
  const subtitle =
    preview && preview.totalRows != null
      ? `${formatNumber(preview.totalRows)} rows · ${sizeStr}`
      : sizeStr;

  return (
    <div className="import-field-group">
      <span className="import-field-label">File</span>
      <div className="import-file-box">
        <div className="import-file-box__info">
          <span className="import-file-box__name">{file.name}</span>
          <span className="import-file-box__meta">{subtitle}</span>
        </div>
        <button
          type="button"
          className="import-file-box__replace-btn"
          onClick={onReplace}
        >
          Replace file
        </button>
      </div>
    </div>
  );
}
