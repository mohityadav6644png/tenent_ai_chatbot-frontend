import { mapAuditEvents } from '../mappers/audit.mapper.js';

export function useAuditLogTable(events) {
  return mapAuditEvents(events);
}
