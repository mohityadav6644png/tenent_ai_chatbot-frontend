import { Button } from '../../../shared/components/Button.jsx';
import { AnswerActions } from './AnswerActions.jsx';
import { ChartView } from './ChartView.jsx';
import { ResultTable } from './ResultTable.jsx';

function normalizeAnswer(answer) {
  if (answer.summary) return answer;
  return {
    ...answer,
    summary: answer.headline,
    table: {
      columns: answer.columns || [],
      rows: answer.rows || [],
      highlightRows: answer.highlightRows || [],
    },
    footer: {
      rowCount: answer.rowCount ?? answer.rows?.length ?? 0,
      latencyMs: answer.latencyMs,
      truncated: answer.truncated,
    },
  };
}

function footerText(footer, rows) {
  const count = footer.rowCount ?? rows.length;
  const duration = ((footer.latencyMs ?? 0) / 1000).toFixed(1);
  const suffix = footer.truncated ? ` (showing first ${rows.length})` : '';
  return `${count} ${count === 1 ? 'row' : 'rows'} · answered in ${duration} s${suffix}`;
}

export function AnswerMessage({
  answer: rawAnswer,
  messageId,
  onRetry,
  retryDisabled = false,
}) {
  const answer = normalizeAnswer(rawAnswer);
  const rows = answer.table?.rows || [];
  const columns = answer.table?.columns || [];

  return (
    <div className="answer-message">
      <span className="answer-message__avatar" aria-hidden="true">AI</span>
      <article className={`answer-card${answer.status === 'refused' ? ' answer-card--refused' : ''}`}>
        {answer.status === 'refused' && (
          <p>I can only help with your company data.</p>
        )}
        {answer.status === 'error' && (
          <div className="answer-error">
            <p>{answer.errorMessage}</p>
            {answer.retryable && (
              <Button className="answer-action" disabled={retryDisabled} onClick={onRetry}>Retry</Button>
            )}
          </div>
        )}
        {answer.status === 'clarification_needed' && (
          <p>{answer.clarificationQuestion || answer.summary}</p>
        )}
        {(answer.status === 'success' || !answer.status) && (
          <>
            <h2 className="answer-summary">{answer.summary || "Here's what I found"}</h2>
            {answer.detail && <p className="answer-detail">{answer.detail}</p>}
            <div className="answer-result-row">
              <ResultTable {...answer.table} />
              <ChartView chart={answer.chart} />
            </div>
            <footer className="answer-footer">
              <span>{footerText(answer.footer || {}, rows)}</span>
              <AnswerActions columns={columns} rows={rows} messageId={messageId} />
            </footer>
          </>
        )}
      </article>
    </div>
  );
}
