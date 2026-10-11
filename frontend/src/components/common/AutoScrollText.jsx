import React, { useRef, useState, useEffect } from "react";

/**
 * AutoScrollText
 * - Only scrolls if text width overflows container.
 * - Continuous one-directional marquee from right to left.
 * - When the next copy arrives from the right and reaches the start position (x = 0),
 *   it pauses for ~1.2s before continuing to move automatically.
 * - Pauses on hover when cursor is directly over the title.
 */
const AutoScrollText = ({
  children,
  text,
  className = "",
  containerClassName = "",
  as: Component = "h3",
  pauseOnHover = true,
}) => {
  const content = children !== undefined && children !== null ? children : text;
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const itemRef = useRef(null);

  const [isOverflowing, setIsOverflowing] = useState(false);
  const [shiftDistance, setShiftDistance] = useState(0);
  const [duration, setDuration] = useState(8);

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const textEl = textRef.current;
      if (!container || !textEl) return;

      const containerWidth = container.clientWidth;
      const textWidth = textEl.scrollWidth;

      if (textWidth > containerWidth + 2) {
        setIsOverflowing(true);
        // Use rendered item width (text width + 48px gap) or fallback
        const itemWidth = itemRef.current ? itemRef.current.offsetWidth : textWidth + 48;
        setShiftDistance(itemWidth);

        // Constant comfortable reading speed (~35px/s) + 1.2s pause at start
        const moveTime = Math.max(4, Math.round(itemWidth / 35));
        const totalDuration = moveTime + 1.2;
        setDuration(totalDuration);
      } else {
        setIsOverflowing(false);
        setShiftDistance(0);
      }
    };

    measure();

    let resizeObserver = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        measure();
      });
      resizeObserver.observe(containerRef.current);
    }

    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }

    const timer = setTimeout(measure, 100);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      clearTimeout(timer);
    };
  }, [content, isOverflowing]);

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden whitespace-nowrap block relative ${containerClassName}`}
      title={typeof content === "string" ? content : undefined}
    >
      <style>
        {`
          @keyframes title-marquee-scroll {
            0%, 15% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(calc(0px - var(--marquee-shift, 0px)));
            }
          }
          .animate-title-marquee {
            display: inline-flex;
            white-space: nowrap;
            animation: title-marquee-scroll var(--marquee-duration, 8s) linear infinite;
            will-change: transform;
          }
          .animate-title-marquee:hover {
            animation-play-state: paused;
          }
        `}
      </style>

      {isOverflowing ? (
        <div
          className={`inline-flex whitespace-nowrap animate-title-marquee ${
            pauseOnHover ? "hover:[animation-play-state:paused]" : ""
          }`}
          style={{
            "--marquee-shift": `${shiftDistance}px`,
            "--marquee-duration": `${duration}s`,
          }}
        >
          <div ref={itemRef} className="inline-flex items-center shrink-0 pr-12">
            <Component
              ref={textRef}
              className={`inline-block whitespace-nowrap ${className}`}
            >
              {content}
            </Component>
          </div>
          <div className="inline-flex items-center shrink-0 pr-12" aria-hidden="true">
            <Component className={`inline-block whitespace-nowrap ${className}`}>
              {content}
            </Component>
          </div>
        </div>
      ) : (
        <Component
          ref={textRef}
          className={`inline-block whitespace-nowrap ${className}`}
        >
          {content}
        </Component>
      )}
    </div>
  );
};

export default AutoScrollText;
