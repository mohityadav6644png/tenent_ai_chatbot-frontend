import { useState } from 'react';

export function useConversation(initialMessages = [], initialConversationId) {
  const [messages, setMessages] = useState(() =>
    initialMessages.filter((m) => m && m.kind !== 'loading')
  );
  const [conversationId, setConversationId] = useState(initialConversationId);

  function addMessage(message) {
    const id = crypto.randomUUID();
    setMessages((current) => [...current, { ...message, id }]);
    return id;
  }

  function replaceMessage(id, message) {
    setMessages((current) =>
      current.map((item) => (item.id === id ? { ...message, id } : item)),
    );
  }

  function removeLoadingMessages() {
    setMessages((current) =>
      current.map((item) =>
        item.kind === 'loading'
          ? {
              ...item,
              kind: 'error',
              answer: {
                status: 'error',
                errorMessage: 'Query stopped by user.',
                retryable: true,
              },
            }
          : item
      )
    );
  }

  function clearConversation(nextConversationId = crypto.randomUUID()) {
    setMessages([]);
    setConversationId(nextConversationId);
  }

  return {
    messages,
    conversationId,
    setConversationId,
    addMessage,
    replaceMessage,
    removeLoadingMessages,
    clearConversation,
  };
}
