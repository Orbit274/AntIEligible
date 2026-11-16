import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TUTORIAL_STEPS } from "../tutorialSteps";
import "../styles/TutorialGuide.css";

const SPOTLIGHT_PADDING = 9;
const VIEWPORT_MARGIN = 16;
const PANEL_GAP = 14;

function getPanelPosition(targetRect, panelSize, viewport, placement) {
    const { width: viewportWidth, height: viewportHeight } = viewport;
    const panelWidth = Math.min(panelSize.width || 360, viewportWidth - VIEWPORT_MARGIN * 2);
    const panelHeight = panelSize.height || 230;
    if (!targetRect) {
        return {
            left: Math.max(VIEWPORT_MARGIN, (viewportWidth - panelWidth) / 2),
            top: Math.max(VIEWPORT_MARGIN, (viewportHeight - panelHeight) / 2),
        };
    }

    const candidates = {
        right: {
            left: targetRect.right + PANEL_GAP,
            top: targetRect.top,
        },
        left: {
            left: targetRect.left - panelWidth - PANEL_GAP,
            top: targetRect.top,
        },
        bottom: {
            left: targetRect.left + (targetRect.width - panelWidth) / 2,
            top: targetRect.bottom + PANEL_GAP,
        },
        top: {
            left: targetRect.left + (targetRect.width - panelWidth) / 2,
            top: targetRect.top - panelHeight - PANEL_GAP,
        },
        "top-right": {
            left: targetRect.right - panelWidth,
            top: targetRect.top - panelHeight - PANEL_GAP,
        },
    };

    const fallbackOrder = [placement, "right", "left", "bottom", "top"];
    const tried = new Set();
    let chosen = null;
    for (const candidateName of fallbackOrder) {
        if (!candidateName || tried.has(candidateName) || !candidates[candidateName]) {
            continue;
        }
        tried.add(candidateName);
        const candidate = candidates[candidateName];
        const fitsHorizontally = candidate.left >= VIEWPORT_MARGIN && candidate.left + panelWidth <= viewportWidth - VIEWPORT_MARGIN;
        const fitsVertically = candidate.top >= VIEWPORT_MARGIN && candidate.top + panelHeight <= viewportHeight - VIEWPORT_MARGIN;
        if (fitsHorizontally && fitsVertically) {
            chosen = candidate;
            break;
        }
    }

    chosen ??= candidates.bottom;

    return {
        left: Math.max(VIEWPORT_MARGIN, Math.min(chosen.left, viewportWidth - panelWidth - VIEWPORT_MARGIN)),
        top: Math.max(VIEWPORT_MARGIN, Math.min(chosen.top, viewportHeight - panelHeight - VIEWPORT_MARGIN))
    };
}

