import React, { useState, useEffect } from "react";

/**
 * ChiragLifeline — Magical lamp lifeline UI component
 *
 * Props:
 *  lifelinesRemaining {number}  0 | 1 | 2
 *  onActivate         {async function → { success, hintOption, remaining }}
 *  disabled           {boolean}  disable when question answered or quiz paused
 *  onHintReceived     {function(hintOption)}  called when hint is ready to show
 */
const ChiragLifeline = ({ lifelinesRemaining = 2, onActivate, disabled = false, onHintReceived }) => {
  const [animState, setAnimState] = useState("idle"); // idle | glowing | jinni-out | hint | returning
  const [isAnimating, setIsAnimating] = useState(false);

  const canUse = lifelinesRemaining > 0 && !disabled && !isAnimating;

  const handleClick = async () => {
    if (!canUse) return;

    setIsAnimating(true);
    setAnimState("glowing");

    // Glow → Jinni emerges
    await delay(400);
    setAnimState("jinni-out");

    // Request lifeline from server
    const result = onActivate ? await onActivate() : { success: false };

    if (result?.success) {
      setAnimState("hint");
      if (onHintReceived) onHintReceived(result.hintOption);

      // Hold hint state
      await delay(2200);
    } else {
      await delay(300);
    }

    // Jinni returns
    setAnimState("returning");
    await delay(600);
    setAnimState("idle");
    setIsAnimating(false);
  };

  const isEmpty = lifelinesRemaining === 0;

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {/* Lamp button */}
      <button
        onClick={handleClick}
        disabled={!canUse}
        title={isEmpty ? "No lifelines remaining" : `${lifelinesRemaining} lifeline${lifelinesRemaining !== 1 ? "s" : ""} remaining — Click Chirag`}
        className={`relative flex flex-col items-center transition-all duration-300 focus:outline-none group
          ${canUse ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-not-allowed opacity-50"}
        `}
        aria-label={`Chirag lifeline — ${lifelinesRemaining} remaining`}
      >
        {/* Jinni smoke / character */}
        <div
          className={`absolute transition-all duration-500 pointer-events-none z-10
            ${animState === "jinni-out" || animState === "hint"
              ? "opacity-100 -top-16 scale-100"
              : "opacity-0 -top-4 scale-50"
            }
            ${animState === "returning" ? "opacity-0 top-0 scale-0" : ""}
          `}
          style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-2xl
              ${animState === "hint"
                ? "bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse"
                : "bg-gradient-to-br from-purple-500 to-indigo-600"
              }
            `}
            style={{
              boxShadow: animState === "hint"
                ? "0 0 20px 8px rgba(251,191,36,0.6)"
                : "0 0 16px 4px rgba(139,92,246,0.5)",
            }}
          >
            {animState === "hint" ? "✨" : "🧞"}
          </div>
        </div>

        {/* Glow ring when activating */}
        {(animState === "glowing" || animState === "jinni-out" || animState === "hint") && (
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              background: "radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 70%)",
              width: "52px",
              height: "52px",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        )}

        {/* Lamp emoji / icon */}
        <div
          className={`text-3xl transition-all duration-300 z-20 relative
            ${animState === "glowing" || animState === "jinni-out" || animState === "hint"
              ? "drop-shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-bounce"
              : isEmpty
                ? "grayscale opacity-40"
                : "group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
            }
          `}
          style={{
            filter: animState === "hint" ? "drop-shadow(0 0 14px gold)" : undefined,
          }}
        >
          🧞‍♂️
        </div>

        {/* Smoke particles when jinni is out */}
        {(animState === "jinni-out" || animState === "returning") && (
          <div className="absolute pointer-events-none" style={{ top: "-8px", left: "50%", transform: "translateX(-50%)" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-purple-400 opacity-0"
                style={{
                  animation: `smokeRise 0.8s ease-out ${i * 0.15}s forwards`,
                  left: `${(i - 1) * 6}px`,
                }}
              />
            ))}
          </div>
        )}
      </button>

      {/* Count badge */}
      <div
        className={`text-xs font-bold px-2 py-0.5 rounded-full transition-all duration-300
          ${isEmpty
            ? "bg-base-200 text-base-content/40"
            : lifelinesRemaining === 1
              ? "bg-amber-100 text-amber-700 border border-amber-300"
              : "bg-purple-100 text-purple-700 border border-purple-300"
          }
        `}
      >
        {isEmpty ? "×0" : lifelinesRemaining === 1 ? "×1" : "×2"}
      </div>

      {/* Label */}
      <span className={`text-[10px] font-bold uppercase tracking-wider ${isEmpty ? "text-base-content/30" : "text-base-content/60"}`}>
        Chirag
      </span>

      {/* Smoke animation keyframes */}
      <style>{`
        @keyframes smokeRise {
          0%   { opacity: 0.8; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-20px) scale(2); }
        }
      `}</style>
    </div>
  );
};

// Small delay utility
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default ChiragLifeline;
