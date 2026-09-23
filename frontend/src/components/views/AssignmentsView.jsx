import React, { useState, useEffect } from 'react';
import { FileText, Send, CheckCircle2, Clock, AlertCircle, RefreshCw, ExternalLink, Award } from 'lucide-react';
import { traineeApi } from '../../api/traineeApi';

export default function AssignmentsView() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);
  const [solutionUrl, setSolutionUrl] = useState('');
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await traineeApi.getAssignments(3);
      setAssignments(data || []);
    } catch (e) {
      setError(e.message || 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (assignmentId) => {
    if (!solutionUrl.trim()) return;
    setSubmittingId(assignmentId);
    setSuccessMsg(null);
    try {
      await traineeApi.submitAssignment({
        assignment_id: assignmentId,
        content_url: solutionUrl.trim()
      });
      setSuccessMsg('Assignment submission recorded successfully!');
      setSolutionUrl('');
      await fetchAssignments();
    } catch (e) {
      setError(e.message || 'Failed to submit assignment');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#174A7E]" />
        <p className="text-sm font-medium">Fetching Course Assignments & Submissions...</p>
      </div>
    );
  }

  // Fallback demo assignments if empty
  const displayAssignments = (assignments && assignments.length > 0) ? assignments : [
    {
      id: 1,
      title: 'Assignment 1: Exploratory Data Analysis & pandas Wrangling',
      description: 'Clean the provided housing dataset using pandas, compute summary statistics, and submit your GitHub repository link.',
      due_date: '30 September 2026',
      max_score: 100.0,
      module_name: 'Data Analysis Tools',
      submission: {
        id: 101,
        content_url: 'https://github.com/jmurarka/ConnectCare/tree/main/backend',
        submitted_at: '2026-09-22T14:30:00Z',
        status: 'graded',
        grade: 92.0,
        feedback: 'Excellent data cleaning approach! Proper handling of missing values and well-documented notebook.'
      }
    },
    {
      id: 2,
      title: 'Assignment 2: Supervised Learning & Model Evaluation Pipeline',
      description: 'Implement Logistic Regression and Decision Tree classifiers on the diagnostic dataset. Compare ROC-AUC scores.',
      due_date: '08 October 2026',
      max_score: 100.0,
      module_name: 'Supervised Learning',
      submission: null
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="inst-card p-5 bg-white border border-[#E2E8F0] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-[#174A7E] mb-1">
            <FileText className="w-5 h-5" />
            <span className="text-xs font-bold uppercase bg-[#EAF2F8] px-2 py-0.5 rounded">Course Deliverables</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Assignments & Project Submissions</h1>
          <p className="text-xs text-slate-600">Submit code repositories, view evaluations, and track trainer feedback</p>
        </div>

        <button
          onClick={fetchAssignments}
          className="px-3.5 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 flex items-center space-x-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-900 text-xs rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Assignments List */}
      <div className="space-y-4">
        {displayAssignments.map((assignment) => {
          const sub = assignment.submission;
          const isGraded = sub && sub.status === 'graded';
          const isSubmitted = sub && sub.status === 'submitted';

          return (
            <div key={assignment.id} className="inst-card p-5 bg-white border border-[#E2E8F0] rounded-xl space-y-4 shadow-xs hover:border-[#174A7E] transition-all">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#174A7E] bg-[#EAF2F8] px-2 py-0.5 rounded">
                    {assignment.module_name || 'Core Module'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{assignment.title}</h3>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-slate-500 font-medium">Due: <span className="font-bold text-slate-800">{assignment.due_date}</span></span>
                  <span className="font-bold text-[#174A7E] bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                    Max: {assignment.max_score} pts
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{assignment.description}</p>

              {/* Submission Status or Submission Form */}
              {sub ? (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {isGraded ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Graded
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" /> Pending Trainer Review
                        </span>
                      )}
                      <a
                        href={sub.content_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#174A7E] hover:underline font-mono flex items-center space-x-1"
                      >
                        <span>{sub.content_url}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {isGraded && (
                      <div className="flex items-center space-x-1 text-sm font-bold text-[#174A7E]">
                        <Award className="w-4 h-4" />
                        <span>Score: {sub.grade} / {assignment.max_score}</span>
                      </div>
                    )}
                  </div>

                  {sub.feedback && (
                    <div className="p-3 bg-white rounded border border-slate-200 text-xs text-slate-700 space-y-1">
                      <p className="font-bold text-slate-900">Trainer Feedback:</p>
                      <p className="italic">{sub.feedback}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-[#F0F7FF] rounded-lg border border-blue-200 space-y-3">
                  <p className="text-xs font-bold text-slate-800">Submit Your Project Solution:</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={solutionUrl}
                      onChange={(e) => setSolutionUrl(e.target.value)}
                      placeholder="Paste GitHub repository or solution URL (https://github.com/...)"
                      className="flex-1 p-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#174A7E] bg-white"
                    />
                    <button
                      onClick={() => handleSubmit(assignment.id)}
                      disabled={submittingId === assignment.id || !solutionUrl.trim()}
                      className="px-4 py-2.5 bg-[#174A7E] hover:bg-[#12395F] text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingId === assignment.id ? 'Submitting...' : 'Submit Work'}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
