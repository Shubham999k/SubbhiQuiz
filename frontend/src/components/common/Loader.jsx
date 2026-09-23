import React from 'react';
import { BookOpen } from 'lucide-react';

const Loader = ({ message = "Getting things ready..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full p-8 animate-in fade-in duration-700">
      <div className="relative w-24 h-24 flex items-center justify-center mb-12">
        {/* Core */}
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
        <div className="relative z-10 bg-base-100 p-4 rounded-full border border-base-300 shadow-lg shadow-primary/20">
          <BookOpen className="w-8 h-8 text-base-content" />
        </div>

        {/* Outer Ring 1 */}
        <div className="absolute inset-[-10px] rounded-full border border-base-content/10 animate-[spin_4s_linear_infinite]">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_currentColor]"></div>
        </div>

        {/* Outer Ring 2 (Slightly larger, reverse spin) */}
        <div className="absolute inset-[-30px] rounded-full border border-base-content/10 animate-[spin_6s_linear_infinite_reverse]">
          <div className="absolute top-[20%] -right-1.5 w-2.5 h-2.5 bg-secondary rounded-full shadow-[0_0_8px_currentColor]"></div>
        </div>

        {/* Outer Ring 3 */}
        <div className="absolute inset-[-50px] rounded-full border border-base-content/5 animate-[spin_8s_linear_infinite]">
          <div className="absolute bottom-[20%] -left-1.5 w-3.5 h-3.5 bg-accent rounded-full shadow-[0_0_10px_currentColor]"></div>
        </div>
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-base-content mb-2 flex items-center gap-1">
        Quizzz-<span className="text-primary">Zone</span>
      </h2>
      <p className="text-sm font-medium text-base-content/60 animate-pulse">
        {message}
      </p>
    </div>
  );
};

export default Loader;
