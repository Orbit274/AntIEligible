import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../styles/ConfirmDialog.css";

// A centered, modal confirmation dialog built on the native <dialog> element.
// showModal() puts it in the top layer: it blocks all interaction with the rest
// of the page, traps focus inside, and closes on Esc (the "cancel" event).
// Portaled to document.body so it escapes React Flow's transformed viewport,
// which would otherwise trap the modal and let interactions leak to the graph.
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
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return createPortal(
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      // React events bubble through the React tree, not the DOM tree, so clicks
      // inside this portaled dialog would otherwise reach React Flow's node
      // wrapper and open the course details panel. Stop them at the root.
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onCancel={(event) => {
        // Esc: let state drive the close so we stay in sync
        event.preventDefault();
        onCancel();
      }}
    >
      <div className="confirm-dialog-body">
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
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}

export default ConfirmDialog;
