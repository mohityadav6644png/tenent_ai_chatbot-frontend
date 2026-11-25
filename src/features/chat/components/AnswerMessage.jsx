import { useState } from 'react';
import { Button } from '../../../shared/components/Button.jsx';
import { ResultTable } from './ResultTable.jsx';
import { skipProfileField } from '../../../api/v1/chat.api.js';

function normalizeAnswer(answer) {
  const norm = answer.summary ? { ...answer } : {
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
    multidocMeta: answer.multidocMeta || null,
  };
  norm.refusal_reason = norm.refusal_reason || norm.refusalReason || answer.refusal_reason || answer.refusalReason || answer.answer?.refusal_reason;
  norm.files_used = norm.files_used || norm.filesUsed || norm.meta?.files_used || answer.files_used || answer.meta?.files_used;
  norm.parts = norm.parts || answer.parts || answer.answer?.parts || null;
  return norm;
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
  const [skipped, setSkipped] = useState(false);
  const profilePrompt = answer.profilePrompt;

  const handleSkip = () => {
    setSkipped(true);
    if (profilePrompt?.field) {
      skipProfileField(profilePrompt.field).catch(() => {});
    }
  };

  return (
    <div className="answer-message">
      <span className="answer-message__avatar" aria-hidden="true">AI</span>
      <article className={`answer-card${answer.status === 'refused' ? ' answer-card--refused' : ''}`}>
        {answer.status === 'refused' && (
          answer.refusal_reason === 'no_connection' ? (
            <p>{answer.detail || answer.summary || "These files aren't connected yet. Ask your admin to connect them in Company data."}</p>
          ) : (
            <p>{answer.detail || answer.summary || "I can only help with your company data."}</p>
          )
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
            {answer.multidocMeta?.used_multi_doc && answer.multidocMeta.source_names?.length > 0 && (
              <div
                className="multidoc-sources-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: '4px 0 8px 0',
                  padding: '3px 8px',
                  fontSize: '12px',
                  color: '#4B5563',
                  backgroundColor: '#F3F4F6',
                  borderRadius: '4px',
                }}
              >
                <span style={{ fontWeight: 600 }}>Sources:</span>
                <span>{answer.multidocMeta.source_names.join(', ')}</span>
              </div>
            )}
            {answer.detail && <p className="answer-detail">{answer.detail}</p>}
            {answer.interpretedQuestion && (
              <p
                className="answer-interpreted"
                style={{ fontSize: '12px', color: '#5B6472' }}
              >
                Understood as: {answer.interpretedQuestion}
              </p>
            )}
            {answer.parts && answer.parts.length > 0 ? (
              <div className="answer-parts" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {answer.parts.map((part, pIdx) => {
                  const partCols = part.columns || [];
                  const partRows = part.rows || [];
                  return (
                    <div key={pIdx} className="answer-part">
                      <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: '#111827' }}>
                        {part.title || `Part ${pIdx + 1}`}
                      </h3>
                      {partRows.length > 0 ? (
                        <div className="answer-result-row">
                          <ResultTable columns={partCols} rows={partRows} />
                        </div>
                      ) : (
                        <p style={{ fontSize: '13px', color: '#6B7280' }}>No records</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : rows.length > 0 && (
              <div className="answer-result-row">
                <ResultTable {...answer.table} />
              </div>
            )}
            {(rows.length > 0 || (answer.parts && answer.parts.length > 0)) && (
              <footer className="answer-footer">
                <span>{footerText(answer.footer || {}, rows)}</span>
                {answer.files_used && answer.files_used.length > 0 && (
                  <span className="answer-footer__files" style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#6B7280' }}>
                    From your files: {answer.files_used.join(', ')}
                  </span>
                )}
              </footer>
            )}
            {profilePrompt && !skipped && (
              <div
                className="profile-prompt-container"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '12px',
                  paddingTop: '8px',
                  borderTop: '1px solid #E5E7EB',
                }}
              >
                <span
                  className="profile-prompt-text"
                  style={{ fontSize: '12px', color: '#5B6472' }}
                >
                  {profilePrompt.text}
                </span>
                <button
                  type="button"
                  className="profile-prompt-skip-button"
                  style={{
                    height: '44px',
                    padding: '0 16px',
                    fontSize: '13px',
                    background: 'transparent',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#5B6472',
                  }}
                  onClick={handleSkip}
                >
                  Skip
                </button>
              </div>
            )}
          </>
        )}
      </article>
    </div>
  );
}
