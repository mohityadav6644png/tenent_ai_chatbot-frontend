export function MessageBubble({ role, children }) {
  return <div className={`message message-${role}`}>{children}</div>;
}
