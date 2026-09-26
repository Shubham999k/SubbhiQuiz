import React from 'react';
import Dropdown from "../../../components/ui/Dropdown";

const BuiltInCategories = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  difficulty,
  setDifficulty,
  questionCount,
  setQuestionCount
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-base-100 p-6 md:p-8 rounded-xl border border-base-300 shadow-sm">
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-semibold text-base-content mb-2"
        >
          Select Topic
        </label>
        <Dropdown
          options={categories.map((c) => ({ label: c.title || c.name, value: c.id }))}
          value={selectedCategory}
          onChange={(val) => setSelectedCategory(val)}
          placeholder="Select a category"
          className="mt-1 w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-base-content mb-2">
          Difficulty Level
        </label>
        <Dropdown
          options={[
            { label: "All", value: "all" },
            { label: "Easy", value: "easy" },
            { label: "Medium", value: "medium" },
            { label: "Hard", value: "hard" }
          ]}
          value={difficulty}
          onChange={(val) => setDifficulty(val)}
          placeholder="Select difficulty"
          className="mt-1 w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-base-content mb-2">
          Number of Questions
        </label>
        <Dropdown
          options={[
            { label: "5", value: 5 },
            { label: "10", value: 10 },
            { label: "15", value: 15 },
            { label: "20", value: 20 },
            { label: "25", value: 25 },
            { label: "30", value: 30 },
            { label: "60", value: 60 }
          ]}
          value={questionCount}
          onChange={(val) => setQuestionCount(val)}
          placeholder="Select number of questions"
          className="mt-1 w-full"
        />
      </div>
    </div>
  );
};

export default BuiltInCategories;
