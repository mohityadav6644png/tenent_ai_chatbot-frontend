export function mapChatResponse(response) {
  const answer = response.answer;
  const numericColumnIndex = answer.columns.findIndex((column, index) =>
    column.type === 'number' || answer.rows.some((row) => typeof row[index] === 'number'),
  );
  const labelColumnIndex = answer.columns.findIndex((column, index) =>
    index !== numericColumnIndex && column.type !== 'number',
  );
  const hint = typeof answer.chart_hint === 'string'
    ? answer.chart_hint
    : answer.chart_hint?.type;
  const chartValues = numericColumnIndex < 0
    ? []
    : answer.rows.flatMap((row, index) => {
      const rawValue = row[numericColumnIndex];
      if (rawValue == null || rawValue === '') return [];
      const value = Number(rawValue);
      if (!Number.isFinite(value)) return [];
      return [{
        label: String(row[labelColumnIndex < 0 ? numericColumnIndex : labelColumnIndex] ?? index + 1),
        value,
      }];
    });

  return {
    status: response.status,
    summary: answer.headline || answer.summary || "Here's what I found",
    detail: answer.detail || '',
    table: {
      columns: answer.columns,
      rows: answer.rows,
      highlightRows: answer.highlight_rows || [],
    },
    chart: ['bar', 'line'].includes(hint) && chartValues.length >= 2
      ? {
        type: hint,
        label: typeof answer.chart_hint === 'object' && answer.chart_hint?.label
          ? answer.chart_hint.label
          : answer.columns[numericColumnIndex].name,
        values: chartValues,
      }
      : null,
    footer: {
      rowCount: answer.row_count,
      latencyMs: response.meta.latency_ms,
      truncated: answer.truncated,
    },
    conversationId: response.meta.conversation_id,
    followUps: response.follow_ups,
    clarificationQuestion: answer.clarification_question,
    error: response.error,
    errorMessage: response.error?.code,
    retryable: response.error?.retryable,
  };
}

export function mapConversationHistory(messages) {
  return messages.flatMap((message) => {
    if (message.kind === 'user') return [{ role: 'user', content: message.content }];
    if (message.kind === 'answer' || message.kind === 'clarification') {
      return [{
        role: 'assistant',
        content: `${message.answer.summary || message.answer.headline || ''} ${message.answer.detail || ''}`.trim(),
      }];
    }
    return [];
  }).slice(-6);
}
