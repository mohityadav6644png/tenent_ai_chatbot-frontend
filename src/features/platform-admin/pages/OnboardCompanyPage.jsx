import '../styles/platform-admin.css';
import { OnboardCompanyForm } from '../components/OnboardCompanyForm.jsx';

export function OnboardCompanyPage() {
  return (
    <section className="onboard-company-page">
      <header className="onboard-page-header">
        <h1>Onboard company</h1>
        <p>Create a tenant and email its first admin an invite.</p>
      </header>
      <OnboardCompanyForm />
    </section>
  );
}
