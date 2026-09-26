import React, { useState } from 'react';

const SAMPLE_JSON = `[
  {
    "id": "operator_01",
    "question": "What is the output of 17 // 5?",
    "options": {
      "A": "2",
      "B": "3",
      "C": "4",
      "D": "5"
    },
    "correctOption": "B",
    "explanation": "Floor division returns the quotient rounded down.",
    "topic": "Operators",
    "competitiveExam": "GATE",
    "difficulty": "Medium"
  }
]`;

const JsonQuestionImporter = ({ onImport }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [validationError, setValidationError] = useState('');
  const [previewQuestions, setPreviewQuestions] = useState([]);

  const handleFormat = () => {
    try {
      if (!jsonInput.trim()) return;
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
      setValidationError('');
    } catch (err) {
      setValidationError("Invalid JSON format");
    }
  };

  const handleValidate = () => {
    try {
      if (!jsonInput.trim()) {
        setValidationError("JSON input is empty");
        setPreviewQuestions([]);
        return;
      }
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        setValidationError("Root must be a JSON array of questions");
        setPreviewQuestions([]);
        return;
      }

      const seenIds = new Set();
      for (let i = 0; i < parsed.length; i++) {
        const q = parsed[i];
        if (!q.id) return errorOut(`Question ${i + 1}: Missing "id"`);
        if (seenIds.has(q.id)) return errorOut(`Question ${i + 1}: Duplicate id "${q.id}"`);
        seenIds.add(q.id);

        if (!q.question) return errorOut(`Question ${i + 1}: Missing "question"`);
        if (!q.options || typeof q.options !== 'object') return errorOut(`Question ${i + 1}: Missing "options" object`);
        if (!q.options.A) return errorOut(`Question ${i + 1}: Missing option "A"`);
        if (!q.options.B) return errorOut(`Question ${i + 1}: Missing option "B"`);
        if (!q.options.C) return errorOut(`Question ${i + 1}: Missing option "C"`);
        if (!q.options.D) return errorOut(`Question ${i + 1}: Missing option "D"`);
        
        if (!q.correctOption || !['A', 'B', 'C', 'D'].includes(q.correctOption)) {
          return errorOut(`Question ${i + 1}: Missing or invalid "correctOption" (must be A, B, C, or D)`);
        }
        if (!q.explanation) return errorOut(`Question ${i + 1}: Missing "explanation"`);
        if (!q.competitiveExam) return errorOut(`Question ${i + 1}: Missing "competitiveExam"`);
      }

      setValidationError('');
      setPreviewQuestions(parsed);
    } catch (err) {
      setValidationError("Invalid JSON syntax");
      setPreviewQuestions([]);
    }
  };

  const errorOut = (msg) => {
    setValidationError(msg);
    setPreviewQuestions([]);
  };

  const handleImport = () => {
    if (previewQuestions.length > 0) {
      // Map to the internal customQuestion format
      const converted = previewQuestions.map(q => ({
        id: `imported_${Date.now()}_${q.id}`,
        question: q.question,
        options: [q.options.A, q.options.B, q.options.C, q.options.D],
        correctAnswer: q.options[q.correctOption],
        explanation: q.explanation
      }));
      onImport(converted);
    }
  };

  const uniqueTopics = [...new Set(previewQuestions.map(q => q.topic).filter(Boolean))].length;
  const uniqueExams = [...new Set(previewQuestions.map(q => q.competitiveExam).filter(Boolean))].length;

  return (
    <div className="flex flex-col lg:flex-row gap-6 mt-6">
      {/* JSON Editor Side */}
      <div className="w-full lg:w-1/2 flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-base-content">JSON Editor</h3>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => {
                setJsonInput(SAMPLE_JSON);
                setValidationError('');
                setPreviewQuestions([]);
              }}
              className="text-xs px-3 py-1.5 rounded bg-base-200 hover:bg-base-300 font-medium transition-colors"
            >
              Load Sample
            </button>
            <button
              type="button"
              onClick={() => {
                setJsonInput('');
                setValidationError('');
                setPreviewQuestions([]);
              }}
              className="text-xs px-3 py-1.5 rounded bg-base-200 hover:bg-base-300 text-error font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
        
        <textarea
          className="w-full h-[500px] font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded-xl border border-base-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Paste your JSON array of questions here..."
          spellCheck="false"
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleFormat}
            className="flex-1 py-2.5 bg-base-200 hover:bg-base-300 text-base-content rounded-lg font-medium transition-colors"
          >
            Format JSON
          </button>
          <button
            type="button"
            onClick={handleValidate}
            className="flex-1 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-bold transition-colors"
          >
            Validate JSON
          </button>
        </div>

        {validationError && (
          <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error">
            <p className="font-bold text-sm mb-1">✕ Invalid JSON</p>
            <p className="text-sm">{validationError}</p>
          </div>
        )}
      </div>

      {/* Preview Side */}
      <div className="w-full lg:w-1/2 flex flex-col space-y-4">
        <h3 className="font-bold text-lg text-base-content">Question Preview</h3>
        
        <div className="bg-base-200 rounded-xl p-4 border border-base-300 flex-1 flex flex-col h-[500px]">
          {previewQuestions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-base-content/50 text-sm">
              Validate your JSON to see the preview here.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-4 justify-between items-center bg-base-100 p-3 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-success">{previewQuestions.length}</p>
                    <p className="text-[10px] text-base-content/70 uppercase tracking-wider">Total</p>
                  </div>
                  <div className="w-px h-8 bg-base-300"></div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-base-content">{uniqueTopics}</p>
                    <p className="text-[10px] text-base-content/70 uppercase tracking-wider">Topics</p>
                  </div>
                  <div className="w-px h-8 bg-base-300"></div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-base-content">{uniqueExams}</p>
                    <p className="text-[10px] text-base-content/70 uppercase tracking-wider">Exams</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {previewQuestions.map((q, idx) => (
                  <div key={idx} className="bg-base-100 p-4 rounded-lg border border-base-300 shadow-sm text-sm">
                    <div className="flex gap-3 mb-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <p className="font-semibold text-base-content mt-0.5">{q.question}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 ml-9 mb-3">
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <div key={opt} className={`flex items-start gap-2 p-1.5 rounded ${q.correctOption === opt ? 'bg-success/10 text-success font-medium' : 'text-base-content/70'}`}>
                          <span className="font-bold shrink-0">{opt}.</span>
                          <span className="truncate" title={q.options[opt]}>{q.options[opt]}</span>
                          {q.correctOption === opt && <span className="ml-auto shrink-0">✓</span>}
                        </div>
                      ))}
                    </div>

                    <div className="ml-9 flex flex-wrap gap-2 mb-3">
                      {q.topic && <span className="px-2 py-0.5 bg-base-200 border border-base-300 rounded text-xs text-base-content/80">{q.topic}</span>}
                      {q.competitiveExam && <span className="px-2 py-0.5 bg-base-200 border border-base-300 rounded text-xs text-base-content/80">{q.competitiveExam}</span>}
                      {q.difficulty && <span className="px-2 py-0.5 bg-base-200 border border-base-300 rounded text-xs text-base-content/80">{q.difficulty}</span>}
                    </div>

                    <div className="ml-9 p-3 bg-base-200/50 rounded-lg border border-base-200 text-xs">
                      <span className="font-bold text-base-content/70 block mb-1">Explanation:</span>
                      <span className="text-base-content/90">{q.explanation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          disabled={previewQuestions.length === 0}
          onClick={handleImport}
          className="w-full py-3.5 bg-success hover:bg-success/90 text-white rounded-xl font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span>Import {previewQuestions.length > 0 ? previewQuestions.length : ''} Questions to Quiz</span>
        </button>
      </div>
    </div>
  );
};

export default JsonQuestionImporter;
