import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Sparkles, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';
import { traineeApi } from '../../api/traineeApi';

export default function AvailabilityPlannerView({ onNavigate }) {
  const [weeklyHours, setWeeklyHours] = useState({
    Mon: 2, Tue: 2, Wed: 2, Thu: 3, Fri: 2, Sat: 4, Sun: 3
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await traineeApi.getAvailability();
      if (data && data.weekly_hours) {
        setWeeklyHours(data.weekly_hours);
      }
    } catch (e) {
      setError(e.message || 'Failed to fetch weekly availability');
    } finally {
      setLoading(false);
    }
  };

  const totalWeeklyCapacity = Object.values(weeklyHours).reduce((a, b) => a + b, 0);
  const courseRequiredHours = 45; // AIML-02 Core ML
  const estimatedWeeks = Math.max(1, Math.ceil(courseRequiredHours / (totalWeeklyCapacity || 1)));

  // Calculate estimated completion date
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + (estimatedWeeks * 7));
  const dateFormatted = targetDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleSliderChange = (day, val) => {
    setWeeklyHours(prev => ({
      ...prev,
      [day]: parseFloat(val)
    }));
    setSavedSuccess(false);
  };

  const handleSavePlanner = async () => {
    setSaving(true);
    setError(null);
    try {
      await traineeApi.updateAvailability(weeklyHours, 3);
      setSavedSuccess(true);
    } catch (e) {
      setError(e.message || 'Failed to save availability planner');
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="inst-card p-6 bg-white border border-[#E5E5E2] rounded-xl space-y-3">
        <div className="flex items-center space-x-2 text-[#174A7E]">
          <Clock className="w-6 h-6" />
          <h1 className="text-xl font-bold text-gray-900">Learning Availability Planner</h1>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-3xl">
          Specify how many hours you can dedicate each day. The planning engine automatically combines your available capacity, diagnostic baseline, and concept prerequisites to calculate your personalized weekly timeline.
        </p>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Daily Availability Sliders */}
        <div className="lg:col-span-2 inst-card p-6 bg-white border border-[#E5E5E2] rounded-xl space-y-5">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
            Weekly Study Availability Schedule
          </h2>

          <div className="space-y-4">
            {Object.keys(weeklyHours).map((day) => {
              const val = weeklyHours[day];
              return (
                <div key={day} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-800">
                    <span>{day === 'Mon' ? 'Monday' : day === 'Tue' ? 'Tuesday' : day === 'Wed' ? 'Wednesday' : day === 'Thu' ? 'Thursday' : day === 'Fri' ? 'Friday' : day === 'Sat' ? 'Saturday' : 'Sunday'}</span>
                    <span className="text-[#174A7E] bg-[#EAF2F8] px-2 py-0.5 rounded">{val} hrs / day</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="0.5"
                    value={val}
                    onChange={(e) => handleSliderChange(day, e.target.value)}
                    className="w-full accent-[#174A7E] h-2 bg-gray-200 rounded-lg cursor-pointer"
                  />
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={handleSavePlanner}
              disabled={saving}
              className="px-5 py-2.5 bg-[#174A7E] hover:bg-[#12395F] text-white font-semibold text-xs rounded-lg transition-colors flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{saving ? 'Generating Roadmap...' : 'Calculate & Generate Roadmap'}</span>
            </button>

            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-700 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Schedule Saved & Roadmap Updated!
              </span>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Live Calculation Summary */}
        <div className="space-y-4">
          
          <div className="inst-card p-5 bg-[#174A7E] text-white rounded-xl space-y-4 shadow-md">
            <div className="flex items-center space-x-2 text-blue-200">
              <Calendar className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Capacity Calculation</h3>
            </div>

            <div className="space-y-3 border-t border-white/10 pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-blue-100">Weekly Capacity:</span>
                <span className="font-bold text-white text-sm">{totalWeeklyCapacity} hours / week</span>
              </div>

              <div className="flex justify-between">
                <span className="text-blue-100">Course Total Requirement:</span>
                <span className="font-semibold text-white">{courseRequiredHours} hours</span>
              </div>

              <div className="flex justify-between">
                <span className="text-blue-100">Estimated Duration:</span>
                <span className="font-bold text-emerald-300 text-sm">{estimatedWeeks} Weeks</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 text-center">
              <p className="text-[11px] text-blue-200">Estimated Completion Date</p>
              <p className="text-xl font-extrabold text-white mt-0.5">{dateFormatted}</p>
            </div>

            <button
              onClick={() => onNavigate('roadmap')}
              className="w-full py-2.5 bg-white text-[#12395F] hover:bg-blue-50 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5"
            >
              <span>View Personalized Roadmap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="inst-card p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold">Adaptive Intelligence Note:</p>
            <p className="leading-relaxed">
              If you miss days or complete assessments faster, Capacity Connect automatically adjusts your daily schedule and updates your estimated completion date.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
