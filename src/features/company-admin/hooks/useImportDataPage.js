import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.constants.js';
import { downloadDatasetTemplate } from '../../../api/v1/companyData.api.js';
import { mapImportError } from '../mappers/importPreview.mapper.js';
import { useDatasets } from './useDatasets.js';
import { useImportPreview } from './useImportPreview.js';
import { useImportDataset } from './useImportDataset.js';

export function validateCsvFile(file) {
  if (!file) return 'Please choose a file.';
  const name = file.name || '';
  if (!name.toLowerCase().endsWith('.csv')) {
    return 'Please choose a CSV file (.csv).';
  }
  if (file.size === 0) {
    return 'The chosen file is empty. Please choose a non-empty CSV file.';
  }
  if (file.size > 5 * 1024 * 1024) {
    return 'File exceeds the 5 MB limit. Please choose a smaller file.';
  }
  return null;
}

export function useImportDataPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlDatasetKey = searchParams.get('dataset');

  const { data: datasets = [], isLoading: isDatasetsLoading } = useDatasets();
  const [selectedDatasetKey, setSelectedDatasetKey] = useState(urlDatasetKey || '');
  const [mode, setMode] = useState('upsert');
  const [file, setFile] = useState(null);
  const [clientFileError, setClientFileError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const { preview, isLoading: isPreviewLoading, error: previewError, getPreview, clearPreview } =
    useImportPreview();

  useEffect(() => {
    if (!datasets.length) return;
    if (urlDatasetKey && datasets.some((d) => d.key === urlDatasetKey)) {
      setSelectedDatasetKey(urlDatasetKey);
    } else if (!selectedDatasetKey || !datasets.some((d) => d.key === selectedDatasetKey)) {
      setSelectedDatasetKey(datasets[0].key);
    }
  }, [datasets, urlDatasetKey, selectedDatasetKey]);

  const selectedDataset = useMemo(() => {
    return datasets.find((d) => d.key === selectedDatasetKey) || datasets[0] || null;
  }, [datasets, selectedDatasetKey]);

  const handleSelectDataset = (key) => {
    setSelectedDatasetKey(key);
    setGeneralError('');
    if (file && !clientFileError) {
      getPreview({ dataset: key, file }).catch(() => {});
    }
  };

  const handleSelectFile = (selected) => {
    if (!selected) return;
    setGeneralError('');
    setToastMessage('');
    setFile(selected);

    const err = validateCsvFile(selected);
    if (err) {
      setClientFileError(err);
      clearPreview();
      return;
    }

    setClientFileError('');
    const targetKey = selectedDatasetKey || urlDatasetKey || datasets[0]?.key || 'orders';
    if (targetKey) {
      getPreview({ dataset: targetKey, file: selected }).catch(() => {});
    }
  };

  const importMutation = useImportDataset();

  const runImport = async () => {
    setGeneralError('');
    try {
      const result = await importMutation.mutateAsync({
        dataset: selectedDatasetKey,
        file,
        mode,
      });
      const savedCount = (result.inserted ?? 0) + (result.updated ?? 0);
      const skippedCount = result.skipped ?? 0;
      const label = selectedDataset?.label || 'Dataset';
      const msg = `${label} imported: ${savedCount} saved, ${skippedCount} skipped`;
      setToastMessage(msg);
      navigate(ROUTES.COMPANY_DATA, {
        replace: true,
        state: { successToast: msg },
      });
    } catch (err) {
      setGeneralError(mapImportError(err));
    } finally {
      setIsConfirmOpen(false);
    }
  };

  const handleImportClick = (e) => {
    e.preventDefault();
    if (mode === 'replace') {
      setIsConfirmOpen(true);
    } else {
      runImport();
    }
  };

  const handleDownloadTemplate = async () => {
    if (!selectedDatasetKey) return;
    try {
      await downloadDatasetTemplate(selectedDatasetKey);
    } catch (err) {
      setGeneralError(mapImportError(err));
    }
  };

  const isImportDisabled =
    !file ||
    Boolean(clientFileError) ||
    isPreviewLoading ||
    importMutation.isPending ||
    !preview ||
    preview.validRows <= 0 ||
    preview.missingColumns.length > 0;

  return {
    datasets,
    selectedDataset,
    selectedDatasetKey,
    handleSelectDataset,
    mode,
    setMode,
    file,
    clientFileError,
    handleSelectFile,
    preview,
    isPreviewLoading,
    previewError,
    generalError,
    setGeneralError,
    isImportDisabled,
    isImportPending: importMutation.isPending,
    handleImportClick,
    runImport,
    isConfirmOpen,
    setIsConfirmOpen,
    handleDownloadTemplate,
    toastMessage,
    navigateCancel: () => navigate(ROUTES.COMPANY_DATA),
  };
}
