import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.constants.js';
import { Button } from '../../../shared/components/Button.jsx';
import { ErrorBanner } from '../../../shared/components/ErrorBanner.jsx';
import { TextField } from '../../../shared/components/TextField.jsx';
import { useAuth } from '../hooks/useAuth.js';
import * as authService from '../services/auth.service.js';

export function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = (searchParams.get('token') || '').trim();
  const navigate = useNavigate();

  let authContext = null;
  try {
    authContext = useAuth();
  } catch {
    // Graceful fallback if rendered outside AuthProvider
  }

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    const errors = {};

    if (!token) {
      setSubmitError('Invitation token is missing or invalid. Please use the complete link from your invite email.');
      return;
    }

    if (password.length < 10) {
      errors.password = 'Password must be at least 10 characters long.';
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const acceptFn = authContext?.acceptInvite || authService.acceptInvite;
      const user = await acceptFn({ token, password });
      const destination = user?.role === 'company_admin' ? ROUTES.ADMIN_USERS : ROUTES.CHAT;
      navigate(destination, { replace: true });
    } catch (err) {
      let msg = err?.data?.error?.message || err?.data?.detail || err?.message || 'Invalid or expired invitation token.';
      // Ensure no raw token is leaked in user-facing message
      if (token && msg.includes(token)) {
        msg = msg.replace(token, '[token]');
      }
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login-card" aria-labelledby="accept-invite-title">
      <h1 className="login-card__title" id="accept-invite-title">Set Your Password</h1>
      <p className="login-card__subtitle">
        Welcome to your company workspace! Choose a secure password to activate your account.
      </p>

      {submitError && <ErrorBanner>{submitError}</ErrorBanner>}

      {!token ? (
        <div style={{ margin: '1rem 0' }}>
          <p style={{ color: 'var(--color-danger, #e11d48)', fontSize: '0.875rem' }}>
            Invitation token is missing or invalid. Please check your invitation link.
          </p>
          <p className="login-form__footer" style={{ marginTop: '1rem' }}>
            <Link to={ROUTES.LOGIN}>Back to Sign In</Link>
          </p>
        </div>
      ) : (
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-form__fields">
            <TextField
              id="password"
              label="New Password"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={fieldErrors.password}
              disabled={isSubmitting}
            />

            <TextField
              id="confirm-password"
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              error={fieldErrors.confirmPassword}
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {isSubmitting ? 'Activating account...' : 'Set Password & Sign In'}
          </Button>

          <p className="login-form__footer" style={{ marginTop: '1rem', textAlign: 'center' }}>
            Already have an account? <Link to={ROUTES.LOGIN}>Sign In</Link>
          </p>
        </form>
      )}
    </section>
  );
}
