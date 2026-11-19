export function EmptyState({ title, children }) {
  return <section className="empty-state"><h2>{title}</h2><p>{children}</p></section>;
}
