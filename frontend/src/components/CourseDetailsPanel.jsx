import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "../styles/CourseDetailsPanel.css";
import CourseDetails from "./CourseDetails.jsx"

// Course card in the middle of the screen with the rest of the page dimmed behind it
// Clicking the dimmed background, the × button, or pressing Escape closes it
// Rendered into <body> so no parent's layout or z-index can trap it
function CourseDetailsPanel({courseId, visible, onClose, children}){
    useEffect(() => {
        if (!visible) {
            return;
        }
        function handleKeyDown(event) {
            if (event.key === "Escape") onClose();
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [visible, onClose]);

    const open = courseId !== null && visible;
    return createPortal(
        <div id="course-detail-overlay" className={open ? "show" : "close"} onClick={onClose}>
            <div id="course-detail-panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
                <button id="course-detail-close-button" onClick={onClose} aria-label="Close">
                    <X size={20} />
                </button>
                {open ? <CourseDetails courseId={courseId} /> : ""}
                {open && children ? <div id="course-detail-actions">{children}</div> : ""}
            </div>
        </div>,
        document.body
    );
}

export default CourseDetailsPanel;
