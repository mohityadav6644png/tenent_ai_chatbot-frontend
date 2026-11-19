import { Button } from '../../../shared/components/Button.jsx';

export function ChatInput({ value, onChange, onSend, disabled }) {
  function handleSubmit(event) {
    event.preventDefault();
    const question = value.trim();
    if (question && !disabled) onSend(question);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form.requestSubmit();
    }
  }

  return (
    <div className="chat-input-wrap">
      <form className="chat-composer" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="chat-query">Ask a question about your company data</label>
        <textarea
          id="chat-query"
          className="chat-composer__input"
          rows={1}
          maxLength={500}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your company data"
          disabled={disabled}
        />
        <Button
          aria-label="Send question"
          className="chat-composer__send"
          type="submit"
          disabled={disabled || !value.trim()}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 19V5m-7 7 7-7 7 7" />
          </svg>
        </Button>
      </form>
      <p className="chat-composer__note">
        AI can make mistakes. Answers come only from your company&apos;s data.
      </p>
    </div>
  );
}
