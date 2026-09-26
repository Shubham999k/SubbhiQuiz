import { useEffect, useRef, useState, useCallback } from "react";

const MAX_VIOLATIONS = 3;
const DEBOUNCE_MS = 800; // prevent visibility+blur from double-counting

/**
 * useQuizRestrictions — anti-cheating hook for active quiz screen
 *
 * @param {object} options
 * @param {function} options.onViolation   Called with (eventType) when violation recorded
 * @param {boolean}  options.enabled       Must be true to activate restrictions
 * @param {boolean}  options.fullscreenRequired  Whether to enforce fullscreen
 * @param {number}   options.maxViolations Override default MAX_VIOLATIONS
 * @param {number}   options.currentQuestionIndex For logging which question
 *
 * @returns {object} { violations, warningLevel, isLocked, showWarning, dismissWarning,
 *                     showFullscreenWarning, fullscreenActive, requestFullscreen,
 *                     unlockStudent, lockStudentLocally }
 */
export function useQuizRestrictions({
  onViolation = null,
  enabled = true,
  fullscreenRequired = false,
  maxViolations = MAX_VIOLATIONS,
  currentQuestionIndex = 0,
} = {}) {
  const [violations, setViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningLevel, setWarningLevel] = useState(1); // 1 = first, 2 = second, 3+ = locked
  const [isLocked, setIsLocked] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);

  // Debounce ref — prevent counting one action as two violations
  const lastViolationRef = useRef(0);
  const violationsRef = useRef(0);
  const lockedRef = useRef(false);
  const questionIndexRef = useRef(currentQuestionIndex);

  useEffect(() => {
    questionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  const recordViolation = useCallback(
    (eventType) => {
      if (!enabled || lockedRef.current) return;

      // Debounce — if same event fired twice within 800ms, skip
      const now = Date.now();
      if (now - lastViolationRef.current < DEBOUNCE_MS) return;
      lastViolationRef.current = now;

      violationsRef.current += 1;
      const count = violationsRef.current;

      setViolations(count);
      setWarningLevel(count);
      setShowWarning(true);

      if (count >= maxViolations) {
        lockedRef.current = true;
        setIsLocked(true);
      }

      // Report to parent/server
      if (onViolation) onViolation(eventType, questionIndexRef.current);
    },
    [enabled, maxViolations, onViolation]
  );

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
  }, []);

  const unlockStudent = useCallback(() => {
    violationsRef.current = 0;
    lockedRef.current = false;
    setViolations(0);
    setWarningLevel(1);
    setIsLocked(false);
    setShowWarning(false);
  }, []);

  const lockStudentLocally = useCallback(() => {
    violationsRef.current = Math.max(violationsRef.current, maxViolations);
    lockedRef.current = true;
    setViolations(violationsRef.current);
    setWarningLevel(violationsRef.current);
    setIsLocked(true);
    setShowWarning(false);
  }, [maxViolations]);

  // ─── Fullscreen ──────────────────────────────────────────────
  const requestFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
    setShowFullscreenWarning(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      const isFS =
        !!document.fullscreenElement ||
        !!document.webkitFullscreenElement ||
        !!document.mozFullScreenElement;

      setFullscreenActive(isFS);

      if (fullscreenRequired && !isFS) {
        setShowFullscreenWarning(true);
        recordViolation("FULLSCREEN_EXIT");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
    };
  }, [enabled, fullscreenRequired, recordViolation]);

  // ─── Page Visibility (tab switch / minimize) ─────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        recordViolation("TAB_SWITCH");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [enabled, recordViolation]);

  // ─── Window blur/focus ────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleBlur = () => recordViolation("WINDOW_BLUR");

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [enabled, recordViolation]);

  // ─── Copy / Paste / Cut / Right-click restriction ─────────────
  useEffect(() => {
    if (!enabled) return;

    const prevent = (e, type) => {
      e.preventDefault();
      e.stopPropagation();
      recordViolation(type);
    };

    const handleCopy = (e) => prevent(e, "COPY_ATTEMPT");
    const handlePaste = (e) => prevent(e, "PASTE_ATTEMPT");
    const handleCut = (e) => prevent(e, "CUT_ATTEMPT");
    const handleContextMenu = (e) => prevent(e, "CONTEXT_MENU_ATTEMPT");

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("cut", handleCut);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [enabled, recordViolation]);

  // ─── Drag prevention ─────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleDragStart = (e) => e.preventDefault();
    document.addEventListener("dragstart", handleDragStart);
    return () => document.removeEventListener("dragstart", handleDragStart);
  }, [enabled]);

  // ─── Keyboard restrictions ────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Allow normal typing in inputs/textareas
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const ctrl = e.ctrlKey || e.metaKey;

      const restrictedKeys = ["c", "v", "x", "a", "u", "s", "p"];
      if (ctrl && restrictedKeys.includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        recordViolation("KEYBOARD_RESTRICTION");
        return;
      }

      // F12 — DevTools shortcut (best-effort)
      if (e.key === "F12") {
        e.preventDefault();
        recordViolation("KEYBOARD_RESTRICTION");
      }

      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C — DevTools
      if (ctrl && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        recordViolation("KEYBOARD_RESTRICTION");
      }
    };

    document.addEventListener("keydown", handleKeyDown, true); // capture phase
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [enabled, recordViolation]);

  // ─── Text selection prevention (CSS injection) ────────────────
  useEffect(() => {
    if (!enabled) return;

    const style = document.createElement("style");
    style.id = "quiz-restrictions-style";
    style.textContent = `
      .quiz-active-screen {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const el = document.getElementById("quiz-restrictions-style");
      if (el) el.remove();
    };
  }, [enabled]);

  return {
    violations,
    warningLevel,
    isLocked,
    showWarning,
    dismissWarning,
    showFullscreenWarning,
    fullscreenActive,
    requestFullscreen,
    unlockStudent,
    lockStudentLocally,
  };
}
