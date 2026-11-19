import { http, HttpResponse } from 'msw';

export const healthHandlers = [
  http.get('*/v1/internal/health', () => HttpResponse.json({
    components: [
      { key: 'api', label: 'API', status: 'operational', checked_at: new Date().toISOString() },
      { key: 'database', label: 'Database', status: 'operational', checked_at: new Date().toISOString() },
      { key: 'openai', label: 'Azure OpenAI', status: 'degraded', checked_at: new Date().toISOString() },
      { key: 'cache', label: 'Cache', status: 'operational', checked_at: new Date().toISOString() },
    ],
  })),
];
