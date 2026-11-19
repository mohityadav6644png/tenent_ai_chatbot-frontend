import { useEffect, useState } from 'react';
import { mapChatError } from '../../../api/errorMapper.js';
import { mapConversationHistory } from '../mappers/answer.mapper.js';
import { useConversation } from './useConversation.js';
import { useSendQuery } from './useSendQuery.js';

const EMPTY_CONVERSATION = { messages: [] };

export function useChatWindow({
  conversation = EMPTY_CONVERSATION,
  onConversationUpdate,
}) {
  const {
    messages,
    conversationId,
    setConversationId,
    addMessage,
    replaceMessage,
  } = useConversation(conversation.messages, conversation.conversationId);
  const sendQuery = useSendQuery();
  const [draft, setDraft] = useState('');
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const isRateLimited = rateLimitSeconds > 0;

  useEffect(() => {
    if (!isRateLimited) return undefined;
    const timer = window.setInterval(() => {
      setRateLimitSeconds((remaining) => Math.max(0, remaining - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRateLimited]);

  useEffect(() => {
    if (conversation.id && onConversationUpdate) {
      onConversationUpdate(conversation.id, { messages, conversationId });
    }
  }, [conversation.id, conversationId, messages, onConversationUpdate]);

  async function submitQuestion(rawQuestion, retryMessage) {
    const question = rawQuestion.trim();
    if (!question || sendQuery.isPending || isRateLimited) return;
    const history = retryMessage?.history || mapConversationHistory(messages);
    setDraft('');

    if (!retryMessage) {
      addMessage({ kind: 'user', content: question });
      if (conversation.title === 'New chat') {
        onConversationUpdate(conversation.id, {
          title: question.slice(0, 42),
        });
      }
    }
    const loadingId = retryMessage
      ? retryMessage.id
      : addMessage({ kind: 'loading' });
    if (retryMessage) replaceMessage(loadingId, { kind: 'loading' });

    try {
      const answer = await sendQuery.mutateAsync({ question, history, conversationId });
      if (answer.conversationId) setConversationId(answer.conversationId);
      if (answer.status === 'error') {
        const mapped = mapChatError(answer.error);
        if (mapped.rateLimited) setRateLimitSeconds(mapped.retryAfterSeconds);
        replaceMessage(loadingId, {
          kind: 'error',
          question,
          history,
          answer: {
            ...answer,
            status: 'error',
            errorMessage: mapped.message,
            retryable: mapped.retryable,
          },
        });
        return;
      }
      const kind = answer.status === 'clarification_needed' ? 'clarification' : 'answer';
      replaceMessage(loadingId, { kind, answer });
    } catch (error) {
      const mapped = mapChatError(error);
      if (mapped.rateLimited) setRateLimitSeconds(mapped.retryAfterSeconds);
      replaceMessage(loadingId, {
        kind: 'error',
        question,
        history,
        answer: {
          status: 'error',
          errorMessage: mapped.message,
          retryable: mapped.retryable,
        },
      });
    }
  }

  function retryMessage(message) {
    if (isRateLimited) return;
    void submitQuestion(message.question, message);
  }

  function sendFollowUp(question) {
    setDraft(question);
    void submitQuestion(question);
  }

  return {
    messages,
    draft,
    setDraft,
    rateLimitSeconds,
    isRateLimited,
    sendQuery,
    submitQuestion,
    retryMessage,
    sendFollowUp,
  };
}
