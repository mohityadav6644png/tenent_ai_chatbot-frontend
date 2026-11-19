import { http, HttpResponse } from 'msw';
import { createInviteRequestSchema } from '../../src/api/v1/schemas/users.schema.js';

const companyUsers = [
  { id: 'user-self', name: 'Ravi Singh', email: 'ravi@acme.example', role: 'admin', status: 'active', is_self: true },
  { id: 'user-2', name: 'Priya Shah', email: 'priya@acme.example', role: 'admin', status: 'active', is_self: false },
  { id: 'user-3', name: 'Arjun Mehta', email: 'arjun@acme.example', role: 'employee', status: 'active', is_self: false },
  { id: 'invite-1', name: 'Neha Patel', email: 'neha@acme.example', role: 'employee', status: 'invite_pending', is_self: false },
];

export const usersHandlers = [
  http.get('*/v1/users', () => HttpResponse.json({
    summary: {
      total_users: companyUsers.filter((user) => user.status === 'active').length,
      admins: companyUsers.filter((user) => user.status === 'active' && user.role === 'admin').length,
      pending_invites: companyUsers.filter((user) => user.status === 'invite_pending').length,
    },
    users: companyUsers,
  })),
  http.post('*/v1/invites', async ({ request }) => {
    const body = await request.json().catch(() => null);
    const result = createInviteRequestSchema.safeParse(body);
    if (!result.success) {
      return HttpResponse.json({ code: 'VALIDATION_ERROR' }, { status: 422 });
    }
    if (result.data.email === 'ravi@acme.in'
      || companyUsers.some((user) => user.email === result.data.email && user.status === 'active')) {
      return HttpResponse.json({ code: 'USER_EXISTS' }, { status: 409 });
    }
    if (companyUsers.some((user) => user.email === result.data.email && user.status === 'invite_pending')) {
      return HttpResponse.json({ code: 'INVITE_EXISTS' }, { status: 409 });
    }
    const invite = {
      id: `invite-${crypto.randomUUID()}`,
      name: result.data.name,
      email: result.data.email,
      role: result.data.role,
      status: 'invite_pending',
      is_self: false,
    };
    companyUsers.push(invite);
    return HttpResponse.json({ id: invite.id, status: invite.status }, { status: 201 });
  }),
  http.post('*/v1/users/:id/deactivate', ({ params }) => {
    const userIndex = companyUsers.findIndex(
      (item) => item.id === params.id && item.status === 'active',
    );
    if (userIndex < 0) {
      return HttpResponse.json({ code: 'USER_NOT_FOUND' }, { status: 404 });
    }
    if (companyUsers[userIndex].is_self) {
      return HttpResponse.json({ code: 'LAST_ADMIN' }, { status: 409 });
    }
    const [user] = companyUsers.splice(userIndex, 1);
    return HttpResponse.json({ id: user.id, status: 'deactivated' });
  }),
  http.post('*/v1/invites/:id/resend', ({ params }) => {
    const invite = companyUsers.find(
      (item) => item.id === params.id && item.status === 'invite_pending',
    );
    if (!invite) return HttpResponse.json({ code: 'INVITE_NOT_FOUND' }, { status: 404 });
    return HttpResponse.json({ id: invite.id });
  }),
  http.delete('*/v1/invites/:id', ({ params }) => {
    const inviteIndex = companyUsers.findIndex(
      (item) => item.id === params.id && item.status === 'invite_pending',
    );
    if (inviteIndex < 0) return HttpResponse.json({ code: 'INVITE_NOT_FOUND' }, { status: 404 });
    companyUsers.splice(inviteIndex, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
