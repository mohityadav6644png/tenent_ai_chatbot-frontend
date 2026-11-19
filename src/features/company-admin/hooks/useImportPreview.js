import { useState, useRef, useCallback } from 'react';
import { fetchImportPreview } from '../../../api/v1/companyData.api.js';
import { mapImportPreview, mapImportError } from '../mappers/importPreview.mapper.js';

export function useImportPreview() {
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const getPreview = useCallback(async ({ dataset, file }) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const raw = await fetchImportPreview({ dataset, file }, { signal: controller.signal });
      const mapped = mapImportPreview(raw);
      setPreview(mapped);
      setIsLoading(false);
      return mapped;
    } catch (err) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        return null;
      }
      setIsLoading(false);
      const message = mapImportError(err);
      setError(message);
      throw err;
    }
  }, []);

  const clearPreview = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setPreview(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    preview,
    isLoading,
    error,
    setError,
    getPreview,
    clearPreview,
  };
}
