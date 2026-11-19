export function ImportModeSelect({ value, onChange }) {
  return (
    <div className="import-field-group">
      <label className="import-field-label" htmlFor="import-mode-select">
        Import mode
      </label>
      <select
        id="import-mode-select"
        className="import-native-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="upsert">Add new and update existing records</option>
        <option value="replace">Replace all existing records</option>
      </select>
    </div>
  );
}
