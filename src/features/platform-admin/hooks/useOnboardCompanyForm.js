import { useRef, useState } from 'react';
import { mapApiError } from '../../../api/errorMapper.js';
import { createTenantRequestSchema } from '../../../api/v1/schemas/tenants.schema.js';
import { QUERY_LIMITS } from '../constants/queryLimits.js';
import { useCreateTenant } from './useCreateTenant.js';

const FIELD_SCHEMAS = {
  company_name: createTenantRequestSchema.shape.company_name,
  admin_name: createTenantRequestSchema.shape.admin_name,
  admin_email: createTenantRequestSchema.shape.admin_email,
  monthly_query_limit: createTenantRequestSchema.shape.monthly_query_limit,
};

const INITIAL_VALUES = {
  company_name: '',
  admin_name: '',
  admin_email: '',
  monthly_query_limit: String(QUERY_LIMITS[0].value),
};

const FIELD_IDS = {
  company_name: 'company-name',
  admin_name: 'admin-name',
  admin_email: 'admin-email',
  monthly_query_limit: 'monthly-query-limit',
};

export function useOnboardCompanyForm() {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const fieldRefs = useRef({});
  const submitLock = useRef(false);
  const createTenant = useCreateTenant();

  function normalizeValues(currentValues) {
    return {
      ...currentValues,
      monthly_query_limit: Number(currentValues.monthly_query_limit),
    };
  }

  function validate(valuesToValidate) {
    const result = createTenantRequestSchema.safeParse(normalizeValues(valuesToValidate));
    if (result.success) return { data: result.data, errors: {} };
    const nextErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (FIELD_IDS[field] && !nextErrors[field]) nextErrors[field] = issue.message;
    }
    return { data: null, errors: nextErrors };
  }

  function updateField(field, value) {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
    if (hasSubmitted) {
      const fieldResult = FIELD_SCHEMAS[field].safeParse(
        field === 'monthly_query_limit' ? Number(value) : value,
      );
      setErrors((current) => ({ ...current, [field]: fieldResult.success ? undefined : fieldResult.error.issues[0].message }));
    }
  }

  function validateField(field) {
    if (!hasSubmitted) return;
    const result = FIELD_SCHEMAS[field].safeParse(
      field === 'monthly_query_limit'
        ? Number(values[field])
        : values[field],
    );
    setErrors((current) => ({
      ...current,
      [field]: result.success ? undefined : result.error.issues[0].message,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitLock.current) return;
    setHasSubmitted(true);
    setFormError('');
    const result = validate(values);
    setErrors(result.errors);
    if (!result.data) {
      const firstInvalid = Object.keys(FIELD_IDS).find((field) => result.errors[field]);
      fieldRefs.current[firstInvalid]?.focus();
      return;
    }

    submitLock.current = true;
    try {
      await createTenant.mutateAsync(result.data);
    } catch (error) {
      if (error?.code === 'TENANT_EXISTS') {
        setErrors((current) => ({
          ...current,
          company_name: 'A company with this name already exists.',
        }));
        fieldRefs.current.company_name?.focus();
      } else {
        setFormError(mapApiError(error));
      }
    } finally {
      submitLock.current = false;
    }
  }

  return {
    FIELD_IDS,
    values,
    errors,
    formError,
    fieldRefs,
    createTenant,
    handleSubmit,
    updateField,
    validateField,
  };
}
