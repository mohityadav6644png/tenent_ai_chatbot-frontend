import { useRef, useEffect } from 'react';
import { Button } from '../../../shared/components/Button.jsx';
import { useImportDataPage } from '../hooks/useImportDataPage.js';
import { DatasetSelect } from '../components/DatasetSelect.jsx';
import { FileDropzone } from '../components/FileDropzone.jsx';
import { SelectedFileBox } from '../components/SelectedFileBox.jsx';
import { ImportModeSelect } from '../components/ImportModeSelect.jsx';
import { ImportPreviewTable } from '../components/ImportPreviewTable.jsx';
import { ImportValidationSummary } from '../components/ImportValidationSummary.jsx';
import { RequiredColumnsCard } from '../components/RequiredColumnsCard.jsx';
import { ConfirmReplaceDialog } from '../components/ConfirmReplaceDialog.jsx';
import '../styles/import-data.css';

export function ImportDataPage() {
  const fileInputRef = useRef(null);
  const {
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
    isImportDisabled,
    isImportPending,
    handleImportClick,
    runImport,
    isConfirmOpen,
    setIsConfirmOpen,
    handleDownloadTemplate,
    navigateCancel,
  } = useImportDataPage();

  useEffect(() => {
    const link = document.querySelector('.chat-sidebar__link[href*="/admin/company-data"]');
    if (link) {
      link.classList.add('active');
      return () => link.classList.remove('active');
    }
  }, []);

  const displayedError = clientFileError || generalError || previewError;

  return (
    <div className="import-data-page">
      <header className="import-data-header">
        <h1 className="import-data-header__title">Add data</h1>
        <p className="import-data-header__sub">
          Upload a CSV file. The chatbot can use it right after the import.
        </p>
      </header>

      <div className="import-data-layout">
        <section className="import-main-card" aria-labelledby="import-form-heading">
          <h2 id="import-form-heading" className="visually-hidden">
            Import settings and file upload
          </h2>

          <form className="import-form" onSubmit={handleImportClick} noValidate>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="visually-hidden"
              data-testid="import-file-input"
              id="import-file-input"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) handleSelectFile(selected);
              }}
            />

            <DatasetSelect
              datasets={datasets}
              value={selectedDatasetKey}
              onChange={handleSelectDataset}
            />

            {!file ? (
              <FileDropzone
                onFileSelected={handleSelectFile}
                inputRef={fileInputRef}
              />
            ) : (
              <SelectedFileBox
                file={file}
                preview={preview}
                onReplace={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                    fileInputRef.current.click();
                  }
                }}
              />
            )}

            <ImportModeSelect value={mode} onChange={setMode} />

            <ImportPreviewTable
              hasFile={Boolean(file && !clientFileError)}
              isLoading={isPreviewLoading}
              preview={preview}
            />

            <ImportValidationSummary
              preview={preview}
              datasetKey={selectedDatasetKey}
            />

            {displayedError && (
              <div className="import-error-banner" role="alert">
                {displayedError}
              </div>
            )}

            <div className="import-actions-row">
              <Button
                type="submit"
                className="import-btn-primary"
                disabled={isImportDisabled}
              >
                {isImportPending ? 'Importing...' : 'Import data'}
              </Button>
              <Button
                type="button"
                className="import-btn-cancel"
                onClick={navigateCancel}
              >
                Cancel
              </Button>
            </div>
          </form>
        </section>

        <RequiredColumnsCard
          dataset={selectedDataset}
          onDownloadTemplate={handleDownloadTemplate}
        />
      </div>

      <ConfirmReplaceDialog
        isOpen={isConfirmOpen}
        datasetLabel={selectedDataset?.label || 'Dataset'}
        onConfirm={runImport}
        onCancel={() => setIsConfirmOpen(false)}
        isPending={isImportPending}
      />
    </div>
  );
}
