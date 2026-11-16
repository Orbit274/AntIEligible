import { useEffect } from "react";
import { BookOpen, X } from "lucide-react";
import "../styles/TipsPanel.css";

const TIP_SECTIONS = [
    {
        title: "Getting Started",
        tips: [
            ["Start with your target course", "Search for the course you want to take in the future. It will generate its prerequisite graph."],
            ["Explore prerequisite relationships", "Expand course nodes to discover the courses required before taking your target course."],
            ["Select a course for more information", "Click a node to view its description and eligibility requirements."],
        ],
    },
    {
        title: "Managing Your Courses",
        tips: [
            ["Mark completed courses", "Update the status of courses you have already passed to keep track of your academic progress."],
            ["Plan your future courses", "Mark courses you intend to take so you can visualize your academic pathway."],
            ["Check eligibility", "Review prerequisite requirements before deciding which courses to take next."],
        ],
    },
    {
        title: "Navigating the Graph",
        tips: [
            ["Expand only what you need", "You do not have to expand every course. Focus on prerequisites relevant to your academic goals."],
            ["Use zoom and pan", "Zoom in to inspect individual courses and zoom out to understand the bigger picture. Drag an empty area of the graph to pan."],
            ["Follow alternative prerequisites", "Pay attention to OR requirements because you may have multiple ways to satisfy a prerequisite."],
        ],
    },
    {
        title: "Planning Your Academic Pathway",
        tips: [
            ["Work backward from your goal", "Start with the course you want to take and identify all the prerequisites you need to complete."],
            ["Prioritize missing prerequisites", "Focus on courses you have not completed yet."],
        ],
    },
];

export default function TipsPanel({ open, onClose }) {
    useEffect(() => {
        if (!open) {
            return undefined;
        }

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return (
        <div className="tips-overlay" onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
                onClose();
            }
        }}
        >
            <section
                className="tips-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tips-panel-title"
            >
                <header className="tips-panel-header">
                    <div className="tips-panel-heading">
                        <BookOpen size={19} aria-hidden="true" />
                        <div>
                            <span className="tips-eyebrow">HELP & REFERENCE</span>
                            <h2 id="tips-panel-title">Tips for using AntIEligible</h2>
                        </div>
                    </div>
                    <button className="tips-close" type="button" onClick={onClose} aria-label="Close tips">
                        <X size={19} />
                    </button>
                </header>

                <div className="tips-panel-body">
                    {TIP_SECTIONS.map((section, index) => (
                        <details className="tips-section" key={section.title} open={index === 0}>
                            <summary>{section.title}</summary>
                            <div className="tips-list">
                                {section.tips.map(([title, description]) => (
                                    <article className="tip-item" key={title}>
                                        <h3>{title}</h3>
                                        <p>{description}</p>
                                    </article>
                                ))}
                            </div>
                        </details>
                    ))}

                    <aside className="tips-reminder">
                        <strong>Important reminder</strong>
                        <p>Always verify course prerequisites with the official UCI catalog.</p>
                    </aside>
                </div>
            </section>
        </div>
    );
}