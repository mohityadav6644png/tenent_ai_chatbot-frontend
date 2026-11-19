export function mapImportPreview(raw) {
  if (!raw) return null;
  return {
    totalRows: raw.total_rows ?? 0,
    validRows: raw.valid_rows ?? 0,
    invalidRows: raw.invalid_rows ?? 0,
    requiredColumns: Array.isArray(raw.required_columns) ? raw.required_columns : [],
    missingColumns: Array.isArray(raw.missing_columns) ? raw.missing_columns : [],
    unknownColumns: Array.isArray(raw.unknown_columns) ? raw.unknown_columns : [],
    sampleRows: Array.isArray(raw.sample_rows) ? raw.sample_rows.slice(0, 5) : [],
    errors: Array.isArray(raw.errors) ? raw.errors : [],
  };
}

export function mapImportError(error) {
  if (!error) return '';

  if (error.status === 403) {
    return "You don't have access to this page.";
  }

  if (error.status === 404) {
    return 'The requested dataset was not found.';
  }

  if (error.status === 409 || error.code === 'IMPORT_IN_PROGRESS') {
    return 'An import is already in progress for this dataset. Please wait until it completes.';
  }

  if (error.status === 413) {
    return 'File exceeds the allowed size limit. Please upload a smaller file.';
  }

  if (error.status === 422) {
    return 'Unable to process the file. Please check for formatting errors.';
  }

  if (error.status === 429) {
    const seconds = error.retryAfterSeconds;
    const retryText = seconds ? ` Please try again in ${seconds} seconds.` : ' Please try again later.';
    return `Too many requests.${retryText}`;
  }

  if (error.status === 0 || error.name === 'TypeError' || error.message?.includes('Failed to fetch')) {
    return 'Network error. Please check your connection and retry.';
  }

  if (error.status === 400) {
    return 'Invalid file or parameters. Please check your file and try again.';
  }

  return error.message || 'An unexpected error occurred. Please try again.';
}
