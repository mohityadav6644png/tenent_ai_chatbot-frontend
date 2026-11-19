import { formatNumber } from '../../../shared/utils/formatNumber.js';

function isNumericColumn(column, value) {
  return column.type === 'number' || typeof value === 'number';
}

function formatCell(value, numeric) {
  if (value == null || value === '') return '';
  if (numeric && Number.isFinite(Number(value))) return formatNumber(Number(value));
  return String(value);
}

export function ResultTable({ columns = [], rows = [], highlightRows = [] }) {
  if (!columns.length) return null;

  return (
    <div className="result-table-scroll">
      <table className="result-table">
        <thead>
          <tr>{columns.map((column) => <th scope="col" key={column.name}>{column.name}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr className={highlightRows.includes(rowIndex) ? 'result-table__best' : ''} key={rowIndex}>
              {columns.map((column, columnIndex) => {
                const value = row[columnIndex];
                const numeric = isNumericColumn(column, value);
                return (
                  <td className={numeric ? 'result-table__numeric' : ''} key={column.name}>
                    {formatCell(value, numeric)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
