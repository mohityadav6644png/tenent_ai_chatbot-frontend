import { mapHealthStatus } from '../mappers/health.mapper.js';

export function useHealthCard(component) {
  return mapHealthStatus(component.status);
}
