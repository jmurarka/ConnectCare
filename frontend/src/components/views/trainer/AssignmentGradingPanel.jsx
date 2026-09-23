import React, { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle2, RefreshCw, AlertCircle, ExternalLink, Award } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import EmptyState from '../../shared/EmptyState';
import Toast from '../../shared/Toast';

export default function AssignmentGradingPanel() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(2); // AIML-02 default
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '', due_date: '2026-10-15', max_score: 100 });

  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ grade: 90, feedback: 'Well structured solution!' });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchAssignments(selectedCourseId);
    }
  }, [selectedCourseId]);

  const fetchCourses = async () => {
    try {
      const data = await apiClient.get('/api/courses');
      setCourses(data);
    } catch (e) {
      // ignore
    }
  };

  const fetchAssignments = async (courseId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(`/api/trainer/courses/${courseId}/assignments`);
      setAssignments(data);
      if (data.length > 0) {
        setSelectedAssignment(data[0]);
        fetchSubmissions(data[0].id);
      } else {
        setSelectedAssignment(null);
        setSubmissions([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (assignmentId) => {
    try {
      const data = await apiClient.get(`/api/trainer/assignments/${assignmentId}/submissions`);
      setSubmissions(data);
    } catch (e) {
      setSubmissions([]);
    }
  };

  const handleSelectAssignment = (a) => {
    setSelectedAssignment(a);
    fetchSubmissions(a.id);
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/api/trainer/courses/${selectedCourseId}/assignments`, createForm);
      setToastMessage('Project assignment created!');
      setCreateModalOpen(false);
      fetchAssignments(selectedCourseId);
    } catch (err) {
      setToastMessage(err.message || 'Failed to create assignment');
    }
  };

  const openGradeModal = (sub) => {
    setGradingSubmission(sub);
    setGradeForm({ grade: sub.grade || 85, feedback: sub.feedback || 'Good work on this project deliverable!' });
    setGradeModalOpen(true);
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    try {
      await apiClient.post(`/api/trainer/submissions/${gradingSubmission.id}/grade`, {
        grade: Number(gradeForm.grade),
        feedback: gradeForm.feedback
      });
      setToastMessage('Submission graded! Notification dispatched to trainee.');
      setGradeModalOpen(false);
      fetchSubmissions(selectedAssignment.id);
    } catch (err) {
      setToastMessage(err.message || 'Failed to grade submission');
    }
  };

  return (
    <div className="h-full w-full min-h-0 flex flex-col overflow-hidden space-y-4">
      
      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Header Banner */}
      <div className="shrink-0 inst-card p-4 sm:p-5 bg-white border border-[#E5E5E2] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-[#174A7E] mb-1">
            <FileText className="w-5 h-5" />
            <span className="text-xs font-bold uppercase bg-[#EAF2F8] px-2 py-0.5 rounded">Project Deliverables</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Project Deliverables & Submission Grading Studio</h2>
          <p className="text-xs text-gray-500">Review trainee project submissions, enter grade scores, and dispatch automated notification feedback</p>
        </div>

        {/* Course Selector & Create Button */}
        <div className="flex items-center space-x-3 shrink-0">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(Number(e.target.value))}
            className="p-2 bg-[#F7F7F5] border border-[#E5E5E2] text-xs font-semibold text-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#174A7E]"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.code}: {c.title}</option>
            ))}
          </select>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-3 py-2 bg-[#174A7E] text-white font-semibold text-xs rounded-lg hover:bg-[#12395F] transition-colors flex items-center space-x-1 shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Assignment</span>
          </button>
        </div>
      </div>

      {/* Main Studio Split View */}
      {loading ? (
        <div className="flex-1 min-h-0 flex items-center justify-center p-12 text-center text-gray-500 bg-white border border-[#E5E5E2] rounded-xl">
          <div>
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#174A7E]" />
            <p className="text-xs font-semibold text-gray-700">Loading Assignments & Submissions...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <EmptyState
            icon={AlertCircle}
            title="Could not load assignments"
            message={error}
            onRetry={() => fetchAssignments(selectedCourseId)}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          
          {/* Left Column: Assignments List */}
          <div className="inst-card bg-white border border-[#E5E5E2] rounded-xl p-4 shadow-sm flex flex-col min-h-0 overflow-hidden">
            <h3 className="shrink-0 font-bold text-xs uppercase tracking-wider text-gray-500 mb-3">Track Project Assignments</h3>
            
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
              {assignments.map((a) => {
                const isSelected = selectedAssignment?.id === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => handleSelectAssignment(a)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#EAF2F8] border-[#174A7E] text-[#174A7E] font-bold shadow-sm'
                        : 'bg-[#F7F7F5] border-[#E5E5E2] text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-bold">{a.title}</p>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 mt-1">
                      <span>Max: {a.max_score} pts</span>
                      <span className="font-semibold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                        {a.pending_grading_count} Pending
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Submissions Table */}
          <div className="lg:col-span-2 flex flex-col min-h-0 overflow-hidden">
            {selectedAssignment ? (
              <div className="flex-1 min-h-0 flex flex-col inst-card bg-white border border-[#E5E5E2] rounded-xl p-5 shadow-sm overflow-hidden text-xs">
                <div className="shrink-0 pb-3 border-b border-gray-100 mb-3">
                  <h3 className="text-base font-bold text-gray-900">{selectedAssignment.title}</h3>
                  <p className="text-gray-500">{selectedAssignment.description}</p>
                </div>

                <div className="flex-1 min-h-0 overflow-auto border border-[#E5E5E2] rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#F7F7F5] z-10">
                      <tr className="border-b border-[#E5E5E2] text-gray-700 font-bold uppercase tracking-wider">
                        <th className="p-3">Trainee Learner</th>
                        <th className="p-3">Submission Repository</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Grade</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {submissions.length > 0 ? (
                        submissions.map((s) => (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="p-3">
                              <p className="font-bold text-gray-900">{s.trainee_name}</p>
                              <p className="text-[10px] text-gray-500">{s.submitted_at}</p>
                            </td>
                            <td className="p-3">
                              <a
                                href={s.content_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-700 font-medium underline inline-flex items-center space-x-1"
                              >
                                <span className="truncate max-w-xs">{s.content_url}</span>
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                                s.status === 'graded'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 text-amber-900 border-amber-200'
                              }`}>
                                {s.status}
                              </span>
                            </td>
                            <td className="p-3 font-extrabold text-[#174A7E]">
                              {s.grade !== null ? `${s.grade} / 100` : '—'}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => openGradeModal(s)}
                                className="px-3 py-1 bg-[#174A7E] text-white font-semibold text-xs rounded hover:bg-[#12395F] transition-colors shrink-0"
                              >
                                {s.status === 'graded' ? 'Edit Grade' : 'Grade Submission'}
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-gray-500 italic">
                            No submissions recorded for this project deliverable yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto">
                <EmptyState
                  icon={FileText}
                  title="No assignment selected"
                  message="Select an assignment from the list or create a new project deliverable."
                />
              </div>
            )}
          </div>

        </div>
      )}

      {/* Create Assignment Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E5E5E2] max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-gray-900">Create Project Deliverable Assignment</h3>

            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Assignment Title:</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Description & Requirements:</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Due Date:</label>
                  <input
                    type="date"
                    value={createForm.due_date}
                    onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Max Score:</label>
                  <input
                    type="number"
                    value={createForm.max_score}
                    onChange={(e) => setCreateForm({ ...createForm, max_score: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#174A7E] text-white rounded font-semibold hover:bg-[#12395F]"
                >
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Submission Modal */}
      {gradeModalOpen && gradingSubmission && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E5E5E2] max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-gray-900">Grade Trainee Deliverable</h3>

            <div className="p-3 bg-[#F7F7F5] rounded-lg border border-[#E5E5E2] text-xs">
              <p className="font-bold text-gray-900">{gradingSubmission.trainee_name}</p>
              <a href={gradingSubmission.content_url} target="_blank" rel="noreferrer" className="text-blue-700 underline block mt-0.5 truncate">
                {gradingSubmission.content_url}
              </a>
            </div>

            <form onSubmit={handleGradeSubmission} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Grade Score (Max 100):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gradeForm.grade}
                  onChange={(e) => setGradeForm({ ...gradeForm, grade: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded font-extrabold text-[#174A7E] text-base"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Feedback Note (Dispatched via Notification):</label>
                <textarea
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setGradeModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#174A7E] text-white rounded font-semibold hover:bg-[#12395F]"
                >
                  Submit Grade & Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
