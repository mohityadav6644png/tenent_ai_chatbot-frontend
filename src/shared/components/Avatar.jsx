function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();
}

export function Avatar({ name, label, className = '' }) {
  return (
    <span className={`avatar ${className}`.trim()} aria-label={label || name}>
      {initials(name)}
    </span>
  );
}
