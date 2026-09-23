import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Trash2, Edit3, Search, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import EmptyState from '../../shared/EmptyState';
import Toast from '../../shared/Toast';

export default function QuestionBankPanel() {
  const [assessmentId, setAssessmentId] = useState(1); // Diagnostic Assessment ID = 1 default
  const [questions, setQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Question Modal State
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [form, setForm] = useState({
    question_text: '',
    option0: '',
    option1: '',
    option2: '',
    option3: '',
    correct_option_index: 0,
    topic: 'Python Basics',
    explanation: ''
  });

  useEffect(() => {
    fetchQuestions();
  }, [assessmentId, topicFilter, searchQuery]);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/trainer/assessments/${assessmentId}/questions?`;
      if (topicFilter) url += `topic=${encodeURIComponent(topicFilter)}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}`;

      const data = await apiClient.get(url);
      setQuestions(data);
    } catch (err) {
      setError(err.message || 'Failed to load question bank.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingQuestion(null);
    setForm({
      question_text: '',
      option0: '',
      option1: '',
      option2: '',
      option3: '',
      correct_option_index: 0,
      topic: 'Python Basics',
      explanation: ''
    });
    setQuestionModalOpen(true);
  };

  const openEditModal = (q) => {
    setEditingQuestion(q);
    setForm({
      question_text: q.question_text,
      option0: q.options[0] || '',
      option1: q.options[1] || '',
      option2: q.options[2] || '',
      option3: q.options[3] || '',
      correct_option_index: q.correct_option_index,
      topic: q.topic || 'General',
      explanation: q.explanation || ''
    });
    setQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    const options = [form.option0, form.option1, form.option2, form.option3].filter(o => o.trim() !== '');
    if (options.length < 2) {
      setToastMessage('Please provide at least 2 options.');
      return;
    }

    const payload = {
      question_text: form.question_text,
      options: options,
      correct_option_index: Number(form.correct_option_index),
      explanation: form.explanation,
      topic: form.topic
    };

    try {
      if (editingQuestion) {
        await apiClient.put(`/api/trainer/questions/${editingQuestion.id}`, payload);
        setToastMessage('Question updated successfully!');
      } else {
        await apiClient.post(`/api/trainer/assessments/${assessmentId}/questions`, payload);
        setToastMessage('Question added to Question Bank!');
      }
      setQuestionModalOpen(false);
      fetchQuestions();
    } catch (err) {
      setToastMessage(err.message || 'Failed to save question.');
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this assessment question?')) return;
    try {
      await apiClient.delete(`/api/trainer/questions/${qId}`);
      setToastMessage('Question deleted.');
      fetchQuestions();
    } catch (err) {
      setToastMessage(err.message || 'Failed to delete question.');
    }
  };

  const topicsList = ['Python Basics', 'Statistics', 'Linear Algebra', 'Calculus', 'Data Analysis', 'ML Basics', 'Neural Networks', 'Responsible AI'];

  return (
    <div className="h-full w-full min-h-0 flex flex-col overflow-hidden space-y-4">
      
      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Header Banner */}
      <div className="shrink-0 inst-card p-4 sm:p-5 bg-white border border-[#E5E5E2] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-[#174A7E] mb-1">
            <HelpCircle className="w-5 h-5" />
            <span className="text-xs font-bold uppercase bg-[#EAF2F8] px-2 py-0.5 rounded">Diagnostic & Assessment Bank</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Question Bank & Formative Assessment Manager</h2>
          <p className="text-xs text-gray-500">Create, edit, and organize 20-question diagnostic entry gate questions and concept MCQs with explanations</p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-[#174A7E] text-white font-semibold text-xs rounded-lg hover:bg-[#12395F] transition-colors flex items-center space-x-1.5 shadow shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Question</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="shrink-0 p-4 bg-white border border-[#E5E5E2] rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search question text or concept topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F7F7F5] border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#174A7E]"
          />
        </div>

        <div>
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="w-full p-2 bg-[#F7F7F5] border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#174A7E]"
          >
            <option value="">All Knowledge Topics</option>
            {topicsList.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="flex-1 min-h-0 flex items-center justify-center p-12 text-center text-gray-500 bg-white border border-[#E5E5E2] rounded-xl">
          <div>
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#174A7E]" />
            <p className="text-xs font-semibold text-gray-700">Loading Question Bank Items...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <EmptyState
            icon={AlertCircle}
            title="Could not load questions"
            message={error}
            onRetry={fetchQuestions}
          />
        </div>
      ) : questions.length === 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <EmptyState
            icon={HelpCircle}
            title="No questions found"
            message="No questions match your current search or topic filter criteria."
            onRetry={() => { setSearchQuery(''); setTopicFilter(''); }}
            retryLabel="Clear Filters"
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="inst-card bg-white border border-[#E5E5E2] rounded-xl p-5 shadow-sm space-y-3 text-xs">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-400">#{idx + 1}</span>
                  <span className="font-bold text-[#174A7E] bg-[#EAF2F8] px-2.5 py-0.5 rounded text-[11px]">
                    {q.topic}
                  </span>
                  <span className="text-gray-500 text-[11px]">&bull; {q.concept_title}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(q)}
                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="font-bold text-gray-900 text-sm">{q.question_text}</p>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {q.options?.map((opt, oIdx) => {
                  const isCorrect = oIdx === q.correct_option_index;
                  return (
                    <div
                      key={oIdx}
                      className={`p-2.5 rounded-lg border font-medium flex items-center justify-between ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                          : 'bg-[#F7F7F5] border-[#E5E5E2] text-gray-700'
                      }`}
                    >
                      <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <p className="text-gray-500 italic bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                  <span className="font-bold text-gray-700 not-italic">Explanation: </span>{q.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Question Modal */}
      {questionModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E5E5E2] max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-gray-900">
              {editingQuestion ? 'Edit Question' : 'Add New Assessment Question'}
            </h3>

            <form onSubmit={handleSaveQuestion} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Topic Tag:</label>
                <select
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded font-semibold"
                >
                  {topicsList.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Question Text:</label>
                <textarea
                  value={form.question_text}
                  onChange={(e) => setForm({ ...form, question_text: e.target.value })}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded font-semibold"
                  required
                />
              </div>

              {/* Options Inputs */}
              <div className="space-y-2 pt-1">
                <label className="font-bold text-gray-700 block">MCQ Options & Select Correct Answer:</label>
                
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correct_option"
                      checked={form.correct_option_index === idx}
                      onChange={() => setForm({ ...form, correct_option_index: idx })}
                      className="w-4 h-4 text-[#174A7E]"
                    />
                    <input
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      value={form[`option${idx}`]}
                      onChange={(e) => setForm({ ...form, [`option${idx}`]: e.target.value })}
                      className="flex-1 p-2 border border-gray-300 rounded"
                      required={idx < 2}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Answer Explanation:</label>
                <textarea
                  value={form.explanation}
                  onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setQuestionModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#174A7E] text-white rounded font-semibold hover:bg-[#12395F]"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
