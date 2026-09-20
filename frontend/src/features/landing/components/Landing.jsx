import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const Landing = () => {
  return (
    <div className="bg-base-100">
      {/* Hero Section */}
      <div className="relative isolate">
        <div className="py-24 sm:py-42.5">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-base-content sm:text-6xl">
                Test Your Knowledge.{" "}
                <span className="text-primary">Track Your Growth.</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-base-content/70">
                Practice smarter with interactive quizzes designed to improve
                your knowledge and confidence. Professional EdTech platform for
                dedicated learners.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  to="/register"
                  className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex items-center gap-2"
                >
                  Start Quiz <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="text-sm font-semibold leading-6 text-base-content"
                >
                  Explore Categories <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
