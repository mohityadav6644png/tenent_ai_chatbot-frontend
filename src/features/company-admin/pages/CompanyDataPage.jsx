import { Link } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.constants.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { AddRecordCard } from '../components/AddRecordCard.jsx';
import { ImportCsvCard } from '../components/ImportCsvCard.jsx';
import '../styles/company-data.css';

export function CompanyDataPage() {
  const { user } = useAuth();
  const companyName = user?.company_name || user?.companyName || 'your company';

  return (
    <div className="company-data-page">
      <header className="company-data-header">
        <div>
          <h1 className="company-data-header__title">Company data</h1>
          <p className="company-data-header__sub">
            Add information about your company. The chatbot uses it to answer questions.
          </p>
        </div>
        <Link
          to={ROUTES.COMPANY_DATA_ADD}
          className="company-data-header__link"
          style={{ fontSize: '14px', color: '#0F6B73', textDecoration: 'none', fontWeight: 500 }}
        >
          Add business data
        </Link>
      </header>

      <div className="company-data-note" role="note">
        Only {companyName} can see this data. The chatbot never shares it with other companies.
      </div>

      <div className="company-data-grid">
        <AddRecordCard />
        <ImportCsvCard />
      </div>
    </div>
  );
}
