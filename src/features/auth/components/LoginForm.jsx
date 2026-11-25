import { Link } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.constants.js';
import { Button } from '../../../shared/components/Button.jsx';
import { TextField } from '../../../shared/components/TextField.jsx';
import { useLoginForm } from '../hooks/useLoginForm.js';

export function LoginForm() {
  const {
    email,
    password,
    fieldErrors,
    emailRef,
    passwordRef,
    login,
    handleSubmit,
    updateEmail,
    updatePassword,
    loginError,
  } = useLoginForm();

  return (
    <section className="login-card" aria-labelledby="login-title">
      <h1 className="login-card__title" id="login-title">Sign in</h1>
      <p className="login-card__subtitle">Ask questions about your company data.</p>
      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <div className="login-form__fields">
          <TextField
            inputRef={emailRef}
            id="work-email"
            label="Work email"
            type="email"
            autoComplete="username"
            maxLength={254}
            required
            value={email}
            onChange={updateEmail}
            error={fieldErrors.email}
            disabled={login.isPending}
          />
          <TextField
            inputRef={passwordRef}
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            maxLength={128}
            required
            value={password}
            onChange={updatePassword}
            error={fieldErrors.password}
            disabled={login.isPending}
          />
        </div>
        {loginError && (
          <p className="login-form__error" role="alert">{loginError}</p>
        )}
        <Button className="login-form__submit" type="submit" disabled={login.isPending}>
          {login.isPending ? 'Signing in...' : 'Sign in'}
        </Button>
        <footer className="login-form__footer">
          <Link to={ROUTES.FORGOT_PASSWORD}>Forgot password?</Link>
          <span>Invite-only access</span>
        </footer>
      </form>
    </section>
  );
}
