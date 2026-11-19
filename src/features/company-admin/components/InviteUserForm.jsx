import { Button } from '../../../shared/components/Button.jsx';
import { SelectField } from '../../../shared/components/SelectField.jsx';
import { TextField } from '../../../shared/components/TextField.jsx';
import { useInviteUserForm } from '../hooks/useInviteUserForm.js';

export function InviteUserForm() {
  const {
    FIELD_IDS,
    INVITE_ROLES,
    values,
    errors,
    formError,
    hasSubmitted,
    fieldRefs,
    createInvite,
    handleSubmit,
    updateField,
    validateField,
  } = useInviteUserForm();

  const fields = [
    { name: 'name', component: TextField, label: 'Full name', placeholder: 'e.g. Meera Nair', autoComplete: 'off', maxLength: 80 },
    { name: 'email', component: TextField, label: 'Email', type: 'email', placeholder: 'meera@acme.in', autoComplete: 'off', maxLength: 254 },
    { name: 'role', component: SelectField, label: 'Role', options: INVITE_ROLES, helperText: values.role === 'admin' ? 'Admins can invite and deactivate users in your company.' : undefined },
  ];

  return (
    <form className="invite-form-card" onSubmit={handleSubmit} noValidate>
      <div className="invite-form-fields">
        {fields.map(({ name, component: Field, helperText, ...props }) => (
          <Field
            key={name}
            {...props}
            helperText={helperText}
            id={FIELD_IDS[name]}
            value={values[name]}
            error={errors[name]}
            inputRef={(node) => { fieldRefs.current[name] = node; }}
            onBlur={() => { if (hasSubmitted) validateField(name, values[name]); }}
            onChange={(event) => updateField(name, event.target.value)}
          />
        ))}
      </div>
      {formError && <p className="invite-form-error" role="alert">{formError}</p>}
      <Button className="invite-submit" type="submit" disabled={createInvite.isPending}>
        {createInvite.isPending ? 'Sending...' : 'Send invite'}
      </Button>
    </form>
  );
}
