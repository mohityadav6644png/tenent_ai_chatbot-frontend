function csvCell(value) {
  const text = value == null
    ? ''
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

export function toCsv(columns, rows) {
  const header = columns.map((column) => csvCell(column.name)).join(',');
  const body = rows.map((row) => row.map(csvCell).join(','));
  return [header, ...body].join('\r\n');
}

export function downloadCsv(columns, rows, filename = 'company-data.csv') {
  const blob = new Blob([toCsv(columns, rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
