import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  acceptSuggestion,
  dismissSuggestion,
  refreshConnection,
  deleteConnection,
  markReviewed,
  triggerScan,
} from '../../../api/v1/connections.api.js';
import { CONNECTIONS_QUERY_KEY } from './useConnections.js';

export function useConnectionActions(options = {}) {
  const queryClient = useQueryClient();

  const accept = useMutation({
    mutationFn: (id) => acceptSuggestion(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY });
    },
  });

  const dismiss = useMutation({
    mutationFn: (id) => dismissSuggestion(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY });
    },
  });

  const refresh = useMutation({
    mutationFn: (id) => refreshConnection(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY });
    },
  });

  const remove = useMutation({
    mutationFn: (id) => deleteConnection(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY });
    },
  });

  const review = useMutation({
    mutationFn: (id) => markReviewed(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY });
    },
  });

  const scan = useMutation({
    mutationFn: () => triggerScan(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY });
    },
  });

  return {
    accept,
    dismiss,
    refresh,
    remove,
    review,
    scan,
  };
}
