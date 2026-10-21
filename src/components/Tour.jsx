import React, { useState, useEffect, useRef, useCallback } from "react";
import { TOUR_STEPS } from "../tour/tourSteps";
import { translations } from "../i18n";
import "./Tour.css";

export default function Tour({
  run,
  setRun,
  lang = "en",
  t: customT,
  currentPage = "home",
  onNavigate
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [targetRect, setTargetRect] = useState(null);
  const [popupStyle, setPopupStyle] = useState({});
  const popupRef = useRef(null);

  const t = customT || translations[lang] || translations.en;
  const currentStep = TOUR_STEPS[currentStepIndex];
  const totalSteps = TOUR_STEPS.length;

  // Persist tour completion/skip in localStorage
  const completeTour = useCallback(() => {
    localStorage.setItem("unnatiTourCompleted", "true");
    localStorage.setItem("unnatiTourDone", "true");
    localStorage.setItem("unnatiTourVersion", "1.0");
    if (onNavigate) {
      onNavigate("home");
    }
    setRun(false);
    setIsCompleted(false);
    setCurrentStepIndex(0);
  }, [setRun, onNavigate]);

  const skipTour = useCallback(() => {
    localStorage.setItem("unnatiTourCompleted", "true");
    localStorage.setItem("unnatiTourDone", "true");
    localStorage.setItem("unnatiTourVersion", "1.0");
    setRun(false);
    setIsCompleted(false);
    setCurrentStepIndex(0);
  }, [setRun]);

  // Navigate to step's required page if different from current
  useEffect(() => {
    if (!run || isCompleted) return;

    if (currentStep?.page && onNavigate && currentPage !== currentStep.page) {
      onNavigate(currentStep.page);
    }
  }, [run, isCompleted, currentStepIndex, currentStep, currentPage, onNavigate]);

  // Measure and position spotlight cutout and popup relative to active target
  const updatePosition = useCallback(() => {
    if (!run || isCompleted || !currentStep) return;

    // Locate target element or fallback
    let element = document.querySelector(currentStep.target);
    if (!element && currentStep.fallbackTarget) {
      element = document.querySelector(currentStep.fallbackTarget);
    }

    if (!element) {
      // Element not in DOM yet or on another view: fallback to viewport center
      setTargetRect(null);
      setPopupStyle({
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        position: "fixed"
      });
      return;
    }

    const rect = element.getBoundingClientRect();
    const padding = 6;

    const sTop = Math.max(0, rect.top - padding);
    const sLeft = Math.max(0, rect.left - padding);
    const sWidth = rect.width + padding * 2;
    const sHeight = rect.height + padding * 2;
    const sBottom = sTop + sHeight;
    const sRight = sLeft + sWidth;

    setTargetRect({
      top: sTop,
      left: sLeft,
      width: sWidth,
      height: sHeight,
      bottom: sBottom,
      right: sRight
    });

    const isMobile = window.innerWidth <= 640;
    const popupWidth = isMobile ? Math.min(360, window.innerWidth - 24) : 360;
    const popupHeight = popupRef.current ? popupRef.current.offsetHeight : 250;
    const gap = 14;

    if (isMobile) {
      // On mobile screens, place above or below based on vertical space
      const spaceBelow = window.innerHeight - sBottom;
      const spaceAbove = sTop;
      let topPos;

      if (spaceBelow >= popupHeight + gap || sTop < 120) {
        topPos = Math.min(window.innerHeight - popupHeight - 14, sBottom + gap);
      } else if (spaceAbove >= popupHeight + gap) {
        topPos = Math.max(14, sTop - popupHeight - gap);
      } else {
        topPos = Math.min(window.innerHeight - popupHeight - 14, sBottom + gap);
      }

      setPopupStyle({
        top: `${Math.round(topPos)}px`,
        left: "12px",
        width: `${popupWidth}px`,
        position: "fixed"
      });
    } else {
      // Desktop intelligent placement
      let topPos = 0;
      let leftPos = 0;
      const spaceBelow = window.innerHeight - sBottom;
      const spaceAbove = sTop;

      if (currentStep.position === "top" && spaceAbove >= popupHeight + gap) {
        topPos = sTop - popupHeight - gap;
      } else if (spaceBelow >= popupHeight + gap) {
        topPos = sBottom + gap;
      } else if (spaceAbove >= popupHeight + gap) {
        topPos = sTop - popupHeight - gap;
      } else {
        topPos = Math.max(20, (window.innerHeight - popupHeight) / 2);
      }

      // Horizontal alignment with boundary clamping
      leftPos = sLeft + sWidth / 2 - popupWidth / 2;
      leftPos = Math.max(16, Math.min(leftPos, window.innerWidth - popupWidth - 16));

      setPopupStyle({
        top: `${Math.round(topPos)}px`,
        left: `${Math.round(leftPos)}px`,
        width: `${popupWidth}px`,
        position: "fixed"
      });
    }
  }, [run, isCompleted, currentStep]);

  // Scroll target into view when step changes and retry if page is mounting
  useEffect(() => {
    if (!run || isCompleted || !currentStep) return;

    let checkCount = 0;
    const findAndScroll = () => {
      let element = document.querySelector(currentStep.target);
      if (!element && currentStep.fallbackTarget) {
        element = document.querySelector(currentStep.fallbackTarget);
      }

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center"
        });
        updatePosition();
      } else if (checkCount < 6) {
        checkCount++;
        setTimeout(findAndScroll, 75);
      } else {
        updatePosition();
      }
    };

    const timer = setTimeout(findAndScroll, 100);
    const settleTimer1 = setTimeout(updatePosition, 250);
    const settleTimer2 = setTimeout(updatePosition, 450);

    return () => {
      clearTimeout(timer);
      clearTimeout(settleTimer1);
      clearTimeout(settleTimer2);
    };
  }, [run, isCompleted, currentStepIndex, currentStep, updatePosition]);

  // Handle window resize and scroll events
  useEffect(() => {
    if (!run) return;

    const handleReposition = () => {
      updatePosition();
    };

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, { passive: true });

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition);
    };
  }, [run, updatePosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!run) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        skipTour();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (isCompleted) {
          completeTour();
        } else if (currentStepIndex === totalSteps - 1) {
          setIsCompleted(true);
        } else {
          setCurrentStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (isCompleted) {
          setIsCompleted(false);
        } else {
          setCurrentStepIndex((prev) => Math.max(0, prev - 1));
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (isCompleted) {
          completeTour();
        } else if (currentStepIndex === totalSteps - 1) {
          setIsCompleted(true);
        } else {
          setCurrentStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [run, isCompleted, currentStepIndex, totalSteps, skipTour, completeTour]);

  if (!run) return null;

  // Completion Screen
  if (isCompleted) {
    return (
      <div className="tour-container" role="dialog" aria-modal="true" aria-label="UNNATI Tour Completion">
        <div className="tour-backdrop-panel tour-backdrop-full" onClick={completeTour} />
        <div
          className="tour-popup tour-completion-card"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            position: "fixed"
          }}
        >
          <span className="tour-completion-icon" aria-hidden="true">🎉</span>
          <h2 className="tour-title">{t.tourAllSetTitle || "You're all set!"}</h2>
          <p className="tour-description">
            {t.tourAllSetDesc || "Now you know how to use UNNATI. You can restart the guide anytime using the Guide button."}
          </p>

          <button
            type="button"
            className="tour-btn tour-btn-next"
            onClick={completeTour}
            autoFocus
          >
            {t.tourStartExploring || "Start Exploring"} 🌸
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);
  const progressText = (t.tourStepOf || "Step {current} of {total}")
    .replace("{current}", currentStepIndex + 1)
    .replace("{total}", totalSteps);

  const stepTitle = t[currentStep.titleKey] || currentStep.titleKey;
  const stepDesc = t[currentStep.descKey] || currentStep.descKey;
  const isFinalStep = currentStepIndex === totalSteps - 1;

  return (
    <div className="tour-container" role="dialog" aria-modal="true" aria-label={stepTitle}>
      {/* Cutout Backdrop: Dims & blurs only the area OUTSIDE the target element */}
      {!targetRect ? (
        <div className="tour-backdrop-panel tour-backdrop-full" onClick={skipTour} />
      ) : (
        <>
          {/* Top Panel */}
          <div
            className="tour-backdrop-panel"
            style={{
              top: 0,
              left: 0,
              width: "100%",
              height: `${Math.max(0, targetRect.top)}px`
            }}
            onClick={skipTour}
          />

          {/* Bottom Panel */}
          <div
            className="tour-backdrop-panel"
            style={{
              top: `${Math.min(window.innerHeight, targetRect.bottom)}px`,
              left: 0,
              width: "100%",
              bottom: 0
            }}
            onClick={skipTour}
          />

          {/* Left Panel */}
          <div
            className="tour-backdrop-panel"
            style={{
              top: `${Math.max(0, targetRect.top)}px`,
              left: 0,
              width: `${Math.max(0, targetRect.left)}px`,
              height: `${Math.max(0, targetRect.height)}px`
            }}
            onClick={skipTour}
          />

          {/* Right Panel */}
          <div
            className="tour-backdrop-panel"
            style={{
              top: `${Math.max(0, targetRect.top)}px`,
              left: `${Math.min(window.innerWidth, targetRect.right)}px`,
              right: 0,
              height: `${Math.max(0, targetRect.height)}px`
            }}
            onClick={skipTour}
          />

          {/* Target Element Spotlight Focus Ring (100% Transparent inside) */}
          <div
            className="tour-focus-frame"
            style={{
              top: `${targetRect.top}px`,
              left: `${targetRect.left}px`,
              width: `${targetRect.width}px`,
              height: `${targetRect.height}px`
            }}
          />
        </>
      )}

      {/* Interactive Tour Popup Card */}
      <div
        ref={popupRef}
        className="tour-popup"
        style={popupStyle}
      >
        <div className="tour-header">
          <span className="tour-header-badge">
            <span className="tour-icon" aria-hidden="true">{currentStep.icon}</span>
            <span>UNNATI</span>
          </span>

          <button
            type="button"
            className="tour-close-btn"
            onClick={skipTour}
            aria-label={t.tourSkip || "Close tour"}
            title={t.tourSkip || "Close tour"}
          >
            ×
          </button>
        </div>

        <h3 className="tour-title">{stepTitle}</h3>
        <p className="tour-description">{stepDesc}</p>

        {/* Progress */}
        <div className="tour-progress-wrap">
          <div className="tour-progress-label">
            <span>{progressText}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="tour-progress-track">
            <div
              className="tour-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="tour-footer">
          <button
            type="button"
            className="tour-skip-btn"
            onClick={skipTour}
          >
            {t.tourSkip || "Skip Tour"}
          </button>

          <div className="tour-btn-group">
            <button
              type="button"
              className="tour-btn tour-btn-back"
              disabled={currentStepIndex === 0}
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
            >
              {t.tourBack || "← Back"}
            </button>

            <button
              type="button"
              className="tour-btn tour-btn-next"
              onClick={() => {
                if (isFinalStep) {
                  setIsCompleted(true);
                } else {
                  setCurrentStepIndex((prev) => prev + 1);
                }
              }}
              autoFocus
            >
              {isFinalStep ? (t.tourFinish || "Finish Tour") : (t.tourNext || "Next →")}
            </button>
          </div>
        </div>

        {/* Keyboard hints */}
        <div className="tour-keyboard-hint">
          <span><kbd>←</kbd> <kbd>→</kbd> {t.tourBack || "Navigate"}</span>
          <span><kbd>Esc</kbd> {t.tourSkip || "Skip"}</span>
        </div>
      </div>
    </div>
  );
}