import { useMessageList } from '../hooks/useMessageList.js';
import { AnswerMessage } from './AnswerMessage.jsx';
import { UserMessage } from './UserMessage.jsx';

const LOADING_STEPS = [
  'Understanding your question',
  'Preparing a safe query',
  'Fetching your data',
];

function LoadingMessage({ onStop }) {
  return (
    <div className="loading-message" role="status">
      <span className="loading-spinner" aria-hidden="true" />
      <div>
        {LOADING_STEPS.map((step, index) => (
          <p className={index === 0 ? 'loading-message__active' : ''} key={step}>{step}</p>
        ))}
        {onStop && (
          <button
            type="button"
            className="loading-message__stop"
            onClick={onStop}
            aria-label="Stop query"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <rect x="5" y="5" width="14" height="14" rx="2" />
            </svg>
            Stop
          </button>
        )}
      </div>
    </div>
  );
}

export function MessageList({ messages, onRetry, retryDisabled, onStop }) {
  const listRef = useMessageList(messages);

  return (
    <ol className="chat-messages" aria-live="polite" ref={listRef}>
      {!messages.length && (
        <li className="chat-empty-state">Ask a question to get started.</li>
      )}
      {messages.map((message) => (
        <li className={`chat-message chat-message--${message.kind}`} key={message.id}>
          {message.kind === 'user' && <UserMessage>{message.content}</UserMessage>}
          {message.kind === 'loading' && <LoadingMessage onStop={onStop} />}
          {message.kind === 'answer' && (
            <AnswerMessage
              answer={message.answer}
              messageId={message.id}
              onRetry={() => onRetry(message)}
              retryDisabled={retryDisabled}
            />
          )}
          {message.kind === 'error' && (
            <AnswerMessage
              answer={message.answer}
              onRetry={() => onRetry(message)}
              retryDisabled={retryDisabled}
            />
          )}
          {message.kind === 'clarification' && (
            <AnswerMessage answer={message.answer} messageId={message.id} />
          )}
        </li>
      ))}
    </ol>
  );
}
