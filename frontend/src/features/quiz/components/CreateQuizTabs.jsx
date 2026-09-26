import React from 'react';
import { FiGrid, FiEdit3, FiCode } from 'react-icons/fi';

const CreateQuizTabs = ({ mode, setMode }) => {
  return (
    <div className="flex w-full gap-1 sm:inline-flex sm:w-auto bg-base-100 p-1 rounded-lg border border-base-300">
      <button
        type="button"
        className={`flex items-center justify-center py-2 sm:py-2.5 rounded-md font-medium text-[11px] sm:text-sm transition-all duration-300 whitespace-nowrap overflow-hidden ${
          mode === "builtin"
            ? "bg-primary text-white shadow-sm flex-1 sm:flex-none px-4 sm:px-6"
            : "text-base-content/70 hover:text-base-content hover:bg-base-200 w-12 sm:w-auto sm:px-6 px-0 flex-none"
        }`}
        onClick={() => setMode("builtin")}
        title="Built-in Categories"
      >
        <FiGrid className={`${mode === "builtin" ? "mr-2" : "m-0 sm:mr-2"} shrink-0`} size={16} /> 
        <span className={`${mode === "builtin" ? "inline" : "hidden sm:inline"}`}>Built-in Categories</span>
      </button>
      
      <button
        type="button"
        className={`flex items-center justify-center py-2 sm:py-2.5 rounded-md font-medium text-[11px] sm:text-sm transition-all duration-300 whitespace-nowrap overflow-hidden ${
          mode === "custom"
            ? "bg-primary text-white shadow-sm flex-1 sm:flex-none px-4 sm:px-6"
            : "text-base-content/70 hover:text-base-content hover:bg-base-200 w-12 sm:w-auto sm:px-6 px-0 flex-none"
        }`}
        onClick={() => setMode("custom")}
        title="Custom Quiz Builder"
      >
        <FiEdit3 className={`${mode === "custom" ? "mr-2" : "m-0 sm:mr-2"} shrink-0`} size={16} /> 
        <span className={`${mode === "custom" ? "inline" : "hidden sm:inline"}`}>Custom Builder</span>
      </button>

      <button
        type="button"
        className={`flex items-center justify-center py-2 sm:py-2.5 rounded-md font-medium text-[11px] sm:text-sm transition-all duration-300 whitespace-nowrap overflow-hidden ${
          mode === "json"
            ? "bg-primary text-white shadow-sm flex-1 sm:flex-none px-4 sm:px-6"
            : "text-base-content/70 hover:text-base-content hover:bg-base-200 w-12 sm:w-auto sm:px-6 px-0 flex-none"
        }`}
        onClick={() => setMode("json")}
        title="JSON Import"
      >
        <FiCode className={`${mode === "json" ? "mr-2" : "m-0 sm:mr-2"} shrink-0`} size={16} /> 
        <span className={`${mode === "json" ? "inline" : "hidden sm:inline"}`}>JSON Import</span>
      </button>
    </div>
  );
};

export default CreateQuizTabs;
