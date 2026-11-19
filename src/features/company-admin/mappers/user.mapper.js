const ROLE_DISPLAY = {
  admin: { label: 'Admin', tone: 'role-admin' },
  employee: { label: 'Employee', tone: 'role-employee' },
};

const STATUS_DISPLAY = {
  active: { label: 'Active', tone: 'active' },
  invite_pending: { label: 'Invite pending', tone: 'onboarding' },
};

export function mapCompanyUser(user) {
  return {
    ...user,
    roleDisplay: ROLE_DISPLAY[user.role] || { label: user.role, tone: 'neutral' },
    statusDisplay: STATUS_DISPLAY[user.status] || { label: user.status, tone: 'neutral' },
  };
}
