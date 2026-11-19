import { useState } from 'react';
import { useFeedback } from './useFeedback.js';

export function useAnswerActions(messageId) {
  const [helpful, setHelpful] = useState(false);
  const feedback = useFeedback();

  async function sendHelpful() {
    await feedback.mutateAsync({ messageId, rating: 'helpful' });
    setHelpful(true);
  }

  return { helpful, feedback, sendHelpful };
}
