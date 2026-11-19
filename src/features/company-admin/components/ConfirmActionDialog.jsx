import { Button } from '../../../shared/components/Button.jsx';
import { Modal } from '../../../shared/components/Modal.jsx';

export function ConfirmActionDialog({
  title,
  description,
  confirmLabel,
  isPending,
  onClose,
  onConfirm,
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="user-confirm-description">{description}</p>
      <div className="user-confirm-actions">
        <Button className="user-confirm-cancel" disabled={isPending} onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="user-confirm-danger"
          disabled={isPending}
          onClick={onConfirm}
        >
          {isPending ? 'Working...' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
