import { useQuery } from '@tanstack/react-query';
import { listCompanyFiles } from '../../../api/v1/companyFiles.api.js';

export const COMPANY_FILES_QUERY_KEY = ['company-files'];

export function useCompanyFiles(options = {}) {
  return useQuery({
    queryKey: COMPANY_FILES_QUERY_KEY,
    queryFn: ({ signal }) => listCompanyFiles({ signal }),
    retry: false,
    ...options,
  });
}
