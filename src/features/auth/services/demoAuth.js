export const DEMO_CREDENTIALS = Object.freeze({
  email: 'demo@example.com',
  password: 'Demo123!',
});

export const DEMO_USER = Object.freeze({
  id: 'demo-employee',
  email: DEMO_CREDENTIALS.email,
  name: 'Demo Employee',
  role: 'employee',
  company_name: 'Acme Traders',
});

export const DEMO_SUPER_ADMIN_CREDENTIALS = Object.freeze({
  email: 'superadmin@example.com',
  password: 'SuperAdmin123!',
});

export const DEMO_SUPER_ADMIN_USER = Object.freeze({
  id: 'demo-super-admin',
  email: DEMO_SUPER_ADMIN_CREDENTIALS.email,
  name: 'Demo Super Admin',
  role: 'super_admin',
});

export const DEMO_COMPANY_ADMIN_CREDENTIALS = Object.freeze({
  email: 'companyadmin@example.com',
  password: 'CompanyAdmin123!',
});

export const DEMO_COMPANY_ADMIN_USER = Object.freeze({
  id: 'demo-company-admin',
  email: DEMO_COMPANY_ADMIN_CREDENTIALS.email,
  name: 'Ravi Singh',
  role: 'company_admin',
  company_name: 'Acme Traders',
});

const DEMO_ACCOUNTS = [
  { credentials: DEMO_CREDENTIALS, user: DEMO_USER },
  { credentials: DEMO_SUPER_ADMIN_CREDENTIALS, user: DEMO_SUPER_ADMIN_USER },
  { credentials: DEMO_COMPANY_ADMIN_CREDENTIALS, user: DEMO_COMPANY_ADMIN_USER },
];

export function getDemoUser(credentials) {
  if (!import.meta.env.DEV) return null;
  return DEMO_ACCOUNTS.find(({ credentials: demo }) => (
    credentials.email === demo.email && credentials.password === demo.password
  ))?.user || null;
}
