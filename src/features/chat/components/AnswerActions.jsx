import { Button } from '../../../shared/components/Button.jsx';
import { useAnswerActions } from '../hooks/useAnswerActions.js';
import { downloadCsv } from '../services/chat.service.js';

export function AnswerActions({ columns, rows, messageId }) {
  const { helpful, feedback, sendHelpful } = useAnswerActions(messageId);

  return (
    <div className="answer-actions">
      <Button
        className="answer-action"
        onClick={() => downloadCsv(columns, rows)}
      >
        Download CSV
      </Button>
      <Button
        className="answer-action"
        disabled={helpful || feedback.isPending}
        onClick={() => void sendHelpful()}
      >
        {helpful ? 'Thanks' : 'Helpful'}
      </Button>
    </div>
  );
}
