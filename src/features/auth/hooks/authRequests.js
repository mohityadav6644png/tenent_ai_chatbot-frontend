import { authLoginResponseSchema, authUserSchema } from '../../../api/v1/schemas/auth.schema.js';
import { currentUserRequest, login as loginRequest, logoutRequest } from '../../../api/v1/auth.api.js';
import { clearAuthToken, setAuthToken } from '../../../api/httpClient.js';
import {
  DEMO_USER,
  DEMO_SUPER_ADMIN_USER,
  DEMO_COMPANY_ADMIN_USER,
  getDemoUser,
} from '../services/demoAuth.js';

export async function login(credentials) {
  const demoUser = getDemoUser(credentials);
  if (demoUser && demoUser.role !== 'super_admin') {
    setAuthToken(`demo-${demoUser.role}-token`);
    return demoUser;
  }

  const result = authLoginResponseSchema.parse(await loginRequest(credentials));
  if (result.access_token) {
    setAuthToken(result.access_token);
  }
  return result.user;
}

export async function getCurrentUser() {
  const payload = await currentUserRequest();
  return authUserSchema.parse(payload?.user || payload);
}

export const logout = async (user) => {
  try {
    if (![DEMO_USER.id, DEMO_SUPER_ADMIN_USER.id, DEMO_COMPANY_ADMIN_USER.id].includes(user?.id)) {
      await logoutRequest();
    }
  } finally {
    clearAuthToken();
  }
};
