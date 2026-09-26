import React from "react";
import { Toaster, ToastBar, toast } from "react-hot-toast";
import { X } from "lucide-react";
import AppRouter from "./app/router/AppRouter";

function App() {
  return (
    <>
      <Toaster position="top-right">
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <>
                {icon}
                {message}
                {t.type !== "loading" && (
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ml-2 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={16} />
                  </button>
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
      <AppRouter />
    </>
  );
}

export default App;
