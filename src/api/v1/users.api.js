import { httpRequest } from '../httpClient.js';
import {
  createInviteRequestSchema,
  createInviteResponseSchema,
  inviteActionResponseSchema,
  userActionResponseSchema,
  usersResponseSchema,
} from './schemas/users.schema.js';

export async function listUsers({ signal } = {}) {
  return usersResponseSchema.parse(await httpRequest('/v1/users', { signal }));
}

export async function deactivateUser(id) {
  return userActionResponseSchema.parse(
    await httpRequest(`/v1/users/${encodeURIComponent(id)}/deactivate`, { method: 'POST' }),
  );
}

export async function resendInvite(id) {
  return inviteActionResponseSchema.parse(
    await httpRequest(`/v1/invites/${encodeURIComponent(id)}/resend`, { method: 'POST' }),
  );
}

export async function cancelInvite(id) {
  await httpRequest(`/v1/invites/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function createInvite(payload) {
  const request = createInviteRequestSchema.parse(payload);
  return createInviteResponseSchema.parse(
    await httpRequest('/v1/invites', { method: 'POST', body: request }),
  );
}

export const listCompanyUsers = listUsers;
