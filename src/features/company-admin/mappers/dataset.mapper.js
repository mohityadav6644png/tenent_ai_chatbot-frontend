export function mapDataset(raw) {
  if (!raw) return null;
  return {
    key: raw.key,
    label: raw.label,
    recordLabel: raw.record_label || 'record',
    records: raw.records ?? 0,
    lastUpdated: raw.last_updated || null,
    status: raw.status || 'ready',
    requiredColumns: Array.isArray(raw.required_columns) ? raw.required_columns : [],
    privateColumns: Array.isArray(raw.private_columns)
      ? raw.private_columns
      : Array.isArray(raw.non_queryable_columns)
      ? raw.non_queryable_columns
      : [],
  };
}

export function mapDatasets(list) {
  if (!Array.isArray(list)) return [];
  return list.map(mapDataset).filter(Boolean);
}

export function toDatasetSelectOptions(datasets) {
  if (!Array.isArray(datasets)) return [];
  return datasets.map((d) => ({
    value: d.key,
    label: d.label,
  }));
}
