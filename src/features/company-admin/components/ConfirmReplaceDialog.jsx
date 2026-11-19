import { Modal } from '../../../shared/components/Modal.jsx';
import { Button } from '../../../shared/components/Button.jsx';

export function ConfirmReplaceDialog({
  isOpen,
  datasetLabel = 'Dataset',
  onConfirm,
  onCancel,
  isPending = false,
}) {
  if (!isOpen) return null;

  return (
    <Modal title={`Replace all existing ${datasetLabel}?`} onClose={onCancel}>
      <div className="import-confirm-dialog-content">
        <p className="import-confirm-dialog-text">
          Your current {datasetLabel} records will be removed after the new ones are added. This can't be undone.
        </p>
        <div className="import-confirm-dialog-actions">
          <Button
            type="button"
            className="import-btn-cancel"
            onClick={onCancel}
            disabled={isPending}
          >
            Keep existing
          </Button>
          <Button
            type="button"
            className="import-btn-danger"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Replacing...' : 'Replace'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
