import { useMutation } from '@tanstack/react-query';
import { previewConnection } from '../../../api/v1/connections.api.js';

export function usePreviewConnection(options = {}) {
  return useMutation({
    mutationFn: (payload) => previewConnection(payload),
    ...options,
  });
}
