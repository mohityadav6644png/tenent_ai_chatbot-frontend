import { useEffect, useRef, useState } from 'react';
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
    removeLoadingMessages,
  } = useConversation(conversation.messages, conversation.conversationId);
  const sendQuery = useSendQuery();
  const [draft, setDraft] = useState('');
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const isRateLimited = rateLimitSeconds > 0;
  const abortControllerRef = useRef(null);

  function stopQuery() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    removeLoadingMessages();
  }

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = window.setTimeout(() => {
      if (abortControllerRef.current === controller) {
        controller.abort();
      }
    }, 45000);

    try {
      const answer = await sendQuery.mutateAsync({
        question,
        history,
        conversationId,
        signal: controller.signal,
      });
      abortControllerRef.current = null;
      const nextConversationId = answer.conversationId || conversationId;
      if (nextConversationId) setConversationId(nextConversationId);
      if (conversation.id && onConversationUpdate && nextConversationId) {
        onConversationUpdate(conversation.id, { conversationId: nextConversationId });
      }
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
      const wasAborted = controller.signal.aborted || error?.name === 'AbortError';
      abortControllerRef.current = null;
      if (wasAborted) {
        replaceMessage(loadingId, {
          kind: 'error',
          question,
          history,
          answer: {
            status: 'error',
            errorMessage: 'Query stopped by user.',
            retryable: true,
          },
        });
        return;
      }
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
    } finally {
      window.clearTimeout(timeoutId);
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
    stopQuery,
  };
}
