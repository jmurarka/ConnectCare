import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, XCircle, Search, Filter, RefreshCw, CheckSquare, Square } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import Pagination from '../../shared/Pagination';
import EmptyState from '../../shared/EmptyState';
import Toast from '../../shared/Toast';

export default function EnrollmentQueuePanel() {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('approval_pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [selectedCourse, selectedStatus, searchQuery, page]);

  const fetchCourses = async () => {
    try {
      const data = await apiClient.get('/api/courses');
      setCourses(data);
    } catch (e) {
      // ignore
    }
  };

  const fetchEnrollments = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/trainer/enrollments?page=${page}&limit=${limit}`;
      if (selectedCourse) url += `&course_id=${selectedCourse}`;
      if (selectedStatus) url += `&status=${selectedStatus}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const data = await apiClient.get(url);
      setEnrollments(data.items || []);
      setTotalPages(data.pages || 1);
      setTotalItems(data.total || 0);
      setSelectedIds([]);
    } catch (err) {
      setError(err.message || 'Failed to load enrollment queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleAction = async (enrollmentId, approve) => {
    setActionLoading(true);
    try {
      const endpoint = approve 
        ? `/api/trainer/enrollments/${enrollmentId}/approve` 
        : `/api/trainer/enrollments/${enrollmentId}/reject`;
      
      await apiClient.post(endpoint, { notes: `Educator action: ${approve ? 'Approved' : 'Rejected'}` });
      setToastMessage(`Enrollment request ${approve ? 'approved' : 'rejected'} successfully.`);
      fetchEnrollments();
    } catch (err) {
      setToastMessage(err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (approve) => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      await apiClient.post('/api/trainer/enrollments/bulk-decision', {
        enrollment_ids: selectedIds,
        approve,
        notes: `Bulk educator decision for ${selectedIds.length} applicants.`
      });
      setToastMessage(`Bulk ${approve ? 'approval' : 'rejection'} applied to ${selectedIds.length} applicants.`);
      fetchEnrollments();
    } catch (err) {
      setToastMessage(err.message || 'Bulk decision failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === enrollments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(enrollments.map(e => e.enrollment_id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  return (
    <div className="h-full w-full min-h-0 flex flex-col overflow-hidden space-y-3">
      
      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Header Banner */}
      <div className="shrink-0 p-4 bg-white border border-[#E5E5E2] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-[#174A7E] mb-0.5">
            <Users className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase bg-[#EAF2F8] px-2 py-0.5 rounded">Enrollment Moderation</span>
          </div>
          <h2 className="text-base font-bold text-gray-900">Learner Enrollment & Diagnostic Approval Queue</h2>
          <p className="text-[11px] text-gray-500">Filter, search, and approve applicant enrollments based on entry gate score</p>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex items-center space-x-2 bg-[#EAF2F8] p-2 rounded-lg border border-[#D4E5F2] animate-in fade-in">
            <span className="text-xs font-bold text-[#174A7E] px-1">{selectedIds.length} Selected</span>
            <button
              disabled={actionLoading}
              onClick={() => handleBulkAction(true)}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded text-xs transition-colors"
            >
              Bulk Approve
            </button>
            <button
              disabled={actionLoading}
              onClick={() => handleBulkAction(false)}
              className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white font-semibold rounded text-xs transition-colors"
            >
              Bulk Reject
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="shrink-0 p-3 bg-white border border-[#E5E5E2] rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-sm">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search trainee name or email..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 bg-[#F7F7F5] border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#174A7E]"
          />
        </div>

        {/* Course Filter */}
        <div>
          <select
            value={selectedCourse}
            onChange={(e) => { setSelectedCourse(e.target.value); setPage(1); }}
            className="w-full p-1.5 bg-[#F7F7F5] border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#174A7E]"
          >
            <option value="">All Course Tracks</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.code}: {c.title}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            className="w-full p-1.5 bg-[#F7F7F5] border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#174A7E]"
          >
            <option value="all">All Statuses</option>
            <option value="approval_pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="flex-1 min-h-0 flex items-center justify-center text-gray-500 bg-white border border-[#E5E5E2] rounded-xl">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#174A7E]" />
            <p className="text-xs font-semibold text-gray-700">Loading Enrollment Requests...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 min-h-0">
          <EmptyState
            icon={XCircle}
            title="Could not load enrollment queue"
            message={error}
            onRetry={fetchEnrollments}
          />
        </div>
      ) : enrollments.length === 0 ? (
        <div className="flex-1 min-h-0">
          <EmptyState
            icon={Users}
            title="No enrollments match criteria"
            message="No trainee enrollment requests match your current course or status filters."
            onRetry={() => { setSelectedCourse(''); setSelectedStatus('all'); setSearchQuery(''); }}
            retryLabel="Clear Filters"
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col bg-white border border-[#E5E5E2] rounded-xl p-4 shadow-sm overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto border border-[#E5E5E2] rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#F7F7F5] border-b border-[#E5E5E2] text-gray-700 font-bold uppercase tracking-wider z-10">
                <tr>
                  <th className="p-2.5 w-10 text-center">
                    <button onClick={toggleSelectAll} className="text-gray-500 hover:text-gray-700">
                      {selectedIds.length === enrollments.length ? (
                        <CheckSquare className="w-4 h-4 text-[#174A7E]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-2.5">Trainee Name</th>
                  <th className="p-2.5">Course Track</th>
                  <th className="p-2.5">Diagnostic Score</th>
                  <th className="p-2.5">Entry Status</th>
                  <th className="p-2.5">Request Date</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {enrollments.map((r) => {
                  const isSelected = selectedIds.includes(r.enrollment_id);
                  return (
                    <tr key={r.enrollment_id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}>
                      <td className="p-2.5 text-center">
                        <button onClick={() => toggleSelect(r.enrollment_id)} className="text-gray-500">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#174A7E]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-2.5">
                        <p className="font-bold text-gray-900">{r.trainee_name}</p>
                        <p className="text-[10px] text-gray-500">{r.trainee_email}</p>
                      </td>
                      <td className="p-2.5 font-medium text-gray-800">
                        {r.course_code ? `${r.course_code}: ` : ''}{r.course_title}
                      </td>
                      <td className="p-2.5 font-extrabold text-[#174A7E]">
                        {r.diagnostic_score}%
                      </td>
                      <td className="p-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          r.status === 'approved' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : r.status === 'rejected'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : r.status === 'completed'
                            ? 'bg-blue-50 text-[#174A7E] border-blue-200'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}>
                          {r.status === 'approval_pending' ? 'Pending Approval' : r.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-2.5 text-gray-500 text-[11px]">
                        {r.enrolled_at || 'Recent'}
                      </td>
                      <td className="p-2.5 text-right space-x-2">
                        {r.status === 'approval_pending' ? (
                          <>
                            <button
                              disabled={actionLoading}
                              onClick={() => handleSingleAction(r.enrollment_id, true)}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded text-xs transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              disabled={actionLoading}
                              onClick={() => handleSingleAction(r.enrollment_id, false)}
                              className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded text-xs transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-semibold">Decision Recorded</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="shrink-0 pt-3 border-t border-gray-100">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              limit={limit}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>
      )}

    </div>
  );
}
