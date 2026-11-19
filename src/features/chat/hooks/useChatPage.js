import { useState } from 'react';
import { useConversations } from './useConversations.js';

export function useChatPage() {
  const {
    conversations,
    currentConversation,
    activeId,
    createConversation,
    selectConversation,
    updateConversation,
  } = useConversations();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function startNewChat() {
    createConversation();
    setSidebarOpen(false);
  }

  return {
    conversations,
    currentConversation,
    activeId,
    selectConversation,
    updateConversation,
    sidebarOpen,
    setSidebarOpen,
    startNewChat,
  };
}
