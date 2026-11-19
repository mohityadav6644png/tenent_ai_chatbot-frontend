export function StatCard({ label, value }) {
  return (
    <article className="platform-stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}
