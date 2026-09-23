import React, { useState, useEffect } from 'react';
import { FileCheck2, AlertCircle, CheckCircle2, ArrowRight, HelpCircle, RefreshCw, Send, ShieldAlert } from 'lucide-react';
import { traineeApi } from '../../api/traineeApi';

export default function DiagnosticAssessmentView({ onNavigate }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDiagnostic();
  }, []);

  const fetchDiagnostic = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await traineeApi.getDiagnostic(3);
      setQuestions(data.questions || []);
    } catch (e) {
      setError(e.message || 'Failed to fetch diagnostic questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionIdx) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const data = await traineeApi.submitDiagnostic(selectedAnswers, 3);
      setResult(data);
    } catch (e) {
      setError(e.message || 'Failed to submit diagnostic assessment');
    } finally {
      setSubmitting(false);
    }
  };


  const currentQ = questions[currentIndex];
  const totalQ = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#174A7E]" />
        <p className="text-sm font-medium">Loading Diagnostic Entry Gate Assessment...</p>
      </div>
    );
  }

  // If submitted, show Diagnostic Results Report
  if (result) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="inst-card p-6 bg-white border border-[#E5E5E2] rounded-xl space-y-6">
          
          <div className="flex items-center space-x-3 text-emerald-700 border-b border-gray-100 pb-4">
            <CheckCircle2 className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Diagnostic Assessment Complete</h1>
              <p className="text-xs text-gray-600">Learner Baseline Evaluation Report</p>
            </div>
          </div>

          {/* Score Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-[#F7F7F5] rounded-lg border border-[#E5E5E2]">
              <p className="text-xs text-gray-500 font-medium">Diagnostic Score</p>
              <p className="text-3xl font-extrabold text-[#174A7E]">{result.score_percentage}%</p>
            </div>
            <div className="p-4 bg-[#F7F7F5] rounded-lg border border-[#E5E5E2]">
              <p className="text-xs text-gray-500 font-medium">Correct Answers</p>
              <p className="text-3xl font-extrabold text-gray-900">{result.correct_answers} / {result.total_questions}</p>
            </div>
            <div className="p-4 bg-[#F7F7F5] rounded-lg border border-[#E5E5E2]">
              <p className="text-xs text-gray-500 font-medium">Eligibility Status</p>
              <p className="text-sm font-bold text-emerald-700 mt-2 uppercase">{result.eligibility_status.replace('_', ' ')}</p>
            </div>
          </div>

          {/* Diagnostic Competency Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Evaluated Knowledge State Breakdown</h3>
            
            <div className="space-y-2 text-xs">
              {result.topic_breakdown && result.topic_breakdown.length > 0 ? (
                result.topic_breakdown.map((tb, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between font-medium text-gray-700 mb-1">
                      <span>{tb.topic}</span>
                      <span className={`font-bold ${tb.percentage >= 70 ? 'text-[#174A7E]' : 'text-amber-700'}`}>
                        {tb.percentage}% ({tb.status})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${tb.percentage >= 70 ? 'bg-[#174A7E]' : 'bg-amber-500'}`} style={{ width: `${tb.percentage}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-2 text-gray-500">Evaluation recorded.</div>
              )}
            </div>

          </div>

          {/* System Recommendation Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1 text-blue-900">
            <p className="font-bold">Automated Prerequisite Recommendation:</p>
            <p className="leading-relaxed">{result.recommendation}</p>
          </div>

          {/* Workflow Status Info */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Enrollment Submitted for Trainer Approval</p>
              <p className="text-[11px] leading-relaxed mt-0.5">
                Your diagnostic entry gate score has been recorded. Course enrollment requires formal approval from Dr. Rajesh Kumar (Trainer). Switch to Trainer role to test approval.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onNavigate('availability')}
              className="flex-1 py-2.5 px-4 bg-[#174A7E] text-white font-semibold text-xs rounded-lg hover:bg-[#12395F] transition-colors flex items-center justify-center space-x-2"
            >
              <span>Proceed to Availability Planner</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setResult(null)}
              className="py-2.5 px-4 border border-gray-300 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-50"
            >
              Retake Assessment
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Entry Gate Banner Header */}
      <div className="inst-card p-5 bg-white border border-[#E5E5E2] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#174A7E] mb-1">
            <FileCheck2 className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider bg-[#EAF2F8] px-2 py-0.5 rounded">Entry Gate</span>
          </div>
          <h1 className="text-lg font-bold text-gray-900">Pre-Enrollment Diagnostic Assessment</h1>
          <p className="text-xs text-gray-600">Evaluates baseline knowledge across Python, Math, Data Handling, ML & Ethics before unlocking course access.</p>
        </div>

        <div className="text-right text-xs font-semibold text-gray-700">
          <span>Question {currentIndex + 1} of {totalQ}</span>
          <div className="w-32 bg-gray-200 h-2 rounded-full mt-1 overflow-hidden">
            <div className="bg-[#174A7E] h-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / totalQ) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      {currentQ && (
        <div className="inst-card p-6 bg-white border border-[#E5E5E2] rounded-xl space-y-6">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              Topic: {currentQ.topic}
            </span>
            <span className="text-xs text-gray-500">Single Choice MCQ</span>
          </div>

          <h2 className="text-base font-bold text-gray-900 leading-snug">
            {currentIndex + 1}. {currentQ.question_text}
          </h2>

          {/* Options */}
          <div className="space-y-2.5 pt-2">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedAnswers[currentQ.id] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(currentQ.id, idx)}
                  className={`w-full p-3.5 text-left rounded-lg border text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#EAF2F8] border-[#174A7E] text-[#12395F] font-semibold shadow-xs'
                      : 'bg-white border-[#E5E5E2] text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span>{opt}</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#174A7E] bg-[#174A7E]' : 'border-gray-400'}`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className="px-4 py-2 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-xs text-gray-500 font-medium">
              {answeredCount} / {totalQ} Answered
            </span>

            {currentIndex < totalQ - 1 ? (
              <button
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="px-4 py-2 bg-[#174A7E] text-white rounded-md text-xs font-semibold hover:bg-[#12395F]"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 bg-emerald-700 text-white rounded-md text-xs font-semibold hover:bg-emerald-800 flex items-center space-x-1.5 shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Evaluating...' : 'Submit Diagnostic'}</span>
              </button>
            )}
          </div>

        </div>
      )}

      {/* Question Palette Grid */}
      <div className="inst-card p-4 bg-white border border-[#E5E5E2] rounded-xl space-y-2">
        <p className="text-xs font-bold text-gray-700">Question Palette Navigation</p>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, idx) => {
            const isAnswered = selectedAnswers[q.id] !== undefined;
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                  isCurrent 
                    ? 'ring-2 ring-[#174A7E] bg-[#174A7E] text-white' 
                    : isAnswered 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
