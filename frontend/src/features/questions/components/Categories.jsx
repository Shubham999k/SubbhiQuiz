import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api";
import {
  FileCode2,
  Coffee,
  Code2,
  TerminalSquare,
  Layout,
  Palette,
  Database,
  Network,
} from "lucide-react";

const iconMap = {
  FileCode2,
  Coffee,
  Code2,
  TerminalSquare,
  Layout,
  Palette,
  Database,
  Network,
};

const dummyCategories = [
  {
    id: "python",
    name: "Python",
    description: "Test your knowledge of Python.",
    icon: "FileCode2",
    quizCount: 12,
  },
  {
    id: "java",
    name: "Java",
    description: "Object-oriented programming concepts.",
    icon: "Coffee",
    quizCount: 8,
  },
  {
    id: "react",
    name: "React",
    description: "Component lifecycle, hooks, context API.",
    icon: "Code2",
    quizCount: 15,
  },
  {
    id: "javascript",
    name: "JavaScript",
    description: "ES6+, closures, async.",
    icon: "TerminalSquare",
    quizCount: 20,
  },
  {
    id: "html",
    name: "HTML",
    description: "Semantic HTML, forms, accessibility.",
    icon: "Layout",
    quizCount: 5,
  },
  {
    id: "css",
    name: "CSS",
    description: "Flexbox, Grid, animations.",
    icon: "Palette",
    quizCount: 10,
  },
  {
    id: "sql",
    name: "SQL",
    description: "Query writing, joins, indexing.",
    icon: "Database",
    quizCount: 14,
  },
  {
    id: "dsa",
    name: "DSA",
    description: "Data Structures & Algorithms.",
    icon: "Network",
    quizCount: 25,
  },
];

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.getCategories();
        if (data && data.length > 0) {
          setCategories(data);
        } else {
          setCategories(dummyCategories);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
        setCategories(dummyCategories);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-bg-base rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-bg-surface p-6 rounded-xl border border-border-subtle h-48"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-base">Quiz Categories</h1>
        <p className="mt-1 text-sm text-text-muted">
          Select a topic to start practicing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((category) => {
          const Icon = iconMap[category.icon] || FileCode2;

          return (
            <div
              key={category.id}
              className="bg-bg-surface rounded-xl shadow-sm border border-border-subtle p-6 flex flex-col hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-lg bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-text-base">
                    {category.name}
                  </h3>
                  <p className="text-xs font-medium text-primary-600">
                    {category.quizCount} Quizzes
                  </p>
                </div>
              </div>
              <p className="text-sm text-text-muted flex-grow mb-6">
                {category.description}
              </p>
              <Link
                to={`/quiz/setup?category=${category.id}`}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Start Practice
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Categories;
