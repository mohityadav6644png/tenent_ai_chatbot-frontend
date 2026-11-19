import { describe, expect, it } from 'vitest';
import { canAccessRoute } from '../../src/config/permissions.js';
import { ROUTES } from '../../src/app/routes.constants.js';
import { ROLES } from '../../src/shared/constants/roles.js';

describe('canAccessRoute', () => {
  it('limits platform administration to super admins', () => {
    expect(canAccessRoute(ROLES.SUPER_ADMIN, ROUTES.PLATFORM_ADMIN)).toBe(true);
    expect(canAccessRoute(ROLES.COMPANY_ADMIN, ROUTES.PLATFORM_ADMIN)).toBe(false);
    expect(canAccessRoute(ROLES.SUPER_ADMIN, ROUTES.CHAT)).toBe(false);
    expect(canAccessRoute(ROLES.SUPER_ADMIN, ROUTES.REPORTS)).toBe(false);
  });

  it('allows employees to access chat only', () => {
    expect(canAccessRoute(ROLES.EMPLOYEE, ROUTES.CHAT)).toBe(true);
    expect(canAccessRoute(ROLES.EMPLOYEE, ROUTES.REPORTS)).toBe(false);
    expect(canAccessRoute(ROLES.EMPLOYEE, ROUTES.COMPANY_USERS)).toBe(false);
  });
});
