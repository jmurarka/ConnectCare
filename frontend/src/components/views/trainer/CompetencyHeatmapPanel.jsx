import React, { useState, useEffect } from 'react';
import { Network, RefreshCw, AlertCircle, Eye } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import EmptyState from '../../shared/EmptyState';
import TraineeDrilldownModal from './TraineeDrilldownModal';

export default function CompetencyHeatmapPanel() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(2);
  const [trainerKg, setTrainerKg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [drilldownTraineeId, setDrilldownTraineeId] = useState(null);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchHeatmapData(selectedCourseId);
    }
  }, [selectedCourseId]);

  const fetchCourses = async () => {
    try {
      const data = await apiClient.get('/api/courses');
      setCourses(data);
      if (data.length > 0) {
        setSelectedCourseId(data[0].id);
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchHeatmapData = async (courseId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(`/api/kg/trainer/${courseId}`);
      setTrainerKg(data);
    } catch (err) {
      setError(err.message || 'Failed to load competency heatmap.');
    } finally {
      setLoading(false);
    }
  };

  const openDrilldown = (traineeId) => {
    setDrilldownTraineeId(traineeId);
    setIsDrilldownOpen(true);
  };

  const concepts = trainerKg?.concepts || [];

  return (
    <div className="h-full w-full min-h-0 flex flex-col overflow-hidden space-y-4">
      
      {/* Trainee Drilldown Modal */}
      <TraineeDrilldownModal
        traineeId={drilldownTraineeId}
        isOpen={isDrilldownOpen}
        onClose={() => setIsDrilldownOpen(false)}
      />

      {/* Header Banner */}
      <div className="shrink-0 inst-card p-4 sm:p-5 bg-white border border-[#E5E5E2] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-[#174A7E] mb-1">
            <Network className="w-5 h-5" />
            <span className="text-xs font-bold uppercase bg-[#EAF2F8] px-2 py-0.5 rounded">Competency Analytics</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Cohort Competency Heatmap & Decision Support</h2>
          <p className="text-xs text-gray-500">Visualizing concept mastery distribution and bottleneck identification across course tracks</p>
        </div>

        {/* Course Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-gray-700">Course Track:</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(Number(e.target.value))}
            className="p-2 bg-[#F7F7F5] border border-[#E5E5E2] text-xs font-semibold text-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#174A7E]"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}: {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Heatmap Section */}
      {loading ? (
        <div className="flex-1 min-h-0 flex items-center justify-center p-12 text-center text-gray-500 bg-white border border-[#E5E5E2] rounded-xl">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#174A7E]" />
            <p className="text-xs font-semibold text-gray-700">Loading Cohort Competency Data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <EmptyState
            icon={AlertCircle}
            title="Could not load competency heatmap"
            message={error}
            onRetry={() => fetchHeatmapData(selectedCourseId)}
          />
        </div>
      ) : concepts.length === 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <EmptyState
            icon={Network}
            title="No concepts found"
            message="No concepts are registered for this course track yet."
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col inst-card p-5 bg-white border border-[#E5E5E2] rounded-xl shadow-sm overflow-hidden">
          <div className="shrink-0 flex justify-between items-center border-b border-gray-100 pb-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Concept Mastery Distribution</h3>
              <p className="text-[11px] text-gray-500">Total Enrolled Cohort: <span className="font-bold text-[#174A7E]">{trainerKg?.total_enrolled || 0} Learners</span></p>
            </div>
            <span className="text-[11px] text-gray-500 italic">Click on weak learner groups to inspect profile drill-down</span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
            {concepts.map((c) => (
              <div key={c.concept_id} className="p-4 bg-[#F7F7F5] rounded-xl border border-[#E5E5E2] space-y-3">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{c.title}</h4>
                    <p className="text-[10px] text-gray-500">{c.module_name}</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 bg-white px-2.5 py-1 rounded-md border border-gray-200">
                    Class Avg Mastery: <span className="font-bold text-[#174A7E]">{c.avg_mastery}%</span>
                  </span>
                </div>

                {/* Stacked Trainee Counts */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-center font-semibold pt-1">
                  <div className="p-2.5 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-200">
                    <p className="text-sm font-extrabold">{c.counts.strong}</p>
                    <p className="text-[10px] uppercase font-bold text-emerald-800">Strong (80%+)</p>
                  </div>

                  <div className="p-2.5 bg-blue-50 text-blue-900 rounded-lg border border-blue-200">
                    <p className="text-sm font-extrabold">{c.counts.proficient}</p>
                    <p className="text-[10px] uppercase font-bold text-blue-800">Proficient (60-79%)</p>
                  </div>

                  <div className="p-2.5 bg-amber-50 text-amber-900 rounded-lg border border-amber-200">
                    <p className="text-sm font-extrabold">{c.counts.developing}</p>
                    <p className="text-[10px] uppercase font-bold text-amber-800">Developing (40-59%)</p>
                  </div>

                  {/* Weak / At-risk Group Clickable Drilldown */}
                  <div 
                    onClick={() => {
                      if (c.trainee_groups?.weak_trainee_ids?.length > 0) {
                        openDrilldown(c.trainee_groups.weak_trainee_ids[0]);
                      }
                    }}
                    className={`p-2.5 bg-red-50 text-red-900 rounded-lg border border-red-200 ${
                      c.counts.weak > 0 ? 'cursor-pointer hover:bg-red-100 transition-colors' : ''
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <p className="text-sm font-extrabold">{c.counts.weak}</p>
                      {c.counts.weak > 0 && <Eye className="w-3 h-3 text-red-700" />}
                    </div>
                    <p className="text-[10px] uppercase font-bold text-red-800">Weak / At-Risk (&lt;40%)</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
