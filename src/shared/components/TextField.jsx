export function TextField({
  id,
  label,
  error,
  inputRef,
  className = '',
  ...inputProps
}) {
  const errorId = `${id}-error`;

  return (
    <div className={`text-field ${className}`.trim()}>
      <label className="text-field__label" htmlFor={id}>{label}</label>
      <input
        className={`text-field__input${error ? ' text-field__input--error' : ''}`}
        id={id}
        ref={inputRef}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error && <p className="text-field__error" id={errorId}>{error}</p>}
    </div>
  );
}
