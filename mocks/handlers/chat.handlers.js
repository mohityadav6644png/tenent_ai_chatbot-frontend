import { http, HttpResponse } from 'msw';
import { chatRequestSchema } from '../../src/api/v1/schemas/chat.schema.js';

export const chatHandlers = [
  http.post('*/v1/chat/query', async ({ request }) => {
    const body = await request.json().catch(() => null);
    if (!chatRequestSchema.safeParse(body).success) {
      return HttpResponse.json(
        { code: 'INVALID_CHAT_REQUEST', message: 'Invalid request', retryable: false },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      status: 'success',
      answer: {
        headline: 'Sales are up 12% this month',
        detail: 'Compared with the previous month.',
        columns: [
          { name: 'Region', type: 'string' },
          { name: 'Sales', type: 'number' },
        ],
        rows: [['North', 142500], ['South', 128200], ['West', 97100], ['East', 84500]],
        row_count: 4,
        truncated: false,
        chart_hint: null,
      },
      follow_ups: ['Show sales by product', 'Compare with last quarter'],
      meta: { latency_ms: 1600 },
    });
  }),
];
