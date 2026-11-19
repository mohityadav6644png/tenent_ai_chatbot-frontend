import { chatRequestSchema } from './schemas/chat.schema.js';
import { httpRequest } from '../httpClient.js';

export function sendQuery({ question, history, conversationId }) {
  const request = chatRequestSchema.parse({
    question,
    history: history.slice(-6),
    ...(conversationId ? { conversation_id: conversationId } : {}),
  });
  return httpRequest('/v1/chat/query', { method: 'POST', body: request });
}
