import React from 'react';
import { BookOpen, Trophy, Target, Lightbulb, FileText, BarChart3 } from 'lucide-react';

const Loader = ({ message = "Getting things ready..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] w-full animate-in fade-in duration-700 overflow-hidden">
      
      {/* Container for the orbital system */}
      <div className="relative w-12 h-12 flex items-center justify-center mb-24 mt-8 scale-90 sm:scale-100">
        
        {/* Glowing backdrop for the whole system */}
        <div className="absolute inset-[-80px] bg-primary/5 rounded-full blur-[60px] animate-pulse pointer-events-none"></div>

        {/* Central Node */}
        <div className="relative z-10 w-12 h-12 bg-base-300 rounded-full flex items-center justify-center border-2 border-primary shadow-[0_0_20px_hsl(var(--p)/0.4)]">
          <BookOpen className="w-6 h-6 text-primary drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
        </div>

        {/* Ring 1 - BarChart (Inner) */}
        <div className="absolute inset-[-24px] rounded-full border border-secondary/40 border-dashed animate-[spin_10s_linear_infinite]">
          {/* Glowing particle on ring */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-secondary rounded-full shadow-[0_0_8px_hsl(var(--s))]"></div>
          
          {/* Satellite */}
          <div className="absolute top-[15%] -left-2 w-6 h-6 bg-base-200 rounded-full border border-secondary shadow-[0_0_10px_hsl(var(--s)/0.5)] flex items-center justify-center animate-[spin_10s_linear_infinite_reverse]">
            <BarChart3 className="w-3 h-3 text-secondary" />
          </div>
        </div>

        {/* Ring 2 - Trophy */}
        <div className="absolute inset-[-50px] rounded-full border border-primary/40 border-dotted animate-[spin_14s_linear_infinite_reverse]">
          <div className="absolute bottom-1/4 -right-1 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--p))]"></div>
          
          {/* Satellite */}
          <div className="absolute -top-3 left-1/4 w-6 h-6 bg-base-200 rounded-full border border-primary shadow-[0_0_12px_hsl(var(--p)/0.5)] flex items-center justify-center animate-[spin_14s_linear_infinite]">
            <Trophy className="w-3 h-3 text-primary" />
          </div>
        </div>

        {/* Ring 3 - FileText */}
        <div className="absolute inset-[-76px] rounded-full border border-accent/40 border-dashed animate-[spin_18s_linear_infinite]">
          <div className="absolute top-1/3 -right-1 w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_8px_hsl(var(--a))]"></div>
          
          {/* Satellite */}
          <div className="absolute -bottom-2 left-1/3 w-6 h-6 bg-base-200 rounded-full border border-accent shadow-[0_0_12px_hsl(var(--a)/0.5)] flex items-center justify-center animate-[spin_18s_linear_infinite_reverse]">
            <FileText className="w-3 h-3 text-accent" />
          </div>
        </div>

        {/* Ring 4 - Target */}
        <div className="absolute inset-[-102px] rounded-full border border-info/40 border-dotted animate-[spin_22s_linear_infinite_reverse]">
          <div className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 bg-info rounded-full shadow-[0_0_8px_hsl(var(--in))]"></div>
          
          {/* Satellite */}
          <div className="absolute top-1/4 -right-3 w-6 h-6 bg-base-200 rounded-full border border-info shadow-[0_0_12px_hsl(var(--in)/0.5)] flex items-center justify-center animate-[spin_22s_linear_infinite]">
            <Target className="w-3 h-3 text-info" />
          </div>
        </div>

        {/* Ring 5 - Lightbulb (Outer) */}
        <div className="absolute inset-[-128px] rounded-full border border-warning/40 border-dashed animate-[spin_26s_linear_infinite]">
          <div className="absolute top-1/2 -left-1 w-1.5 h-1.5 bg-warning rounded-full shadow-[0_0_8px_hsl(var(--wa))]"></div>
          
          {/* Satellite */}
          <div className="absolute bottom-1/4 -right-2 w-6 h-6 bg-base-200 rounded-full border border-warning shadow-[0_0_10px_hsl(var(--wa)/0.5)] flex items-center justify-center animate-[spin_26s_linear_infinite_reverse]">
            <Lightbulb className="w-3 h-3 text-warning" />
          </div>
        </div>
        
      </div>

      <div className="text-center z-10 mt-16 sm:mt-20">
        <h2 className="text-2xl font-bold tracking-tight text-base-content mb-2 flex items-center justify-center gap-1 drop-shadow-lg">
          Quizzz-<span className="text-primary drop-shadow-[0_0_8px_hsl(var(--p)/0.5)]">Zone</span>
        </h2>
        <p className="text-sm font-medium text-base-content/70 animate-pulse tracking-wide uppercase">
          {message}
        </p>
      </div>
    </div>
  );
};

export default Loader;
