import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../styles/ConfirmDialog.css";

let sharedDialog = null;

function getSharedDialog() {
  if (!sharedDialog) {
    sharedDialog = document.createElement("dialog");
    sharedDialog.className = "confirm-dialog";
    document.body.appendChild(sharedDialog);
  }
  return sharedDialog;
}

function ConfirmDialog({
  open,
  title,
  message,
  details,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const dialog = getSharedDialog();

    // Esc: let state drive the close so we stay in sync
    const handleCancel = (event) => {
      event.preventDefault();
      onCancelRef.current();
    };
    dialog.addEventListener("cancel", handleCancel);

    if (!dialog.open) {
      dialog.showModal();
    }
    confirmRef.current?.focus();

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      // Hide the dialog but keep the element for reuse.
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="confirm-dialog-body"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {title && <h2 className="confirm-dialog-title">{title}</h2>}
      <p className="confirm-dialog-message">{message}</p>
      {details && details.length > 0 && (
        <ul className="confirm-dialog-list">
          {details.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
      <div className="confirm-dialog-actions">
        <button
          type="button"
          className="confirm-dialog-cancel"
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className="confirm-dialog-confirm"
          onClick={onConfirm}
          ref={confirmRef}
        >
          {confirmLabel}
        </button>
      </div>
    </div>,
    getSharedDialog(),
  );
}

export default ConfirmDialog;
