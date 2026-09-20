import React from "react";
import { X } from "lucide-react";

const AlertModal = ({ isOpen, onClose, title, message, type = "info", onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-base-100 rounded-2xl shadow-xl border border-base-300 w-full max-w-sm overflow-hidden animate-slide-up relative">
        <div className={`p-4 border-b border-base-300 flex justify-between items-center ${type === 'error' ? 'bg-error/10' : 'bg-base-200'}`}>
          <h3 className={`text-lg font-bold ${type === 'error' ? 'text-error' : 'text-base-content'}`}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-base-content/70 hover:text-base-content hover:hover:bg-base-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-base-content text-center mb-6">
            {message}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              className="w-full sm:w-auto flex justify-center py-2 px-6 border border-transparent rounded-lg shadow-sm font-medium text-white bg-primary hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
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
