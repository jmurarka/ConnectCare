import React, { useState, useEffect } from 'react';
import { User, X, RefreshCw, Award, Flame, Target, BookOpen } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';

export default function TraineeDrilldownModal({ traineeId, isOpen, onClose }) {
  const [trainee, setTrainee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && traineeId) {
      fetchTraineeDetail();
    }
  }, [isOpen, traineeId]);

  const fetchTraineeDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(`/api/trainer/trainees/${traineeId}`);
      setTrainee(data);
    } catch (err) {
      setError(err.message || 'Failed to load trainee details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[#E5E5E2] max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2 text-gray-900">
            <User className="w-5 h-5 text-[#174A7E]" />
            <h3 className="font-bold text-base">Learner Competency & Diagnostics Profile</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#174A7E]" />
            <p className="text-xs font-semibold">Fetching trainee mastery profile...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs font-semibold">
            {error}
          </div>
        ) : trainee ? (
          <div className="space-y-4 text-xs">
            
            {/* Trainee Card Summary */}
            <div className="p-4 bg-[#F7F7F5] rounded-xl border border-[#E5E5E2] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h4 className="text-base font-extrabold text-gray-900">{trainee.full_name}</h4>
                <p className="text-gray-500">{trainee.email} &bull; {trainee.education}</p>
                <p className="text-gray-600 font-medium mt-1">Goal: <span className="font-bold text-[#174A7E]">{trainee.career_goal}</span></p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-center">
                  <div className="flex items-center space-x-1 font-bold">
                    <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    <span>{trainee.streak_days} Days</span>
                  </div>
                  <p className="text-[10px] text-amber-700">Learning Streak</p>
                </div>
                <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[#174A7E] text-center">
                  <p className="text-sm font-extrabold">{trainee.avg_mastery_percentage}%</p>
                  <p className="text-[10px] uppercase font-semibold">Avg Mastery</p>
                </div>
              </div>
            </div>

            {/* Enrollments Status */}
            <div>
              <h5 className="font-bold text-gray-900 mb-2">Track Enrollments & Diagnostic Scores</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {trainee.enrollments?.map((e) => (
                  <div key={e.enrollment_id} className="p-3 bg-white border border-[#E5E5E2] rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-900">{e.course_title}</p>
                      <p className="text-[10px] text-gray-500">Diagnostic Score: <span className="font-bold text-[#174A7E]">{e.diagnostic_score}%</span></p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                      {e.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Concept Mastery Breakdown */}
            <div>
              <h5 className="font-bold text-gray-900 mb-2">Per-Concept Knowledge Graph Mastery Breakdown</h5>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {trainee.mastery_states?.map((m) => (
                  <div key={m.concept_id} className="p-2.5 bg-[#F7F7F5] border border-[#E5E5E2] rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800">{m.title}</p>
                      <p className="text-[10px] text-gray-500">{m.module_name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full ${
                            m.mastery_score >= 80 ? 'bg-emerald-600' :
                            m.mastery_score >= 60 ? 'bg-blue-600' :
                            m.mastery_score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${m.mastery_score}%` }}
                        />
                      </div>
                      <span className="font-extrabold text-gray-900 text-xs w-9 text-right">{m.mastery_score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : null}

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#174A7E] text-white font-semibold text-xs rounded-lg hover:bg-[#12395F] transition-colors"
          >
            Close Drill-down
          </button>
        </div>

      </div>
    </div>
  );
}
