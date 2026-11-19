import { http, HttpResponse } from 'msw';
import { authLoginRequestSchema } from '../../src/api/v1/schemas/auth.schema.js';

export const authHandlers = [
  http.post('*/v1/auth/login', async ({ request }) => {
    const body = await request.json().catch(() => null);
    const result = authLoginRequestSchema.safeParse(body);

    if (!result.success) {
      return HttpResponse.json(
        { code: 'AUTH_INVALID_CREDENTIALS' },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      user: {
        id: 'mock-user',
        email: result.data.email,
        name: 'Company User',
        role: 'employee',
      },
    });
  }),
];
