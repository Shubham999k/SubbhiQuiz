import React from 'react';
import { Trash2 } from 'lucide-react';

const CustomQuestionCard = ({ q, qIndex, updateCustomQuestion, removeCustomQuestion, totalQuestions }) => {
  return (
    <div className="bg-base-200 p-6 rounded-xl border border-base-300 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-lg text-base-content">
          Question {qIndex + 1}
        </h4>
        {totalQuestions > 1 && (
          <button
            type="button"
            onClick={() => removeCustomQuestion(qIndex)}
            className="text-error hover:text-red-700 p-2 rounded-lg hover:bg-error/10 transition-colors flex items-center gap-2 text-sm font-medium"
            title="Remove Question"
          >
            <Trash2 size={18} /> Delete
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-base-content mb-2">
            Question Text
          </label>
          <textarea
            className="w-full rounded-md border-base-300 bg-base-100 text-base-content py-3 px-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border resize-y"
            style={{ minHeight: '100px' }}
            value={q.question}
            onChange={(e) => updateCustomQuestion(qIndex, "question", e.target.value)}
            placeholder="e.g. What will be the output of the following Python code?"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {q.options.map((opt, optIndex) => {
            const isCorrect = q.correctAnswer === opt && opt.trim() !== "";
            return (
              <div key={optIndex}>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-base-content">
                    Option {String.fromCharCode(65 + optIndex)}
                  </label>
                  <label className="cursor-pointer flex items-center space-x-2 text-sm font-medium text-base-content/70 hover:text-success transition-colors">
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={isCorrect}
                      onChange={() => updateCustomQuestion(qIndex, "correctAnswer", opt)}
                      disabled={!opt.trim()}
                      className="radio radio-success radio-sm"
                    />
                    <span className={isCorrect ? "font-bold text-success" : ""}>Mark Correct</span>
                  </label>
                </div>
                <textarea
                  className={`w-full rounded-md bg-base-100 text-base-content py-3 px-4 text-sm focus:outline-none border transition-all resize-y ${
                    isCorrect
                      ? 'border-success ring-1 ring-success bg-success/5'
                      : 'border-base-300 focus:border-primary focus:ring-1 focus:ring-primary'
                  }`}
                  style={{ minHeight: '80px' }}
                  value={opt}
                  onChange={(e) => updateCustomQuestion(qIndex, "options", e.target.value, optIndex)}
                  placeholder={`Write option ${String.fromCharCode(65 + optIndex)} here...`}
                  required
                />
              </div>
            );
          })}
        </div>

        <div>
          <label className="block text-sm font-semibold text-base-content mb-2">
            Explanation (Optional)
          </label>
          <textarea
            className="w-full rounded-md border-base-300 bg-base-100 text-base-content py-3 px-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border resize-y"
            style={{ minHeight: '120px' }}
            value={q.explanation}
            onChange={(e) => updateCustomQuestion(qIndex, "explanation", e.target.value)}
            placeholder="Explain why the selected answer is correct..."
          />
        </div>
      </div>
    </div>
  );
};

export default CustomQuestionCard;
