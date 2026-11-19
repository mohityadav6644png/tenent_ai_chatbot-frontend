import { useMutation } from '@tanstack/react-query';

export function useFeedback() {
  return useMutation({ mutationFn: async () => undefined });
}
