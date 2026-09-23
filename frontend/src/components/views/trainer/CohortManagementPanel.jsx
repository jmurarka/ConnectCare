import React, { useState, useEffect } from 'react';
import { Users, Plus, Calendar, UserPlus, Filter, AlertCircle, RefreshCw, X, Check } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import Toast from '../../shared/Toast';
import EmptyState from '../../shared/EmptyState';

import { useAuth } from '../../../context/AuthContext';

export default function CohortManagementPanel() {
  const { role } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(3);
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get('/api/courses')
      .then(res => {
        const list = Array.isArray(res) ? res : [];
        setCourses(list);
        if (list.length > 0) {
          const preferred = list.find(c => c.code === 'AIML-02') || list.find(c => c.code === 'AIML-01') || list[0];
          setSelectedCourseId(preferred.id);
        }
      })
      .catch(err => console.error('Failed to fetch courses', err));
  }, []);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCohortName, setNewCohortName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  const [addMemberCohort, setAddMemberCohort] = useState(null);
  const [availableTrainees, setAvailableTrainees] = useState([]);
  const [selectedTraineeId, setSelectedTraineeId] = useState('');

  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCohorts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(`/api/trainer/courses/${selectedCourseId}/cohorts`);
      setCohorts(Array.isArray(res) ? res : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch course cohorts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((role === 'trainer' || role === 'admin') && selectedCourseId) {
      fetchCohorts();
    }
  }, [selectedCourseId, role]);

  const fetchCourseTrainees = async () => {
    try {
      const res = await apiClient.get(`/api/trainer/courses/${selectedCourseId}/trainees`);
      setAvailableTrainees(res.trainees || []);
    } catch (err) {
      console.error('Failed to fetch roster trainees', err);
    }
  };

  useEffect(() => {
    fetchCohorts();
    fetchCourseTrainees();
  }, [selectedCourseId]);

  const handleCreateCohort = async (e) => {
    e.preventDefault();
    if (!newCohortName.trim()) return;

    try {
      setSubmitting(true);
      await apiClient.post(`/api/trainer/courses/${selectedCourseId}/cohorts`, {
        name: newCohortName.trim(),
        start_date: newStartDate || null,
        end_date: newEndDate || null
      });
      setToast({ type: 'success', message: `Cohort batch "${newCohortName}" created successfully.` });
      setShowCreateModal(false);
      setNewCohortName('');
      setNewStartDate('');
      setNewEndDate('');
      fetchCohorts();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to create cohort.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!addMemberCohort || !selectedTraineeId) return;

    try {
      setSubmitting(true);
      await apiClient.post(`/api/trainer/cohorts/${addMemberCohort.id}/members`, {
        trainee_id: parseInt(selectedTraineeId)
      });
      setToast({ type: 'success', message: 'Trainee added to cohort successfully.' });
      setAddMemberCohort(null);
      setSelectedTraineeId('');
      fetchCohorts();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to add member to cohort.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full w-full min-h-0 flex flex-col overflow-hidden space-y-3 bg-[#F4F1EA]">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header & Course Filter Bar Hero */}
      <div className="shrink-0 bg-[#EBE6DD] border border-[#DDD5C7] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#4A3E2A] text-amber-200 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1 bg-[#DDD5C7] text-[#4A3E2A] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#CCC2B2] mb-0.5">
                <span>Group Governance</span>
              </div>
              <h2 className="text-base font-extrabold text-zinc-900 leading-none">Learner Cohort Batch Management</h2>
            </div>
          </div>
          <p className="text-xs text-zinc-600 mt-1">
            Organize enrolled learners into structured study batches, track cohort progress, and manage learner assignments.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          {/* Select Course */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(parseInt(e.target.value))}
              className="text-xs border border-[#DDD6C9] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#4A3E2A] bg-white font-semibold text-zinc-900"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-1.5 bg-[#18181B] text-white hover:bg-zinc-800 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 shadow shrink-0 border border-zinc-700"
          >
            <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Create Cohort Batch</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex-1 min-h-0 flex items-center justify-center p-12 text-center text-gray-500 bg-white border border-[#E5E5E2] rounded-xl">
          <div>
            <RefreshCw className="w-8 h-8 text-[#174A7E] animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">Loading cohort batches...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <EmptyState
            icon={AlertCircle}
            title="Failed to Load Cohorts"
            message={error}
            onRetry={fetchCohorts}
          />
        </div>
      ) : cohorts.length === 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <EmptyState
            icon={Users}
            title="No Cohorts Found"
            description="No learner cohorts have been created yet for this course. Click 'Create Cohort Batch' to start."
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max">
          {cohorts.map((cohort) => (
            <div key={cohort.id} className="bg-white border border-[#E5E5E2] rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between border-b border-gray-100 pb-2.5">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{cohort.name}</h3>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      {cohort.start_date ? `${cohort.start_date} to ${cohort.end_date || 'Ongoing'}` : 'Flexible Duration'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setAddMemberCohort(cohort)}
                  className="px-2.5 py-1 bg-blue-50 text-[#174A7E] border border-blue-200 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-1 shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Learner</span>
                </button>
              </div>

              {/* Members List */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
                  <span>Assigned Members ({cohort.member_count})</span>
                </div>

                {cohort.members && cohort.members.length > 0 ? (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {cohort.members.map((m) => (
                      <div key={m.trainee_id} className="p-2 rounded-lg bg-[#F7F7F5] border border-[#E5E5E2] flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-[#EAF2F8] text-[#174A7E] flex items-center justify-center font-bold text-[10px] shrink-0">
                            {m.full_name ? m.full_name[0] : 'U'}
                          </div>
                          <div className="truncate max-w-[140px]">
                            <p className="font-semibold text-gray-800 leading-tight truncate">{m.full_name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{m.email}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">Joined {m.joined_at?.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic py-3 text-center bg-[#F7F7F5] rounded-lg border border-[#E5E5E2]">
                    No learners assigned to this cohort batch yet.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Cohort Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#E5E5E2]">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Create New Cohort Batch</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCohort} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Batch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spring 2026 Batch Alpha"
                  value={newCohortName}
                  onChange={(e) => setNewCohortName(e.target.value)}
                  className="w-full text-xs border border-[#E5E5E2] rounded-lg px-3 py-2 focus:outline-none focus:border-[#174A7E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full text-xs border border-[#E5E5E2] rounded-lg px-3 py-2 focus:outline-none focus:border-[#174A7E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full text-xs border border-[#E5E5E2] rounded-lg px-3 py-2 focus:outline-none focus:border-[#174A7E]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 border border-[#E5E5E2] text-xs font-semibold rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#174A7E] text-white text-xs font-semibold rounded-lg hover:bg-[#12395F] disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {addMemberCohort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#E5E5E2]">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Add Learner to {addMemberCohort.name}</h3>
              <button onClick={() => setAddMemberCohort(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Learner from Roster *</label>
                <select
                  required
                  value={selectedTraineeId}
                  onChange={(e) => setSelectedTraineeId(e.target.value)}
                  className="w-full text-xs border border-[#E5E5E2] rounded-lg px-3 py-2 focus:outline-none focus:border-[#174A7E] bg-white"
                >
                  <option value="">-- Choose Learner --</option>
                  {availableTrainees.map(t => (
                    <option key={t.trainee_id} value={t.trainee_id}>
                      {t.full_name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddMemberCohort(null)}
                  className="px-3.5 py-1.5 border border-[#E5E5E2] text-xs font-semibold rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedTraineeId}
                  className="px-4 py-1.5 bg-[#174A7E] text-white text-xs font-semibold rounded-lg hover:bg-[#12395F] disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
