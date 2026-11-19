import { useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);
  return {
    toast,
    showToast: (message, type = 'info') => setToast({ message, type }),
    clearToast: () => setToast(null),
  };
}
