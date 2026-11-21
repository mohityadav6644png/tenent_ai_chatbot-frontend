import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patchCompanyFile } from '../../../api/v1/companyFiles.api.js';
import { COMPANY_FILES_QUERY_KEY } from './useCompanyFiles.js';
import { companyFileQueryKey } from './useCompanyFile.js';

export function useUpdateFile(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => patchCompanyFile(id, updates),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: COMPANY_FILES_QUERY_KEY });
      if (variables?.id) {
        await queryClient.invalidateQueries({ queryKey: companyFileQueryKey(variables.id) });
      }
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}
