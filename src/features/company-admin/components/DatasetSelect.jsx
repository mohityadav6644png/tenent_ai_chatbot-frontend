export function DatasetSelect({ datasets = [], value, onChange }) {
  return (
    <div className="import-field-group">
      <label className="import-field-label" htmlFor="import-dataset-select">
        Dataset
      </label>
      <select
        id="import-dataset-select"
        className="import-native-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {datasets.map((d) => (
          <option key={d.key} value={d.key}>
            {d.label}
          </option>
        ))}
      </select>
    </div>
  );
}
