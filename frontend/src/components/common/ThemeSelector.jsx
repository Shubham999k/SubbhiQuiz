import React, { useState, useEffect, useRef } from "react";
import { Palette } from "lucide-react";

const ThemeSelector = ({ className = "" }) => {
  const [mode, setMode] = useState(localStorage.getItem("mode") || "light");
  const [palette, setPalette] = useState(localStorage.getItem("theme_palette") || "claude");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", palette);
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme_palette", palette);
    localStorage.setItem("mode", mode);
  }, [palette, mode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const themeOptions = [
    { value: "claude", label: "Claude" },
    { value: "corporate", label: "Corporate" },
    { value: "gourmet", label: "Gourmet" },
    { value: "luxury", label: "Luxury" },
    { value: "mintlify", label: "Mintlify" },
    { value: "pastel", label: "Pastel" },
    { value: "perplexity", label: "Perplexity" },
    { value: "shadcn", label: "Shadcn" },
    { value: "slack", label: "Slack" },
  ];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1e1e1e] transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 flex items-center justify-center"
        aria-label="Select Theme"
      >
        <Palette size={22} className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 w-72 mt-2 bg-white dark:bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 flex h-64">

          {/* Left Column - Mode */}
          <div className="flex-1 border-r border-gray-200 dark:border-gray-700 pr-3 mr-3 overflow-y-auto scrollbar-hide">
            <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2 sticky top-0 bg-white dark:bg-[#1e1e1e] pb-1 z-10">Mode</div>
            {["light", "dark"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`w-full text-left px-3 py-2 mb-1 text-sm rounded-lg transition-colors capitalize ${mode === m
                    ? "bg-primary text-white font-semibold shadow-sm"
                    : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1e1e1e]"
                  }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Right Column - Themes */}
          <div className="flex-1 overflow-y-auto scrollbar-hide pr-1">
            <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2 sticky top-0 bg-white dark:bg-[#1e1e1e] pb-1 z-10">Themes</div>
            {themeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPalette(option.value)}
                className={`w-full text-left px-3 py-2 mb-1 text-sm rounded-lg transition-colors ${
                  palette === option.value
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1e1e1e]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
