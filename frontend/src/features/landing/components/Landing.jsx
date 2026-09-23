import React from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  Users, 
  FileText, 
  Trophy,
  FlaskConical,
  Calculator,
  Monitor,
  Code,
  Globe,
  Newspaper
} from "lucide-react";

const PopularCategoryCard = ({ icon: Icon, title, count, iconColor, bgLight }) => (
  <div className="flex flex-col items-center justify-center p-6 bg-base-100 rounded-2xl border border-base-200 shadow-sm hover:shadow-md transition-all group min-w-[160px] cursor-pointer">
    <div className={`p-4 rounded-xl mb-4 ${bgLight} text-${iconColor} group-hover:scale-110 transition-transform`}>
      <Icon className={`w-8 h-8 text-${iconColor}`} />
    </div>
    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">{title}</h3>
    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{count} Quizzes</p>
    <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
  </div>
);

const Landing = () => {
  return (
    <div className="bg-white dark:bg-[#121212] transition-colors min-h-full">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-8 md:pt-12 pb-16">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-4">
          
          {/* Left Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <p className="text-sm font-semibold tracking-[0.2em] text-gray-900 dark:text-gray-100/60 mb-6 uppercase">
              Learn • Practice • Grow
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 mb-6 leading-[1.15]">
              Test Your Knowledge.<br />
              <span className="text-primary">Track Your Growth.</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              Practice smarter with interactive quizzes designed to improve
              your knowledge and confidence. Professional EdTech platform for
              dedicated learners.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-16">
              <Link
                to="/register"
                className="w-full sm:w-auto rounded-lg bg-primary px-8 py-3.5 text-base font-bold text-primary-content shadow-md hover:brightness-95 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                Start Quiz <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/categories"
                className="w-full sm:w-auto rounded-lg bg-transparent border-2 border-base-300 px-8 py-3.5 text-base font-bold text-gray-900 dark:text-gray-100 hover:border-base-content transition-all flex items-center justify-center gap-2"
              >
                Explore Categories <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-12 border-t border-base-200 pt-8">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div className="text-left">
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">10K+</p>
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100/60">Learners</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div className="text-left">
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">50+</p>
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100/60">Categories</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-primary" />
                <div className="text-left">
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">95%</p>
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100/60">Satisfaction</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="flex-1 w-full max-w-[600px] lg:max-w-none relative">
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl aspect-[4/3] bg-gray-50 dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800">
              <img 
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                alt="Laptop and books" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
              {/* Floating Element over Image */}
              <div className="absolute bottom-6 right-6 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-sm p-5 rounded-2xl shadow-xl animate-bounce-slow">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Better Questions</p>
                <p className="text-xs text-primary font-medium mb-3">A Brighter You</p>
                <div className="flex items-end gap-1.5 h-8">
                  <div className="w-2.5 h-4 bg-primary/40 rounded-t-sm"></div>
                  <div className="w-2.5 h-5 bg-primary/60 rounded-t-sm"></div>
                  <div className="w-2.5 h-6 bg-primary/80 rounded-t-sm"></div>
                  <div className="w-2.5 h-8 bg-primary rounded-t-sm"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Popular Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Popular Categories</h2>
          <Link to="/categories" className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex overflow-x-auto pb-6 gap-4 scrollbar-hide snap-x">
          <div className="snap-start shrink-0">
            <PopularCategoryCard 
              icon={FlaskConical} 
              title="Science" 
              count="120+" 
              iconColor="orange-500" 
              bgLight="bg-orange-500/10" 
            />
          </div>
          <div className="snap-start shrink-0">
            <PopularCategoryCard 
              icon={Calculator} 
              title="Mathematics" 
              count="100+" 
              iconColor="red-500" 
              bgLight="bg-red-500/10" 
            />
          </div>
          <div className="snap-start shrink-0">
            <PopularCategoryCard 
              icon={Monitor} 
              title="Technology" 
              count="90+" 
              iconColor="cyan-500" 
              bgLight="bg-cyan-500/10" 
            />
          </div>
          <div className="snap-start shrink-0">
            <PopularCategoryCard 
              icon={Code} 
              title="Programming" 
              count="150+" 
              iconColor="blue-500" 
              bgLight="bg-blue-500/10" 
            />
          </div>
          <div className="snap-start shrink-0">
            <PopularCategoryCard 
              icon={Globe} 
              title="General Knowledge" 
              count="200+" 
              iconColor="indigo-500" 
              bgLight="bg-indigo-500/10" 
            />
          </div>
          <div className="snap-start shrink-0">
            <PopularCategoryCard 
              icon={Newspaper} 
              title="Current Affairs" 
              count="80+" 
              iconColor="teal-500" 
              bgLight="bg-teal-500/10" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
