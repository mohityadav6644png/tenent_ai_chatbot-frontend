export function CompanyAdminsTable({ admins }) {
  return (
    <section className="tenant-admins-section">
      <h2>Company admins</h2>
      <div className="tenants-table-card">
        <div className="tenants-table-scroll">
          <table className="tenants-table tenant-admins-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Last login</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="tenant-name">{admin.name}</td>
                  <td>{admin.email}</td>
                  <td>{admin.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {admins.length === 0 && (
        <p className="tenant-admins-empty">No admins yet. The invite may still be pending.</p>
      )}
    </section>
  );
}
