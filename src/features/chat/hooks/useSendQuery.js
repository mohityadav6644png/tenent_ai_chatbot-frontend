import { useMutation } from '@tanstack/react-query';
import { sendQuery } from '../../../api/v1/chat.api.js';
import { chatResponseSchema } from '../../../api/v1/schemas/chat.schema.js';
import { mapChatResponse } from '../mappers/answer.mapper.js';

export function useSendQuery() {
  return useMutation({
    mutationFn: async ({ question, history, conversationId }) => {
      const response = await sendQuery({ question, history, conversationId });
      return mapChatResponse(chatResponseSchema.parse(response));
    },
    retry: false,
  });
}
