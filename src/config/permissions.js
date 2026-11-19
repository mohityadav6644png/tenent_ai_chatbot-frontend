import { ROUTES } from '../app/routes.constants.js';
import { ROLES } from '../shared/constants/roles.js';

export const ROLE_ROUTES = Object.freeze({
  [ROLES.EMPLOYEE]: [ROUTES.CHAT],
  [ROLES.COMPANY_ADMIN]: [
    ROUTES.CHAT,
    ROUTES.REPORTS,
    ROUTES.COMPANY_USERS,
    ROUTES.COMPANY_DATA,
    ROUTES.COMPANY_DATA_ADD,
  ],
  [ROLES.SUPER_ADMIN]: [ROUTES.PLATFORM_ADMIN],
});

export const ROLE_NAV_ITEMS = Object.freeze({
  [ROLES.EMPLOYEE]: [
    { label: 'Chat', to: ROUTES.CHAT },
  ],
  [ROLES.COMPANY_ADMIN]: [
    { label: 'Chat', to: ROUTES.CHAT },
    { label: 'Reports', to: ROUTES.REPORTS },
    { label: 'Users', to: ROUTES.COMPANY_USERS },
    { label: 'Company data', to: ROUTES.COMPANY_DATA },
    { label: 'Settings' },
  ],
});

export function canAccessRoute(role, path) {
  return ROLE_ROUTES[role]?.includes(path) ?? false;
}
