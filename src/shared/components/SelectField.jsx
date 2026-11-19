export function SelectField({
  id,
  label,
  error,
  helperText,
  options,
  inputRef,
  className = '',
  ...selectProps
}) {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  const describedBy = [error && errorId, helperText && helperId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`text-field ${className}`.trim()}>
      <label className="text-field__label" htmlFor={id}>{label}</label>
      <select
        className={`text-field__input${error ? ' text-field__input--error' : ''}`}
        id={id}
        ref={inputRef}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...selectProps}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error && <p className="text-field__error" id={errorId}>{error}</p>}
      {helperText && <p className="text-field__hint" id={helperId}>{helperText}</p>}
    </div>
  );
}
