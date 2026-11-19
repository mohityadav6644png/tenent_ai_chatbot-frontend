import { httpRequest } from '../httpClient.js';
import { authLoginRequestSchema } from './schemas/auth.schema.js';

export const login = (credentials) => {
  const body = authLoginRequestSchema.parse(credentials);
  return httpRequest('/v1/auth/login', { method: 'POST', body });
};

export const currentUserRequest = () => httpRequest('/v1/auth/me');

export const logoutRequest = () => httpRequest('/v1/auth/logout', { method: 'POST' });
