export function ConversationList({ conversations, activeId, onSelect }) {
  if (!conversations.length) {
    return <p className="conversation-list__empty">Your recent chats will appear here.</p>;
  }

  return (
    <nav className="conversation-list" aria-label="Recent chats">
      {conversations.map((conversation) => (
        <a
          aria-current={conversation.id === activeId ? 'page' : undefined}
          className={`conversation-list__link${conversation.id === activeId ? ' is-active' : ''}`}
          href={`/chat?conversation=${encodeURIComponent(conversation.id)}`}
          key={conversation.id}
          onClick={(event) => {
            event.preventDefault();
            onSelect(conversation.id);
          }}
          title={conversation.title}
        >
          <span>{conversation.title}</span>
        </a>
      ))}
    </nav>
  );
}
