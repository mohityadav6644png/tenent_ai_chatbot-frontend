import { useRef, useState } from 'react';
import { mapApiError } from '../../../api/errorMapper.js';
import { createInviteRequestSchema } from '../../../api/v1/schemas/users.schema.js';
import { INVITE_ROLES } from '../constants/inviteRoles.js';
import { useCreateInvite } from './useCreateInvite.js';

const FIELD_IDS = { name: 'invite-name', email: 'invite-email', role: 'invite-role' };
const FIELD_SCHEMAS = createInviteRequestSchema.shape;
const INITIAL_VALUES = { name: '', email: '', role: 'employee' };

export function useInviteUserForm() {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const fieldRefs = useRef({});
  const submitLock = useRef(false);
  const createInvite = useCreateInvite();

  function validateField(field, value) {
    const result = FIELD_SCHEMAS[field].safeParse(value);
    setErrors((current) => ({
      ...current,
      [field]: result.success ? undefined : result.error.issues[0].message,
    }));
    return result;
  }

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setFormError('');
    if (hasSubmitted) validateField(field, value);
    else setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitLock.current || createInvite.isPending) return;
    setHasSubmitted(true);
    setFormError('');
    const result = createInviteRequestSchema.safeParse(values);
    if (!result.success) {
      const nextErrors = Object.fromEntries(
        result.error.issues.map((issue) => [issue.path[0], issue.message]),
      );
      setErrors(nextErrors);
      const firstInvalid = Object.keys(FIELD_IDS).find((field) => nextErrors[field]);
      fieldRefs.current[firstInvalid]?.focus();
      return;
    }

    setErrors({});
    submitLock.current = true;
    try {
      await createInvite.mutateAsync(result.data);
    } catch (error) {
      if (error?.code === 'USER_EXISTS' || error?.code === 'INVITE_EXISTS') {
        setErrors((current) => ({
          ...current,
          email: error.code === 'USER_EXISTS'
            ? 'This person already has an account.'
            : 'An invite is already pending for this email. Use Resend on the Users page.',
        }));
        fieldRefs.current.email?.focus();
      } else {
        setFormError(mapApiError(error));
      }
    } finally {
      submitLock.current = false;
    }
  }

  return {
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
  };
}
