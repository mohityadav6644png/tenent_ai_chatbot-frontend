import { formatNumber } from '../../../shared/utils/formatNumber.js';
import { Spinner } from '../../../shared/components/Spinner.jsx';

function formatCellValue(val) {
  if (val == null) return '';
  if (typeof val === 'number') {
    return formatNumber(val);
  }
  return String(val);
}

export function ImportPreviewTable({ hasFile, isLoading, preview }) {
  const sampleRows = preview?.sampleRows || [];
  const columns =
    sampleRows.length > 0
      ? Object.keys(sampleRows[0])
      : preview?.requiredColumns || [];

  return (
    <div className="import-field-group">
      <span className="import-field-label">Preview</span>
      <div className="import-preview-container">
        {isLoading ? (
          <div className="import-preview-spinner">
            <Spinner label="Loading preview..." />
          </div>
        ) : !hasFile ? (
          <div className="import-preview-empty">Choose a file to see a preview.</div>
        ) : sampleRows.length === 0 ? (
          <div className="import-preview-empty">No preview rows available.</div>
        ) : (
          <div className="import-preview-scroll">
            <table className="import-preview-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col} scope="col" className="import-preview-th">
                      {col.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleRows.slice(0, 5).map((row, rowIndex) => (
                  <tr key={rowIndex} className="import-preview-tr">
                    {columns.map((col) => (
                      <td key={col} className="import-preview-td">
                        {formatCellValue(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
