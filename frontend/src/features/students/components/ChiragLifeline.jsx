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
      <button
        onClick={handleClick}
        disabled={!canUse}
        title={isEmpty ? "No lifelines remaining" : `${lifelinesRemaining} lifeline${lifelinesRemaining !== 1 ? "s" : ""} remaining — Click Chirag`}
        className={`relative flex flex-col items-center transition-all duration-300 focus:outline-none group
          ${canUse ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-not-allowed opacity-50"}
        `}
        aria-label={`Chirag lifeline — ${lifelinesRemaining} remaining`}
      >
        {/* Count badge absolute top-right */}
        <div
          className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md z-30 transition-all duration-300 border border-white
            ${isEmpty ? "bg-gray-400 text-white" : "bg-green-500 text-white"}`}
        >
          {lifelinesRemaining}
        </div>
        {/* Jinni smoke / character */}
        <div
          className={`absolute transition-all duration-700 pointer-events-none z-10 flex flex-col items-center justify-center
            ${animState === "jinni-out" || animState === "hint"
              ? "opacity-100 -top-28 scale-100"
              : "opacity-0 top-2 scale-0"
            }
            ${animState === "returning" ? "opacity-0 top-4 scale-0" : ""}
          `}
          style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          {/* Hint Bubble / Jinni */}
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-5xl shadow-2xl z-20 relative
              ${animState === "hint"
                ? "bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse"
                : "bg-gradient-to-br from-purple-500 to-indigo-600"
              }
            `}
            style={{
              boxShadow: animState === "hint"
                ? "0 0 30px 10px rgba(251,191,36,0.7)"
                : "0 0 24px 8px rgba(139,92,246,0.6)",
            }}
          >
            {animState === "hint" ? "✨" : "🧞"}
          </div>

          {/* Trailing Smoke for the Jinni */}
          {(animState === "jinni-out" || animState === "hint") && (
            <div className="absolute -bottom-8 w-12 h-16 flex flex-col items-center justify-end z-10 pointer-events-none opacity-60">
               <div className="w-8 h-8 bg-purple-400/50 rounded-full blur-md animate-smoke-1"></div>
               <div className="w-6 h-6 bg-purple-300/40 rounded-full blur-sm animate-smoke-2 -mt-3"></div>
               <div className="w-4 h-4 bg-indigo-300/30 rounded-full blur-sm animate-smoke-3 -mt-2"></div>
            </div>
          )}
        </div>

        {/* Glow ring when activating */}
        {(animState === "glowing" || animState === "jinni-out" || animState === "hint") && (
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              background: "radial-gradient(circle, rgba(251,191,36,0.5) 0%, transparent 70%)",
              width: "100px",
              height: "100px",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        )}

        {/* Lamp Image */}
        <div
          className={`transition-all duration-300 z-20 relative flex items-center justify-center
            ${animState === "glowing" || animState === "jinni-out" || animState === "hint"
              ? "drop-shadow-[0_0_20px_rgba(251,191,36,0.9)] animate-bounce"
              : isEmpty
                ? "grayscale opacity-40"
                : "group-hover:drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]"
            }
          `}
          style={{
            filter: animState === "hint" ? "drop-shadow(0 0 20px gold)" : undefined,
          }}
        >
          <img src="/chirag.png" alt="Chirag Lamp" className="w-20 h-20 object-contain" />
        </div>
      </button>

      {/* Removed old count badge */}

      {/* Label */}
      <span className={`text-[10px] font-bold uppercase tracking-wider ${isEmpty ? "text-base-content/30" : "text-base-content/60"}`}>
        Chirag
      </span>

      {/* Smoke animation keyframes */}
      <style>{`
        @keyframes smoke-1 {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-20px) scale(1.5) rotate(15deg); opacity: 0; }
        }
        @keyframes smoke-2 {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0; }
          40% { opacity: 0.8; }
          100% { transform: translateY(-15px) scale(2) rotate(-10deg); opacity: 0; }
        }
        @keyframes smoke-3 {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          60% { opacity: 0.6; }
          100% { transform: translateY(-10px) scale(1.2); opacity: 0; }
        }
        .animate-smoke-1 { animation: smoke-1 2s infinite ease-in-out; }
        .animate-smoke-2 { animation: smoke-2 1.8s infinite ease-in-out 0.2s; }
        .animate-smoke-3 { animation: smoke-3 1.5s infinite ease-in-out 0.4s; }
      `}</style>
    </div>
  );
};

// Small delay utility
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default ChiragLifeline;
