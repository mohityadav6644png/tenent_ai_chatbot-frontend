import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../../auth/AuthContext.jsx';

function createRecord(title = 'New chat') {
  return {
    id: crypto.randomUUID(),
    conversationId: null,
    title,
    messages: [],
    updatedAt: Date.now(),
  };
}

function getStorageKey(user) {
  if (!user) return null;
  const id = user.id || user._id || user.email;
  return id ? `company_chatbot_conversations_${id}` : null;
}

function loadStoredConversations(storageKey) {
  if (!storageKey || typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((conv) => ({
        ...conv,
        messages: (conv.messages || []).filter((m) => m && m.kind !== 'loading'),
      }));
    }
  } catch {
    // Ignore storage parse error
  }
  return null;
}

function saveStoredConversations(storageKey, convs) {
  if (!storageKey || typeof window === 'undefined') return;
  try {
    const cleanConvs = convs.map((conv) => ({
      ...conv,
      messages: (conv.messages || []).filter((m) => m && m.kind !== 'loading'),
    }));
    localStorage.setItem(storageKey, JSON.stringify(cleanConvs));
  } catch {
    // Ignore storage error
  }
}

export function useConversations() {
  const auth = useContext(AuthContext);
  const user = auth?.user || null;
  const storageKey = getStorageKey(user);

  const [conversations, setConversations] = useState(() => {
    const stored = loadStoredConversations(storageKey);
    return stored || [createRecord()];
  });
  const [activeId, setActiveId] = useState(() => null);

  // Sync state whenever the authenticated user changes (login, logout, switch account)
  useEffect(() => {
    if (storageKey) {
      const stored = loadStoredConversations(storageKey);
      if (stored && stored.length > 0) {
        setConversations(stored);
        setActiveId(stored[0]?.id || null);
      } else {
        const fresh = [createRecord()];
        setConversations(fresh);
        setActiveId(fresh[0].id);
      }
    } else {
      // User logged out: immediately reset in-memory state so previous chat is not visible
      const fresh = [createRecord()];
      setConversations(fresh);
      setActiveId(fresh[0].id);
    }
  }, [storageKey]);

  // Persist conversations whenever they change for the current user
  useEffect(() => {
    if (storageKey && conversations.length > 0) {
      const hasContent = conversations.some(
        (c) => (c.messages && c.messages.length > 0) || (c.title && c.title !== 'New chat'),
      );
      if (hasContent) {
        saveStoredConversations(storageKey, conversations);
      }
    }
  }, [conversations, storageKey]);

  const selectedId = activeId || conversations[0]?.id;

  const currentConversation = useMemo(
    () => conversations.find((item) => item.id === selectedId) || conversations[0],
    [conversations, selectedId],
  );

  const createConversation = useCallback(() => {
    const conversation = createRecord();
    setConversations((items) => {
      const updated = [conversation, ...items];
      if (storageKey) saveStoredConversations(storageKey, updated);
      return updated;
    });
    setActiveId(conversation.id);
    return conversation;
  }, [storageKey]);

  const selectConversation = useCallback((id) => {
    setActiveId(id);
    setConversations((items) => {
      const updated = items.map((item) =>
        item.id === id ? { ...item, updatedAt: Date.now() } : item,
      );
      if (storageKey) saveStoredConversations(storageKey, updated);
      return updated;
    });
  }, [storageKey]);

  const updateConversation = useCallback((id, updates) => {
    setConversations((items) => {
      const updated = items.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: Date.now() } : item,
      );
      if (storageKey) saveStoredConversations(storageKey, updated);
      return updated;
    });
  }, [storageKey]);

  return {
    conversations: [...conversations].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
    currentConversation,
    activeId: selectedId,
    createConversation,
    selectConversation,
    updateConversation,
  };
}
