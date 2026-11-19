import { Button } from '../../../shared/components/Button.jsx';
import { SelectField } from '../../../shared/components/SelectField.jsx';
import { TextField } from '../../../shared/components/TextField.jsx';
import { QUERY_LIMITS } from '../constants/queryLimits.js';
import { useOnboardCompanyForm } from '../hooks/useOnboardCompanyForm.js';

const FIELD_CONFIG = [
  { name: 'company_name', component: TextField, label: 'Company name', placeholder: 'e.g. Shree Textiles', autoComplete: 'off', maxLength: 80 },
  { name: 'admin_name', component: TextField, label: 'Company admin name', placeholder: 'Full name', autoComplete: 'off', maxLength: 80 },
  { name: 'admin_email', component: TextField, label: 'Company admin email', type: 'email', placeholder: 'admin@company.com', autoComplete: 'off', maxLength: 254 },
  { name: 'monthly_query_limit', component: SelectField, label: 'Query limit per month', options: QUERY_LIMITS },
];

export function OnboardCompanyForm() {
  const {
    FIELD_IDS,
    values,
    errors,
    formError,
    fieldRefs,
    createTenant,
    handleSubmit,
    updateField,
    validateField,
  } = useOnboardCompanyForm();

  return (
    <form className="onboard-form-card" onSubmit={handleSubmit} noValidate>
      <div className="onboard-form-fields">
        {FIELD_CONFIG.map(({ name, component: Field, ...fieldProps }) => (
          <Field
            key={name}
            {...fieldProps}
            id={FIELD_IDS[name]}
            value={values[name]}
            error={errors[name]}
            inputRef={(node) => { fieldRefs.current[name] = node; }}
            onBlur={() => validateField(name)}
            onChange={(event) => updateField(name, event.target.value)}
          />
        ))}
      </div>
      {formError && <p className="onboard-form-error" role="alert">{formError}</p>}
      <Button
        className="onboard-submit"
        variant="dark"
        type="submit"
        disabled={createTenant.isPending}
      >
        {createTenant.isPending ? 'Creating...' : 'Create and send invite'}
      </Button>
    </form>
  );
}
