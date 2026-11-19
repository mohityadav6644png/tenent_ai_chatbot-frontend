import { Link } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.constants.js';

export function ForgotPasswordPage() {
  return (
    <section className="login-card" aria-labelledby="forgot-password-title">
      <h1 className="login-card__title" id="forgot-password-title">Forgot password?</h1>
      <p className="login-card__subtitle">
        Contact your company administrator to reset your invite-only account.
      </p>
      <p className="login-form__footer">
        <Link to={ROUTES.LOGIN}>Back to sign in</Link>
      </p>
    </section>
  );
}
