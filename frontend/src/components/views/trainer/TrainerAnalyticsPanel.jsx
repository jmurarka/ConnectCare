import React, { useState, useEffect } from 'react';
import { Star, Award, MessageCircle, TrendingUp, AlertCircle, RefreshCw, UserCheck } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import EmptyState from '../../shared/EmptyState';

import { useAuth } from '../../../context/AuthContext';

export default function TrainerAnalyticsPanel() {
  const { role } = useAuth();
  const [ratingData, setRatingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/api/trainer/ratings');
      setRatingData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch trainer rating analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'trainer' || role === 'admin') {
      fetchRatings();
    }
  }, [role]);

  const renderStars = (score) => {
    const fullStars = Math.floor(score);
    const hasHalf = score % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

    return (
      <div className="flex items-center space-x-0.5 text-amber-400">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
        {hasHalf && <Star key="half" className="w-4 h-4 fill-amber-400/50 text-amber-400" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E5E5E2] rounded-xl p-12 text-center shadow-sm">
        <RefreshCw className="w-8 h-8 text-[#174A7E] animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-700">Loading trainer rating analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-[#E5E5E2] rounded-xl p-8 text-center shadow-sm">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-gray-900">Failed to Load Analytics</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchRatings}
          className="mt-4 px-4 py-2 bg-[#174A7E] text-white text-xs font-semibold rounded-lg hover:bg-[#12395F] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { average_rating, total_ratings, rating_distribution, recent_feedback } = ratingData || {};

  return (
    <div className="h-full w-full min-h-0 flex flex-col overflow-hidden space-y-3 bg-[#F4F1EA]">
      {/* Header Banner Hero */}
      <div className="shrink-0 bg-[#EBE6DD] border border-[#DDD5C7] rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#4A3E2A] text-amber-200 flex items-center justify-center font-bold shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-1 bg-[#DDD5C7] text-[#4A3E2A] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#CCC2B2] mb-0.5">
              <span>Quality Assurance</span>
            </div>
            <h2 className="text-base font-extrabold text-zinc-900 leading-none">Educator Ratings & Quality Analytics</h2>
            <p className="text-xs text-zinc-600 mt-1">
              Learner feedback, satisfaction scores, and teaching quality metrics.
            </p>
          </div>
        </div>
        <button
          onClick={fetchRatings}
          className="p-2 border border-[#DDD6C9] rounded-lg text-zinc-700 bg-white hover:bg-zinc-50 transition-colors shrink-0"
          title="Refresh analytics"
        >
          <RefreshCw className="w-4 h-4 text-[#4A3E2A]" />
        </button>
      </div>

      {/* Top Level Score Summary Cards */}
      <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Average Rating Card */}
        <div className="bg-[#FAF8F5] border border-[#E8E3DA] rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Overall Rating</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-black text-zinc-900">{average_rating || 0.0}</span>
              <span className="text-xs text-zinc-400 font-bold">/ 5.0</span>
            </div>
            <div className="mt-2">{renderStars(average_rating || 0)}</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FBF3D5] text-[#5C4610] border border-[#F2E3A8] flex items-center justify-center shrink-0 shadow-xs">
            <Star className="w-5 h-5 fill-[#5C4610]" />
          </div>
        </div>

        {/* Total Reviews Card */}
        <div className="bg-[#FAF8F5] border border-[#E8E3DA] rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Total Submissions</p>
            <p className="text-3xl font-black text-zinc-900 mt-1">{total_ratings || 0}</p>
            <p className="text-[11px] text-emerald-800 font-bold mt-1.5 flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Verified Learner Responses</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#E8F0F8] text-[#1E3A5F] border border-[#C3D7ED] flex items-center justify-center shrink-0 shadow-xs">
            <MessageCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Educator Standing Card */}
        <div className="bg-[#FAF8F5] border border-[#E8E3DA] rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Institutional Standing</p>
            <p className="text-base font-extrabold text-zinc-900 mt-1">
              {average_rating >= 4.5 ? 'Tier 1 Excellence' : average_rating >= 4.0 ? 'Proficient Educator' : 'Developing'}
            </p>
            <p className="text-[10px] text-zinc-500 mt-1">
              Capacity Connect Quality Assurance
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#E3EBE3] text-[#264A26] border border-[#C4DAC4] flex items-center justify-center shrink-0 shadow-xs">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Star Breakdown & Detailed Feedback */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
        {/* Rating Breakdown Bar Chart */}
        <div className="bg-white border border-[#E5E5E2] rounded-xl p-4 shadow-sm lg:col-span-1 flex flex-col justify-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-3">Rating Distribution</h3>
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = rating_distribution?.[stars] || 0;
              const percentage = total_ratings > 0 ? (count / total_ratings) * 100 : 0;
              return (
                <div key={stars} className="flex items-center space-x-3 text-xs">
                  <div className="flex items-center space-x-1 w-12 font-semibold text-gray-700 shrink-0">
                    <span>{stars}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-gray-500 font-medium shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Learner Feedback List */}
        <div className="bg-white border border-[#E5E5E2] rounded-xl p-4 shadow-sm lg:col-span-2 flex flex-col min-h-0 overflow-hidden">
          <h3 className="shrink-0 text-xs font-bold uppercase tracking-wider text-gray-800 mb-3">Recent Learner Feedback</h3>
          {!recent_feedback || recent_feedback.length === 0 ? (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <EmptyState
                icon={MessageCircle}
                title="No Feedback Submitted"
                description="Learners have not yet submitted feedback ratings for your courses."
              />
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3">
              {recent_feedback.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl border border-[#E5E5E2] bg-[#F7F7F5]/50 hover:bg-[#F7F7F5] transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-xs text-gray-900">{item.trainee_name}</span>
                      <span className="text-[10px] text-gray-500 ml-2">in {item.course_title}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {renderStars(item.score)}
                      <span className="text-xs font-bold text-gray-800 ml-1">{item.score}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 mt-1.5 leading-relaxed italic">
                    "{item.comment || 'No written feedback provided.'}"
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1.5">{item.created_at}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
