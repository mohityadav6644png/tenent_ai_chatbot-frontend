import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../src/features/auth/AuthContext.jsx';
import { LoginPage } from '../../src/features/auth/pages/LoginPage.jsx';
import { HttpError } from '../../src/api/httpClient.js';
import { login as loginApi } from '../../src/api/v1/auth.api.js';

vi.mock('../../src/api/v1/auth.api.js', () => ({
  login: vi.fn(),
  currentUserRequest: vi.fn(),
  logoutRequest: vi.fn(),
}));

function renderLogin() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/chat" element={<p>Chat destination</p>} />
            <Route path="/admin/users" element={<p>Users destination</p>} />
            <Route path="/platform/tenants" element={<p>Tenants destination</p>} />
            <Route path="/forgot-password" element={<p>Password reset</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

function fillCredentials() {
  fireEvent.change(screen.getByLabelText('Work email'), {
    target: { value: 'person@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'secret-password' },
  });
}

describe('LoginForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the sign-in form and footer links', () => {
    renderLogin();

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByLabelText('Work email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
    expect(screen.getByText('Invite-only access')).toBeInTheDocument();
    expect(screen.queryByText(/Employee demo:/)).not.toBeInTheDocument();
  });

  it('accepts the development demo account without calling the backend', async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText('Work email'), {
      target: { value: 'demo@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Demo123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await screen.findByText('Chat destination');
    expect(loginApi).not.toHaveBeenCalled();
  });

  it('authenticates the development super admin demo account with the backend', async () => {
    loginApi.mockResolvedValue({
      user: {
        id: 'backend-super-admin',
        email: 'superadmin@example.com',
        name: 'Demo Super Admin',
        role: 'super_admin',
      },
    });
    renderLogin();
    fireEvent.change(screen.getByLabelText('Work email'), {
      target: { value: 'superadmin@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'SuperAdmin123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await screen.findByText('Tenants destination');
    expect(loginApi).toHaveBeenCalledWith({
      email: 'superadmin@example.com',
      password: 'SuperAdmin123!',
    });
  });

  it('accepts the development company admin demo account and opens Users', async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText('Work email'), {
      target: { value: 'companyadmin@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'CompanyAdmin123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await screen.findByText('Users destination');
    expect(loginApi).not.toHaveBeenCalled();
  });

  it('shows field validation errors on an empty submit', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid work email.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(loginApi).not.toHaveBeenCalled();
  });

  it.each([
    ['employee', 'Chat destination'],
    ['company_admin', 'Users destination'],
    ['super_admin', 'Tenants destination'],
  ])('logs in and redirects a %s to its role page', async (role, destination) => {
    loginApi.mockResolvedValue({
      user: { id: 'user-1', email: 'person@example.com', name: 'Example User', role },
    });
    renderLogin();
    fillCredentials();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await screen.findByText(destination);
    expect(loginApi).toHaveBeenCalledWith({ email: 'person@example.com', password: 'secret-password' });
  });

  it('shows a generic message and clears the password on a 401 response', async () => {
    loginApi.mockRejectedValue(
      new HttpError('Raw backend detail must not be shown', { status: 401 }),
    );
    renderLogin();
    fillCredentials();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    await waitFor(() => expect(screen.getByLabelText('Password')).toHaveValue(''));
    expect(screen.queryByText('Raw backend detail must not be shown')).not.toBeInTheDocument();
  });

  it('shows a connection message instead of an invalid-credentials message for network failures', async () => {
    loginApi.mockRejectedValue(new TypeError('Failed to fetch'));
    renderLogin();
    fillCredentials();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to reach the server. Check your connection and try again.',
    );
  });

  it('shows the rate-limit message when sign-in is throttled', async () => {
    loginApi.mockRejectedValue(
      new HttpError('Rate limit detail must not be shown', { status: 429, code: 'RATE_LIMITED' }),
    );
    renderLogin();
    fillCredentials();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many attempts. Try again in a few minutes.',
    );
  });
});
