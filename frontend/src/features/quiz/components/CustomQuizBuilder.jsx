import React from 'react';
import { Plus, Undo2, Redo2 } from 'lucide-react';
import CustomQuestionCard from './CustomQuestionCard';

const CustomQuizBuilder = ({
  customQuestions,
  updateCustomQuestion,
  removeCustomQuestion,
  addCustomQuestion,
  handleUndo,
  handleRedo,
  undoStack,
  redoStack
}) => {
  return (
    <div className="space-y-6">
      <div className="fixed bottom-24 right-8 z-[60] flex flex-col space-y-3 bg-base-100 p-2.5 rounded-2xl shadow-2xl border border-base-300 transition-all">
        <button
          type="button"
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          className="p-3 bg-base-200 text-base-content hover:bg-base-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={24} />
        </button>
        <button
          type="button"
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className="p-3 bg-base-200 text-base-content hover:bg-base-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={24} />
        </button>
      </div>

      {customQuestions.map((q, qIndex) => (
        <CustomQuestionCard
          key={q.id}
          q={q}
          qIndex={qIndex}
          updateCustomQuestion={updateCustomQuestion}
          removeCustomQuestion={removeCustomQuestion}
          totalQuestions={customQuestions.length}
        />
      ))}

      <button
        type="button"
        onClick={addCustomQuestion}
        className="w-full py-4 border-2 border-dashed border-base-300 rounded-xl text-base-content/70 font-semibold hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 bg-base-100/50 hover:bg-base-100"
      >
        <Plus size={20} /> Add Another Question
      </button>
    </div>
  );
};

export default CustomQuizBuilder;
