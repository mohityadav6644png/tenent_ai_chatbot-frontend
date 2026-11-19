import { useCallback, useMemo, useState } from 'react';

function createRecord(title = 'New chat') {
  return {
    id: crypto.randomUUID(),
    conversationId: crypto.randomUUID(),
    title,
    messages: [],
    updatedAt: Date.now(),
  };
}

export function useConversations() {
  const [conversations, setConversations] = useState(() => [createRecord()]);
  const [activeId, setActiveId] = useState(() => null);
  const selectedId = activeId || conversations[0]?.id;

  const currentConversation = useMemo(
    () => conversations.find((item) => item.id === selectedId),
    [conversations, selectedId],
  );

  const createConversation = useCallback(() => {
    const conversation = createRecord();
    setConversations((items) => [conversation, ...items]);
    setActiveId(conversation.id);
    return conversation;
  }, []);

  const selectConversation = useCallback((id) => {
    setActiveId(id);
    setConversations((items) => items.map((item) =>
      item.id === id ? { ...item, updatedAt: Date.now() } : item,
    ));
  }, []);

  const updateConversation = useCallback((id, updates) => {
    setConversations((items) => items.map((item) =>
      item.id === id ? { ...item, ...updates, updatedAt: Date.now() } : item,
    ));
  }, []);

  return {
    conversations: [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    currentConversation,
    activeId: selectedId,
    createConversation,
    selectConversation,
    updateConversation,
  };
}
