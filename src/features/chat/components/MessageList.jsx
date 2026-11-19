import { useMessageList } from '../hooks/useMessageList.js';
import { AnswerMessage } from './AnswerMessage.jsx';
import { UserMessage } from './UserMessage.jsx';

const LOADING_STEPS = [
  'Understanding your question',
  'Preparing a safe query',
  'Fetching your data',
];

function LoadingMessage() {
  return (
    <div className="loading-message" role="status">
      <span className="loading-spinner" aria-hidden="true" />
      <div>
        {LOADING_STEPS.map((step, index) => (
          <p className={index === 0 ? 'loading-message__active' : ''} key={step}>{step}</p>
        ))}
      </div>
    </div>
  );
}

export function MessageList({ messages, onRetry, retryDisabled }) {
  const listRef = useMessageList(messages);

  return (
    <ol className="chat-messages" aria-live="polite" ref={listRef}>
      {!messages.length && (
        <li className="chat-empty-state">Ask a question to get started.</li>
      )}
      {messages.map((message) => (
        <li className={`chat-message chat-message--${message.kind}`} key={message.id}>
          {message.kind === 'user' && <UserMessage>{message.content}</UserMessage>}
          {message.kind === 'loading' && <LoadingMessage />}
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
