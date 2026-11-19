const STATUS_PRESENTATION = {
  active: { label: 'Active', tone: 'active', actions: ['manage', 'suspend'] },
  onboarding: { label: 'Onboarding', tone: 'onboarding', actions: ['manage'] },
  suspended: { label: 'Suspended', tone: 'suspended', actions: ['reactivate'] },
};

export function mapTenantStatus(status) {
  return STATUS_PRESENTATION[status] || {
    label: 'Unknown',
    tone: 'suspended',
    actions: [],
  };
}