export default function TutorialGuide({ open, onClose }) {
    const [stepIndex, setStepIndex] = useState(0);
    const [targetRects, setTargetRects] = useState([]);
    const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight});
    const [panelPosition, setPanelPosition] = useState(null);
    const panelRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const step = TUTORIAL_STEPS[stepIndex];
    const isFirstStep = stepIndex === 0;
    const isLastStep = stepIndex === TUTORIAL_STEPS.length - 1;
    const panelStyle = useMemo(() => panelPosition ? { left: `${panelPosition.left}px`, top: `${panelPosition.top}px` } : undefined, [panelPosition]);

    useEffect(() => {
        if (open) {
            setStepIndex(0);
        }
    }, [open]);

    // Each tour step declares which route it belongs to, spotlight should always be live UI
    useEffect(() => {
        if (open && step.path && location.pathname !== step.path) {
            navigate(step.path);
        }
    }, [open, step.path, location.pathname, navigate]);

    // Find the current target and keep the spotlight aligned during resize, scrolling, and React content updates
    useEffect(() => {
        if (!open) {
            return undefined;
        }

        let targetElements = [];
        let resizeObserver = null;
        const selectors = step.targets ?? (step.target ? [step.target] : []);

        function updateTargets() {
            if (selectors.length === 0) {
                targetElements = [];
                setTargetRects([]);
                return;
            }

            const nextTargets = selectors.map((selector) => document.querySelector(selector)).filter(Boolean);
            const targetsChanged = nextTargets.length !== targetElements.length || nextTargets.some((element, index) => element !== targetElements[index]);
            if (targetsChanged) {
                resizeObserver?.disconnect();
                targetElements = nextTargets;
                if (typeof ResizeObserver !== "undefined" && targetElements.length > 0) {
                    resizeObserver = new ResizeObserver(updateTargets);
                    targetElements.forEach((element) => resizeObserver.observe(element));
                }
                targetElements[0]?.scrollIntoView({ block: "nearest", inline: "nearest" });
            }

            setTargetRects(nextTargets.map((element) => {
                const rect = element.getBoundingClientRect();
                return {
                    left: rect.left,
                    top: rect.top,
                    right: rect.right,
                    bottom: rect.bottom,
                    width: rect.width,
                    height: rect.height,
                };
                })
            );
        }

        function updateViewport() {
            setViewport({ width: window.innerWidth, height: window.innerHeight });
            updateTargets();
        }

        updateTargets();
        const observer = new MutationObserver(updateTargets);
        observer.observe(document.body, { childList: true, subtree: true});
        window.addEventListener("resize", updateViewport);
        window.addEventListener("scroll", updateTargets, true);

        return () => {
            observer.disconnect();
            resizeObserver?.disconnect();
            window.removeEventListener("resize", updateViewport);
            window.removeEventListener("scroll", updateTargets, true);
        };
    }, [open, step.target, step.targets, location.pathname]);

    // Position the small instruction panel beside highlighted element
    useLayoutEffect(() => {
        if (!open) {
            return undefined;
        }

        function updatePosition() {
        const panel = panelRef.current?.getBoundingClientRect();
        setPanelPosition(
            getPanelPosition(
                targetRects[0] ?? null,
                { width: panel?.width ?? 360, height: panel?.height ?? 230 },
                viewport,
                step.placement,
            ),
        );
        }

        updatePosition();
        let observer;
        if (panelRef.current && typeof ResizeObserver !== "undefined") {
            observer = new ResizeObserver(updatePosition);
            observer.observe(panelRef.current);
        }
        return () => observer?.disconnect();
    }, [open, targetRects, viewport, step.placement, stepIndex]);

    // Clicking outside the card closes the tour. The spotlight's transparent
    // center lets users interact with the highlighted control before continuing.
    useEffect(() => {
        if (!open) {
            return undefined;
        }

        function handlePointerDown(event) {
            if (panelRef.current?.contains(event.target)) {
                return;
            }

            // Keep the guide open when someone uses the highlighted part of the app, clicking anywhere else dismisses it
            const selectors = step.targets ?? (step.target ? [step.target] : []);
            const clickedHighlightedTarget = selectors.some((selector) => document.querySelector(selector)?.contains(event.target));
            if (clickedHighlightedTarget) {
                return;
            }

            onClose();
        }

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, onClose, step.target, step.targets]);

    if (!open) return null;

    function goBack() {
        setStepIndex((current) => Math.max(0, current - 1));
    }

    function goNext() {
        if (isLastStep) {
            onClose();
            return;
        }
        setStepIndex((current) => Math.min(TUTORIAL_STEPS.length - 1, current + 1));
    }

    const spotlights = targetRects.map((rect) => ({
        left: Math.max(0, rect.left - SPOTLIGHT_PADDING),
        top: Math.max(0, rect.top - SPOTLIGHT_PADDING),
        width: rect.width + SPOTLIGHT_PADDING * 2,
        height: rect.height + SPOTLIGHT_PADDING * 2,
    }));
    const outerPath = `M0 0 H${viewport.width} V${viewport.height} H0 Z`;
    const holePath = spotlights.map((spotlight) => ` M${spotlight.left} ${spotlight.top} h${spotlight.width} v${spotlight.height} h-${spotlight.width} Z`).join("");

    return (
        <>
        <svg
            className="tutorial-scrim"
            width="100%"
            height="100%"
            viewBox={`0 0 ${viewport.width} ${viewport.height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            <path
                d={`${outerPath}${holePath}`}
                fill="#07172d"
                fillOpacity="0.48"
                fillRule="evenodd"
                pointerEvents="visiblePainted"
            />
            {spotlights.map((spotlight, index) => (
                <rect
                    key={index}
                    x={spotlight.left}
                    y={spotlight.top}
                    width={spotlight.width}
                    height={spotlight.height}
                    rx="9"
                    fill="none"
                    stroke="#2680ed"
                    strokeWidth="2"
                    pointerEvents="none"
                />
            ))}
        </svg>

        <section
            className={`tutorial-card${isFirstStep ? " tutorial-card-welcome" : ""}`}
            ref={panelRef}
            style={panelStyle}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutorial-title"
            aria-describedby="tutorial-description"
            onPointerDown={(event) => event.stopPropagation()}
        >
            <span className="tutorial-step-number">{stepIndex + 1}</span>
            <button
                className="tutorial-close"
                type="button"
                onClick={onClose}
                aria-label="Close tutorial"
                title="Close tutorial (Esc)"
            >
            ×
            </button>
            <div className="tutorial-card-content">
            <div className="tutorial-eyebrow">
                {isFirstStep ? "YOUR QUICK START GUIDE" : `STEP ${stepIndex + 1} OF ${TUTORIAL_STEPS.length}`}
            </div>
            <h2 id="tutorial-title">{step.title}</h2>
            <p id="tutorial-description">{step.description}</p>
            {step.note && <p className="tutorial-note">{step.note}</p>}
            </div>
            <div className="tutorial-footer">
            <button
                className="tutorial-text-button"
                type="button"
                onClick={onClose}
            >
                Skip tutorial
            </button>
            <div className="tutorial-progress" aria-label={`Step ${stepIndex + 1} of ${TUTORIAL_STEPS.length}`}>
                {TUTORIAL_STEPS.map((_, index) => (
                <span
                    key={index}
                    className={index === stepIndex ? "active" : index < stepIndex ? "complete" : ""}
                />
                ))}
            </div>
            <div className="tutorial-navigation">
                {!isFirstStep && (
                <button className="tutorial-back-button" type="button" onClick={goBack}>
                    Back
                </button>
                )}
                <button className="tutorial-next-button" type="button" onClick={goNext}>
                {step.buttonLabel ?? (isLastStep ? "Finish" : "Next")}
                <span aria-hidden="true">→</span>
                </button>
            </div>
            </div>
        </section>
        </>
    );
}