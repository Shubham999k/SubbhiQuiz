import React from 'react';
import { FiGrid, FiEdit3, FiCode } from 'react-icons/fi';

const CreateQuizTabs = ({ mode, setMode }) => {
  return (
    <div className="flex w-full gap-1 sm:inline-flex sm:w-auto bg-base-100 p-1 rounded-lg border border-base-300">
      <button
        type="button"
        className={`flex-1 sm:flex-none flex items-center justify-center px-2 sm:px-6 py-2 sm:py-2.5 rounded-md font-medium text-[11px] sm:text-sm transition-colors whitespace-nowrap ${mode === "builtin"
          ? "bg-primary text-white shadow-sm"
          : "text-base-content/70 hover:text-base-content hover:bg-base-200"
          }`}
        onClick={() => setMode("builtin")}
      >
        <FiGrid className="mr-2" size={16} /> Built-in Categories
      </button>
      <button
        type="button"
        className={`flex-1 sm:flex-none flex items-center justify-center px-2 sm:px-4 py-2 sm:py-2.5 rounded-md font-medium text-[11px] sm:text-sm transition-colors whitespace-nowrap ${mode === "custom"
          ? "bg-primary text-white shadow-sm"
          : "text-base-content/70 hover:text-base-content hover:bg-base-200"
          }`}
        onClick={() => setMode("custom")}
      >
        <FiEdit3 className="mr-2" size={16} /> Custom Quiz Builder
      </button>
      <button
        type="button"
        className={`flex-1 sm:flex-none flex items-center justify-center px-2 sm:px-4 py-2 sm:py-2.5 rounded-md font-medium text-[11px] sm:text-sm transition-colors whitespace-nowrap ${mode === "json"
          ? "bg-primary text-white shadow-sm"
          : "text-base-content/70 hover:text-base-content hover:bg-base-200"
          }`}
        onClick={() => setMode("json")}
      >
        <FiCode className="mr-2" size={16} /> JSON Import
      </button>
    </div>
  );
};

export default CreateQuizTabs;
