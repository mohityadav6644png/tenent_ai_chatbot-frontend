import { useMutation } from '@tanstack/react-query';
import { previewCompanyFile } from '../../../api/v1/companyFiles.api.js';

export function usePreviewFile(options = {}) {
  return useMutation({
    mutationFn: (file) => previewCompanyFile(file),
    ...options,
  });
}
