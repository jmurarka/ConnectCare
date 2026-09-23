import React, { useState, useEffect } from 'react';
import { MessageSquare, Pin, Flag, Trash2, Send, CornerDownRight, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import Pagination from '../../shared/Pagination';
import Toast from '../../shared/Toast';
import ConfirmDialog from '../../shared/ConfirmDialog';
import EmptyState from '../../shared/EmptyState';

import { useAuth } from '../../../context/AuthContext';

export default function DiscussionModerationPanel() {
  const { role } = useAuth();
  const [courses, setCourses] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get('/api/courses')
      .then(res => setCourses(Array.isArray(res) ? res : []))
      .catch(err => console.error('Failed to fetch courses', err));
  }, []);

  const [replyInput, setReplyInput] = useState({}); // { postId: string }
  const [submittingReply, setSubmittingReply] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirmPost, setDeleteConfirmPost] = useState(null);

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/api/trainer/discussions?page=${page}&limit=10`;
      if (selectedCourseId) url += `&course_id=${selectedCourseId}`;
      if (flaggedOnly) url += `&flagged_only=true`;

      const res = await apiClient.get(url);
      setDiscussions(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.pages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch discussion threads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'trainer' || role === 'admin') {
      fetchDiscussions();
    }
  }, [selectedCourseId, flaggedOnly, page, role]);

  const handleTogglePin = async (post) => {
    try {
      await apiClient.post(`/api/trainer/discussions/${post.id}/pin`, {
        is_pinned: !post.is_pinned
      });
      setToast({ type: 'success', message: `Thread ${!post.is_pinned ? 'pinned to top' : 'unpinned'}.` });
      fetchDiscussions();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update pin status.' });
    }
  };

  const handleToggleFlag = async (post) => {
    try {
      await apiClient.post(`/api/trainer/discussions/${post.id}/flag`, {
        is_flagged: !post.is_flagged
      });
      setToast({ type: 'success', message: `Thread ${!post.is_flagged ? 'flagged for moderation' : 'unflagged'}.` });
      fetchDiscussions();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update flag status.' });
    }
  };

  const handleDeletePost = async () => {
    if (!deleteConfirmPost) return;
    try {
      await apiClient.delete(`/api/trainer/discussions/${deleteConfirmPost.id}`);
      setToast({ type: 'success', message: 'Discussion thread deleted.' });
      setDeleteConfirmPost(null);
      fetchDiscussions();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete thread.' });
    }
  };

  const handleSendReply = async (postId, courseId) => {
    const text = replyInput[postId];
    if (!text || !text.trim()) return;

    try {
      setSubmittingReply(true);
      await apiClient.post('/api/discussions', {
        course_id: courseId,
        parent_id: postId,
        content: text.trim()
      });
      setReplyInput(prev => ({ ...prev, [postId]: '' }));
      setToast({ type: 'success', message: 'Trainer reply posted successfully.' });
      fetchDiscussions();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to post reply.' });
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="h-full w-full min-h-0 flex flex-col overflow-hidden space-y-3 bg-[#F4F1EA]">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header & Filter Controls Hero */}
      <div className="shrink-0 bg-[#EBE6DD] border border-[#DDD5C7] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#4A3E2A] text-amber-200 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1 bg-[#DDD5C7] text-[#4A3E2A] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#CCC2B2] mb-0.5">
                <span>Community Moderation</span>
              </div>
              <h2 className="text-base font-extrabold text-zinc-900 leading-none">Discussion Forum Moderation</h2>
            </div>
          </div>
          <p className="text-[11px] text-zinc-600 mt-1">
            Monitor course discussions, answer learner questions, pin high-value threads, and moderate flagged posts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Course Select */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={selectedCourseId}
              onChange={(e) => { setSelectedCourseId(e.target.value); setPage(1); }}
              className="text-xs border border-[#DDD6C9] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#4A3E2A] bg-white font-semibold text-zinc-900"
            >
              <option value="">All Assigned Courses</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
              ))}
            </select>
          </div>

          {/* Flagged Toggle */}
          <button
            onClick={() => { setFlaggedOnly(!flaggedOnly); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded-lg border font-bold flex items-center space-x-1.5 transition-all ${
              flaggedOnly
                ? 'bg-[#FBF3D5] border-[#F2E3A8] text-[#5C4610]'
                : 'bg-white border-[#DDD6C9] text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${flaggedOnly ? 'fill-[#5C4610] text-[#5C4610]' : 'text-zinc-400'}`} />
            <span>Flagged Only</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex-1 min-h-0 flex items-center justify-center text-zinc-500 bg-[#FAF8F5] border border-[#E8E3DA] rounded-2xl">
          <div className="text-center">
            <RefreshCw className="w-7 h-7 text-[#4A3E2A] animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold text-zinc-700">Loading discussion threads...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 min-h-0">
          <EmptyState
            icon={AlertCircle}
            title="Failed to Load Discussions"
            message={error}
            onRetry={fetchDiscussions}
          />
        </div>
      ) : discussions.length === 0 ? (
        <div className="flex-1 min-h-0">
          <EmptyState
            icon={MessageSquare}
            title="No Discussions Found"
            description={flaggedOnly ? "No flagged threads requiring moderation." : "No discussion posts have been submitted yet for the selected filter."}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col bg-white border border-[#E8E3DA] rounded-2xl p-4 shadow-sm overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
            {discussions.map((post) => (
              <div
                key={post.id}
                className={`bg-[#FAF8F5] border rounded-xl p-4 shadow-xs transition-all ${
                  post.is_pinned
                    ? 'border-[#C5A880] bg-[#FAF6F0]'
                    : post.is_flagged
                    ? 'border-[#F2E3A8] bg-[#FBF8EE]'
                    : 'border-[#E8E3DA]'
                }`}
              >
                {/* Thread Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {post.is_pinned && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#18181B] text-[#D4AF37] text-[10px] font-bold border border-zinc-700">
                          <Pin className="w-3 h-3 fill-current" />
                          <span>Pinned</span>
                        </span>
                      )}
                      {post.is_flagged && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#FBF3D5] text-[#5C4610] text-[10px] font-bold border border-[#F2E3A8]">
                          <Flag className="w-3 h-3 fill-current" />
                          <span>Flagged</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-[#EFECE6] text-zinc-700 text-[10px] font-bold border border-[#DDD8CE]">
                        {post.course_title}
                      </span>
                      {post.concept_title && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1E3A5F] text-[10px] font-semibold border border-blue-100">
                          {post.concept_title}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-bold text-gray-900">{post.title || 'Discussion Thread'}</h3>

                    <div className="flex items-center space-x-2 text-[11px] text-gray-500 mt-0.5">
                      <span className="font-semibold text-gray-700">{post.author_name}</span>
                      <span className="capitalize px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded text-[9px]">
                        {post.author_role}
                      </span>
                      <span>•</span>
                      <span>{post.created_at}</span>
                    </div>
                  </div>

                  {/* Trainer Action Buttons */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => handleTogglePin(post)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                        post.is_pinned
                          ? 'bg-[#174A7E] text-white border-[#174A7E]'
                          : 'bg-white border-[#E5E5E2] text-gray-600 hover:bg-gray-50'
                      }`}
                      title={post.is_pinned ? 'Unpin thread' : 'Pin thread to top'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleFlag(post)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                        post.is_flagged
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white border-[#E5E5E2] text-gray-600 hover:bg-gray-50'
                      }`}
                      title={post.is_flagged ? 'Unflag thread' : 'Flag for review'}
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmPost(post)}
                      className="p-1.5 rounded-lg border border-[#E5E5E2] text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete thread"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Thread Content */}
                <div className="mt-2 text-xs text-gray-800 leading-relaxed bg-[#F7F7F5] p-2.5 rounded-lg border border-[#E5E5E2]/80">
                  {post.content}
                </div>

                {/* Replies Section */}
                <div className="mt-3 pt-2 border-t border-gray-100 space-y-2">
                  <div className="flex items-center space-x-1 text-[11px] font-bold text-gray-600">
                    <CornerDownRight className="w-3.5 h-3.5 text-gray-400" />
                    <span>Replies ({post.replies?.length || 0})</span>
                  </div>

                  {post.replies && post.replies.length > 0 && (
                    <div className="space-y-1.5 pl-3 border-l-2 border-gray-200">
                      {post.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className={`p-2 rounded-lg text-xs ${
                            reply.author_role === 'trainer'
                              ? 'bg-blue-50/80 border border-blue-100 text-gray-900'
                              : 'bg-gray-50 border border-gray-100 text-gray-800'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-semibold text-gray-600 mb-0.5">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-gray-900 font-bold">{reply.author_name}</span>
                              {reply.author_role === 'trainer' && (
                                <span className="bg-[#174A7E] text-white px-1 py-0.2 text-[8px] rounded font-bold uppercase">
                                  Trainer
                                </span>
                              )}
                            </div>
                            <span className="text-gray-400 font-normal">{reply.created_at}</span>
                          </div>
                          <p className="leading-snug">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Trainer Reply Form */}
                  <div className="pt-1 flex items-center space-x-2">
                    <input
                      type="text"
                      value={replyInput[post.id] || ''}
                      onChange={(e) => setReplyInput({ ...replyInput, [post.id]: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendReply(post.id, post.course_id); }}
                      placeholder="Write an official trainer response..."
                      className="flex-1 text-xs border border-[#E5E5E2] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#174A7E] bg-white"
                    />
                    <button
                      onClick={() => handleSendReply(post.id, post.course_id)}
                      disabled={submittingReply || !replyInput[post.id]?.trim()}
                      className="px-3 py-1.5 bg-[#174A7E] text-white text-xs font-semibold rounded-lg hover:bg-[#12395F] disabled:opacity-50 transition-colors flex items-center space-x-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="shrink-0 pt-3 border-t border-gray-100">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmPost && (
        <ConfirmDialog
          isOpen={!!deleteConfirmPost}
          title="Delete Discussion Thread?"
          message={`Are you sure you want to permanently delete "${deleteConfirmPost.title || 'this thread'}" and all its replies?`}
          confirmLabel="Delete Thread"
          onConfirm={handleDeletePost}
          onCancel={() => setDeleteConfirmPost(null)}
          isDanger={true}
        />
      )}
    </div>
  );
}
