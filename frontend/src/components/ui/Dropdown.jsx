import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const Dropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select option", 
  className = "w-56" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full bg-base-100 border border-base-300 px-4 py-2.5 rounded-lg font-medium text-sm hover:border-primary transition-colors cursor-pointer text-base-content shadow-sm gap-2"
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown 
          size={16} 
          className={`text-base-content/70 transition-transform ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-base-100 rounded-xl shadow-lg border border-base-300 p-2 flex flex-col gap-1 max-h-60 overflow-y-auto scrollbar-thin">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-colors ${
                value === option.value
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-base-content hover:bg-base-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
