import React, { useState } from 'react';
import { BookOpen, Play, FileText, ExternalLink, CheckCircle2, MessageSquare, Award, ArrowRight } from 'lucide-react';
import { traineeApi } from '../../api/traineeApi';


export default function LessonPlayerView({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('lesson'); // 'lesson' | 'quiz' | 'discussion'
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const handleSelectQuiz = (qId, optionIdx) => {
    setQuizAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  const handleQuizSubmit = async () => {
    setQuizSubmitted(true);
    try {
      await traineeApi.completeLesson(2, 2);
    } catch (e) {
      console.error(e);
    }
  };


  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="inst-card p-5 bg-white border border-[#E5E5E2] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#174A7E] mb-1">
            <span className="text-xs font-bold bg-[#EAF2F8] px-2 py-0.5 rounded">AIML-02 &bull; Module 2.2</span>
            <span className="text-xs font-semibold text-gray-500">Supervised Learning</span>
          </div>
          <h1 className="text-lg font-bold text-gray-900">Linear & Logistic Regression Metrics (MAE, RMSE, ROC-AUC)</h1>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-[#F7F7F5] p-1 rounded-lg border border-[#E5E5E2] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('lesson')}
            className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === 'lesson' ? 'bg-[#174A7E] text-white shadow-sm' : 'text-gray-600'}`}
          >
            Lesson & Resources
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === 'quiz' ? 'bg-[#174A7E] text-white shadow-sm' : 'text-gray-600'}`}
          >
            Formative Quiz
          </button>
          <button
            onClick={() => setActiveTab('discussion')}
            className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === 'discussion' ? 'bg-[#174A7E] text-white shadow-sm' : 'text-gray-600'}`}
          >
            Discussion
          </button>
        </div>
      </div>

      {/* LESSON TAB */}
      {activeTab === 'lesson' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Media Player Container (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Video / Resource Container */}
            <div className="inst-card overflow-hidden rounded-xl border border-[#E5E5E2] bg-black">
              <div className="aspect-video bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center justify-center p-6 text-center space-y-3">
                <Play className="w-12 h-12 text-[#174A7E] fill-[#174A7E] p-2 bg-white rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform" />
                <div>
                  <h3 className="font-bold text-base">Google ML Crash Course: Linear Regression & Loss Minimization</h3>
                  <p className="text-xs text-gray-400 mt-1">Official Curated Embedded Lecture (Duration: 18 min)</p>
                </div>
              </div>
            </div>

            {/* Key Takeaways & Summary Notes */}
            <div className="inst-card p-6 bg-white border border-[#E5E5E2] rounded-xl space-y-4">
              <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-2">
                Key Concept Takeaways
              </h3>

              <ul className="space-y-2 text-xs sm:text-sm text-gray-700 leading-relaxed list-disc list-inside">
                <li><span className="font-semibold text-gray-900">Linear Regression</span> predicts continuous numeric outputs using weighted linear combinations of input features.</li>
                <li><span className="font-semibold text-gray-900">Mean Absolute Error (MAE)</span> measures average magnitude of errors without considering direction; <span className="font-semibold text-gray-900">Root Mean Squared Error (RMSE)</span> penalizes large errors more heavily.</li>
                <li><span className="font-semibold text-gray-900">Logistic Regression</span> applies the Sigmoid activation function to constrain predictions between 0 and 1 for binary classification tasks.</li>
                <li><span className="font-semibold text-gray-900">ROC-AUC Curve</span> measures the trade-off between True Positive Rate (Recall) and False Positive Rate across all decision thresholds.</li>
              </ul>
            </div>

          </div>

          {/* Right Column: Downloadable Notes & External Resources */}
          <div className="space-y-4">
            
            <div className="inst-card p-5 bg-white border border-[#E5E5E2] rounded-xl space-y-3">
              <h3 className="text-sm font-bold text-gray-900">Curated Learning Materials</h3>
              
              <div className="space-y-2 text-xs">
                <a
                  href="https://scikit-learn.org/stable/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-[#174A7E] bg-[#F7F7F5] transition-all"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-[#174A7E]" />
                    <span className="font-semibold text-gray-800">Scikit-Learn Guide (PDF)</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>

                <a
                  href="https://colab.research.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-[#174A7E] bg-[#F7F7F5] transition-all"
                >
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-emerald-700" />
                    <span className="font-semibold text-gray-800">Google Colab Lab Notebook</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-2">
                <button
                  onClick={() => setActiveTab('quiz')}
                  className="w-full py-2.5 bg-[#174A7E] hover:bg-[#12395F] text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1"
                >
                  <span>Take Concept Quiz</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('certificate')}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1"
                >
                  <Award className="w-4 h-4" />
                  <span>Claim Digital Certificate</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* QUIZ TAB */}
      {activeTab === 'quiz' && (
        <div className="max-w-2xl mx-auto inst-card p-6 bg-white border border-[#E5E5E2] rounded-xl space-y-5">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
            Module 2.2 Formative Knowledge Check
          </h2>

          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#F7F7F5] rounded-lg border border-[#E5E5E2] space-y-2">
              <p className="font-bold text-gray-900">1. When missing a positive case carries extremely high penalty (e.g. medical diagnosis), which metric is critical?</p>
              {['Accuracy', 'Recall', 'Training speed', 'Feature count'].map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectQuiz(1, idx)}
                  className={`w-full p-2.5 text-left rounded border text-xs font-medium ${quizAnswers[1] === idx ? 'bg-[#174A7E] text-white font-bold' : 'bg-white text-gray-800'}`}
                >
                  {opt}
                </button>
              ))}
            </div>

            <div className="p-3 bg-[#F7F7F5] rounded-lg border border-[#E5E5E2] space-y-2">
              <p className="font-bold text-gray-900">2. High training accuracy but low validation accuracy is a signature indicator of:</p>
              {['Overfitting', 'Underfitting', 'Data encryption', 'Perfect generalization'].map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectQuiz(2, idx)}
                  className={`w-full p-2.5 text-left rounded border text-xs font-medium ${quizAnswers[2] === idx ? 'bg-[#174A7E] text-white font-bold' : 'bg-white text-gray-800'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleQuizSubmit}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            Submit Quiz & Update Mastery
          </button>


          {quizSubmitted && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs space-y-1">
              <p className="font-bold">Quiz Evaluated: 100% Score!</p>

              <p className="text-[11px]">Concept Mastery for Linear & Logistic Regression updated to <span className="font-bold">85% (Strong)</span> in Knowledge Graph.</p>
            </div>
          )}
        </div>
      )}

      {/* DISCUSSION TAB */}
      {activeTab === 'discussion' && (
        <div className="max-w-3xl mx-auto inst-card p-6 bg-white border border-[#E5E5E2] rounded-xl space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
            Course Discussion & Q&A Board
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-[#F7F7F5] rounded-lg border border-[#E5E5E2] space-y-1">
              <div className="flex justify-between font-bold text-gray-900">
                <span>Jhanvi Murarka</span>
                <span className="text-[10px] text-gray-400">2 hours ago</span>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Why does RMSE penalize larger outlier errors more heavily than MAE?
              </p>
              <div className="mt-2 p-2 bg-white rounded border border-gray-200 text-blue-900">
                <span className="font-bold">Dr. Rajesh Kumar (Trainer):</span> Because RMSE squares the errors before averaging them, so an error of 10 adds 100 to the sum while an error of 2 adds only 4.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
