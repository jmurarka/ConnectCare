import React, { useState } from 'react';
import { Target, BookOpen, CheckCircle, ArrowRight, ShieldCheck, Clock, Award, Filter } from 'lucide-react';

export default function GoalCourseExplorerView({ onNavigate }) {
  const [selectedGoal, setSelectedGoal] = useState('aiml_engineer');
  const [filterLevel, setFilterLevel] = useState('all');

  const goals = [
    {
      id: 'aiml_engineer',
      title: 'Become AI/ML & LLM Solutions Engineer',
      description: 'Master full-stack AI from math foundations, scikit-learn models, neural networks, to RAG applications and MLOps deployment.',
      competencies: ['Python & Data Wrangling', 'Linear Algebra & Calculus', 'Supervised & Unsupervised ML', 'Neural Networks & CNNs', 'Transformers & RAG', 'FastAPI & MLOps'],
      recommendedCourses: ['AIML-01', 'AIML-02', 'AIML-03', 'AIML-04', 'AIML-05', 'AIML-06']
    },
    {
      id: 'data_scientist',
      title: 'Become Data Science & Analytics Specialist',
      description: 'Focus on exploratory data analysis, statistics, hypothesis testing, predictive regression and data storytelling.',
      competencies: ['Python & pandas', 'Statistics & Probability', 'Feature Engineering', 'Supervised Learning', 'Model Evaluation'],
      recommendedCourses: ['AIML-01', 'AIML-02', 'AIML-06']
    },
    {
      id: 'mlops_engineer',
      title: 'Become MLOps & AI Infrastructure Engineer',
      description: 'Focus on production model serving, containerization with Docker, MLflow tracking, data drift monitoring and NIST Responsible AI.',
      competencies: ['FastAPI REST APIs', 'Docker Containerization', 'Experiment Tracking', 'Data Drift Detection', 'Responsible AI Model Cards'],
      recommendedCourses: ['AIML-01', 'AIML-02', 'AIML-05']
    }
  ];

  const currentGoalObj = goals.find(g => g.id === selectedGoal);

  const courses = [
    {
      code: 'AIML-00',
      title: 'Orientation and Diagnostic Assessment',
      level: 'Beginner',
      duration: '2 hours',
      trainer: 'Dr. Rajesh Kumar',
      prerequisites: 'None',
      description: 'Course orientation, AI vs ML vs DL overview, and pre-enrollment 20-question diagnostic entry gate.',
      badge: 'Entry Gate'
    },
    {
      code: 'AIML-01',
      title: 'Python, Math and Data Foundations',
      level: 'Beginner',
      duration: '30 hours (4-6 weeks)',
      trainer: 'Dr. Rajesh Kumar',
      prerequisites: 'Diagnostic score < 15',
      description: 'Python programming, CS50 foundations, linear algebra intuition, probability, NumPy, pandas & Matplotlib.',
      badge: 'Foundations'
    },
    {
      code: 'AIML-02',
      title: 'Core Machine Learning',
      level: 'Beginner-Intermediate',
      duration: '45 hours (5-7 weeks)',
      trainer: 'Dr. Rajesh Kumar',
      prerequisites: 'AIML-01 or Diagnostic >= 15',
      description: 'Supervised learning, regression, classification (Trees, Random Forests), evaluation metrics, clustering & PCA.',
      badge: 'Core ML'
    },
    {
      code: 'AIML-03',
      title: 'Deep Learning & Neural Networks',
      level: 'Intermediate',
      duration: '40 hours (4-6 weeks)',
      trainer: 'Dr. Rajesh Kumar',
      prerequisites: 'AIML-02 (Core ML)',
      description: 'Feed-forward neural networks, backpropagation, CNNs, computer vision, PyTorch basics & transfer learning.',
      badge: 'Deep Learning'
    },
    {
      code: 'AIML-04',
      title: 'NLP, Transformers and LLM Applications',
      level: 'Intermediate',
      duration: '40 hours (4-6 weeks)',
      trainer: 'Dr. Rajesh Kumar',
      prerequisites: 'AIML-02 or AIML-03',
      description: 'Tokenization, word embeddings, transformer attention, Hugging Face, RAG (Retrieval-Augmented Generation) & AI Agents.',
      badge: 'Generative AI'
    },
    {
      code: 'AIML-05',
      title: 'MLOps, Deployment and Responsible AI',
      level: 'Intermediate',
      duration: '25 hours (3-4 weeks)',
      trainer: 'Dr. Rajesh Kumar',
      prerequisites: 'AIML-02 or AIML-04',
      description: 'Model serving with FastAPI, Docker, experiment tracking with MLflow, data drift monitoring & NIST Responsible AI model cards.',
      badge: 'MLOps'
    },
    {
      code: 'AIML-06',
      title: 'Capstone Portfolio',
      level: 'Intermediate',
      duration: '30 hours (3-4 weeks)',
      trainer: 'Dr. Rajesh Kumar',
      prerequisites: 'AIML-01 through AIML-05',
      description: 'End-to-end industrial portfolio project development with public repository, model card, and live API deployment.',
      badge: 'Capstone'
    }
  ];

  const filteredCourses = courses.filter(c => filterLevel === 'all' || c.level.toLowerCase().includes(filterLevel.toLowerCase()));

  return (
    <div className="space-y-6">
      
      {/* Goal Setup Header Banner */}
      <div className="inst-card p-6 bg-white border border-[#E5E5E2] rounded-xl space-y-4">
        <div className="flex items-center space-x-2 text-[#174A7E]">
          <Target className="w-5 h-5" />
          <h1 className="text-xl font-bold text-gray-900">Career Goal & Competency Explorer</h1>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 max-w-3xl leading-relaxed">
          Select your career or capacity objective. Capacity Connect's Knowledge Graph engine maps required target competencies to the optimal institutional course trajectory.
        </p>

        {/* Goal Selector Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {goals.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGoal(g.id)}
              className={`p-3 text-left rounded-lg border text-xs transition-all ${
                selectedGoal === g.id
                  ? 'bg-[#EAF2F8] border-[#174A7E] text-[#12395F] font-semibold shadow-sm'
                  : 'bg-white border-[#E5E5E2] text-gray-700 hover:bg-gray-50'
              }`}
            >
              <p className="font-bold text-sm mb-1">{g.title}</p>
              <p className="text-[11px] text-gray-500 line-clamp-2">{g.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Goal Competencies Box */}
      <div className="inst-card p-5 bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl space-y-3">
        <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#174A7E]" />
          <span>Required Competencies for {currentGoalObj.title}</span>
        </h2>

        <div className="flex flex-wrap gap-2">
          {currentGoalObj.competencies.map((comp, idx) => (
            <span key={idx} className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-white text-gray-800 border border-[#E5E5E2] shadow-xs">
              <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              {comp}
            </span>
          ))}
        </div>
      </div>

      {/* Course Catalogue Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Institutional AI/ML Course Catalogue</h2>
            <p className="text-xs text-gray-500">SWAYAM / NPTEL Structured Curriculum</p>
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="text-xs border border-gray-300 rounded-md px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#174A7E]"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
            </select>
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCourses.map((c) => (
            <div key={c.code} className="inst-card inst-card-hover p-5 rounded-xl flex flex-col justify-between space-y-4">
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#174A7E] bg-[#EAF2F8] px-2.5 py-0.5 rounded border border-[#D4E5F2]">
                    {c.code}
                  </span>
                  <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    {c.level}
                  </span>
                </div>

                <h3 className="font-bold text-base text-gray-900 leading-snug">{c.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{c.description}</p>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Duration: {c.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="w-3.5 h-3.5 text-gray-400" />
                    <span>Prereq: {c.prerequisites}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-gray-500 font-medium">Instructor: {c.trainer}</span>

                  <button
                    onClick={() => onNavigate('diagnostic')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#174A7E] hover:bg-[#12395F] rounded-md transition-colors"
                  >
                    <span>Diagnostic & Enroll</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
