import { chatRequestSchema } from './schemas/chat.schema.js';
import { httpRequest } from '../httpClient.js';

export function sendQuery({ question, history, conversationId, signal }, options = {}) {
  const request = chatRequestSchema.parse({
    question,
    history: history.slice(-6),
    ...(conversationId ? { conversation_id: conversationId } : {}),
  });
  const abortSignal = signal || options?.signal;
  return httpRequest('/v1/chat/query', { method: 'POST', body: request, ...(abortSignal ? { signal: abortSignal } : {}) });
}

export function skipProfileField(field) {
  return httpRequest('/v1/profile/skip', { method: 'POST', body: { field } });
}
