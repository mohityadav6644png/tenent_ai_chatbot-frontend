import { useChatWindow } from '../hooks/useChatWindow.js';
import { ChatInput } from './ChatInput.jsx';
import { MessageList } from './MessageList.jsx';
import { SuggestionChips } from './SuggestionChips.jsx';

const EMPTY_CONVERSATION = { messages: [] };

export function ChatWindow({
  conversation = EMPTY_CONVERSATION,
  onConversationUpdate,
}) {
  const {
    messages,
    draft,
    setDraft,
    rateLimitSeconds,
    isRateLimited,
    sendQuery,
    submitQuestion,
    retryMessage,
    sendFollowUp,
  } = useChatWindow({ conversation, onConversationUpdate });

  return (
    <section className="chat-page">
      <MessageList
        messages={messages}
        onRetry={retryMessage}
        retryDisabled={sendQuery.isPending || isRateLimited}
      />
      <SuggestionChips
        suggestions={messages.at(-1)?.answer?.followUps}
        onSelect={sendFollowUp}
        disabled={sendQuery.isPending || isRateLimited}
      />
      <div className="chat-composer-area">
        {isRateLimited && (
          <p className="rate-limit-notice" role="alert">
            Too many requests. Try again in {rateLimitSeconds} seconds.
          </p>
        )}
        <ChatInput
          value={draft}
          onChange={setDraft}
          onSend={(question) => void submitQuestion(question)}
          disabled={sendQuery.isPending || isRateLimited}
        />
      </div>
    </section>
  );
}
