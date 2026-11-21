export function mapChatResponse(response) {
  const answer = response.answer;

  return {
    status: response.status,
    summary: answer.headline || answer.summary || "Here's what I found",
    detail: answer.detail || '',
    table: {
      columns: answer.columns,
      rows: answer.rows,
      highlightRows: answer.highlight_rows || [],
    },
    chart: null,
    footer: {
      rowCount: answer.row_count,
      latencyMs: response.meta.latency_ms,
      truncated: answer.truncated,
    },
    conversationId: response.meta.conversation_id,
    followUps: response.follow_ups,
    clarificationQuestion: answer.clarification_question,
    options: answer.options || [],
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
