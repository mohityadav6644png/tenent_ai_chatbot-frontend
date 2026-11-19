const AUDIT_RESULT = {
  success: { label: 'Success', tone: 'success' },
  logged: { label: 'Logged', tone: 'logged' },
  retry: { label: 'Retry', tone: 'retry' },
  failed: { label: 'Failed', tone: 'failed' },
};

export function mapAuditResult(result) {
  return AUDIT_RESULT[result] || { label: result, tone: 'neutral' };
}

export function mapAuditEvents(events) {
  return [...events]
    .sort((left, right) => Date.parse(right.occurred_at) - Date.parse(left.occurred_at))
    .map((event) => {
      const occurredAt = new Date(event.occurred_at);
      return {
        ...event,
        time: new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        }).format(occurredAt),
        timeTitle: new Intl.DateTimeFormat(undefined, {
          dateStyle: 'medium',
          timeStyle: 'medium',
        }).format(occurredAt),
        resultDisplay: mapAuditResult(event.result),
      };
    });
}
