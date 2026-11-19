import { useChatPage } from '../hooks/useChatPage.js';
import { ChatHeader } from '../components/ChatHeader.jsx';
import { ChatWindow } from '../components/ChatWindow.jsx';
import { ConversationSidebar } from '../components/ConversationSidebar.jsx';
import '../styles/chat-layout.css';
import '../styles/chat.css';
import '../styles/chat-results.css';

export function ChatPage() {
  const {
    conversations,
    currentConversation,
    activeId,
    selectConversation,
    updateConversation,
    sidebarOpen,
    setSidebarOpen,
    startNewChat,
  } = useChatPage();

  return (
    <div className="conversation-screen">
      <ConversationSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNewChat={startNewChat}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="conversation-main">
        <ChatHeader
          title={currentConversation?.title}
          onMenuClick={() => setSidebarOpen(true)}
          sidebarOpen={sidebarOpen}
        />
        {currentConversation && (
          <ChatWindow
            key={currentConversation.id}
            conversation={currentConversation}
            onConversationUpdate={updateConversation}
          />
        )}
      </main>
    </div>
  );
}
