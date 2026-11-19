export function Input({ label, id, ...props }) {
  const inputId = id || props.name || label.toLowerCase().replaceAll(' ', '-');
  return (
    <label className="field" htmlFor={inputId}>
      <span>{label}</span>
      <input id={inputId} {...props} />
    </label>
  );
}
