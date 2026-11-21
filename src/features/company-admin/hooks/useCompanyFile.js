import { useQuery } from '@tanstack/react-query';
import { getCompanyFile } from '../../../api/v1/companyFiles.api.js';

export const companyFileQueryKey = (id) => ['company-file', id];

export function useCompanyFile(id, options = {}) {
  return useQuery({
    queryKey: companyFileQueryKey(id),
    queryFn: ({ signal }) => getCompanyFile(id, { signal }),
    enabled: Boolean(id),
    retry: false,
    ...options,
  });
}
