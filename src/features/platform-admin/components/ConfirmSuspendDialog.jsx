import { Button } from '../../../shared/components/Button.jsx';
import { Modal } from '../../../shared/components/Modal.jsx';

export function ConfirmSuspendDialog({ tenant, isPending, onClose, onConfirm }) {
  return (
    <Modal title={`Suspend ${tenant.name}?`} onClose={onClose}>
      <p className="suspend-dialog__description">Their users will lose access.</p>
      <div className="suspend-dialog__actions">
        <Button className="suspend-dialog__cancel" disabled={isPending} onClick={onClose}>
          Cancel
        </Button>
        <Button className="suspend-dialog__confirm" disabled={isPending} onClick={onConfirm}>
          {isPending ? 'Suspending…' : 'Suspend'}
        </Button>
      </div>
    </Modal>
  );
}
