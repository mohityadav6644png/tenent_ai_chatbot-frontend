import { useRef, useState } from 'react';
import { mapLoginError } from '../../../api/errorMapper.js';
import { authLoginRequestSchema } from '../../../api/v1/schemas/auth.schema.js';
import { useLogin } from './useLogin.js';

export function useLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const login = useLogin();

  async function handleSubmit(event) {
    event.preventDefault();
    login.reset();
    const result = authLoginRequestSchema.safeParse({ email, password });

    if (!result.success) {
      const errors = Object.fromEntries(
        result.error.issues.map((issue) => [issue.path[0], issue.message]),
      );
      setFieldErrors(errors);
      (errors.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setFieldErrors({});
    try {
      await login.mutateAsync(result.data);
    } catch {
      setPassword('');
      passwordRef.current?.focus();
    }
  }

  function updateEmail(event) {
    setEmail(event.target.value);
    setFieldErrors((errors) => ({ ...errors, email: undefined }));
    if (login.isError) login.reset();
  }

  function updatePassword(event) {
    setPassword(event.target.value);
    setFieldErrors((errors) => ({ ...errors, password: undefined }));
    if (login.isError) login.reset();
  }

  return {
    email,
    password,
    fieldErrors,
    emailRef,
    passwordRef,
    login,
    handleSubmit,
    updateEmail,
    updatePassword,
    loginError: login.isError ? mapLoginError(login.error) : null,
  };
}
