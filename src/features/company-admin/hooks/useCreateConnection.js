import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createConnection } from '../../../api/v1/connections.api.js';
import { CONNECTIONS_QUERY_KEY } from './useConnections.js';

export function useCreateConnection(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => createConnection(payload),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY });
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}
