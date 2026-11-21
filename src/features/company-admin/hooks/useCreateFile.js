import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCompanyFile } from '../../../api/v1/companyFiles.api.js';
import { COMPANY_FILES_QUERY_KEY } from './useCompanyFiles.js';

export function useCreateFile(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, meta }) => createCompanyFile({ file, meta }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: COMPANY_FILES_QUERY_KEY });
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}
