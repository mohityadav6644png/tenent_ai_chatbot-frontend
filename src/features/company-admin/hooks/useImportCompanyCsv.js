import { useMutation } from '@tanstack/react-query';
import { importCompanyCsv } from '../../../api/v1/company.api.js';

export function useImportCompanyCsv(options = {}) {
  return useMutation({
    mutationFn: importCompanyCsv,
    ...options,
  });
}
