import React from "react";
import { X } from "lucide-react";

const AlertModal = ({ isOpen, onClose, title, message, type = "info", onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-bg-surface rounded-2xl shadow-xl border border-border-subtle w-full max-w-sm overflow-hidden animate-slide-up relative">
        <div className={`p-4 border-b border-border-subtle flex justify-between items-center ${type === 'error' ? 'bg-red-50' : 'bg-bg-base'}`}>
          <h3 className={`text-lg font-bold ${type === 'error' ? 'text-red-600' : 'text-text-base'}`}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:text-text-base hover:bg-bg-hover transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-text-base text-center mb-6">
            {message}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              className="w-full sm:w-auto flex justify-center py-2 px-6 border border-transparent rounded-lg shadow-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
