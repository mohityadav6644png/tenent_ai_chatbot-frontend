import { useMutation } from '@tanstack/react-query';
import { insertCompanyRecord } from '../../../api/v1/company.api.js';

export function useAddCompanyRecord(options = {}) {
  return useMutation({
    mutationFn: insertCompanyRecord,
    ...options,
  });
}
