export function escapeCsvCell(val) {
  if (val == null) return '""';
  let str = String(val);
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export function buildErrorReportCsv(errors = []) {
  const header = ['row', 'column', 'reason'].map(escapeCsvCell).join(',');
  const rows = errors.map((err) => {
    return [
      escapeCsvCell(err.row ?? ''),
      escapeCsvCell(err.column ?? ''),
      escapeCsvCell(err.reason ?? ''),
    ].join(',');
  });
  return [header, ...rows].join('\r\n');
}

export function triggerCsvDownload(filename, content) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
