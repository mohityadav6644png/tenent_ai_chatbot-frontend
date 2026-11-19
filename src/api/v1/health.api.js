import { httpRequest } from '../httpClient.js';
import { platformHealthResponseSchema } from './schemas/health.schema.js';

export const getHealth = () => httpRequest('/v1/health');

export async function getPlatformHealth({ signal } = {}) {
  return platformHealthResponseSchema.parse(
    await httpRequest('/v1/internal/health', { signal }),
  );
}
