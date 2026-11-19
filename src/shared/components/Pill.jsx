export function Pill({ children, className = '' }) {
  return <span className={`pill ${className}`.trim()}>{children}</span>;
}
