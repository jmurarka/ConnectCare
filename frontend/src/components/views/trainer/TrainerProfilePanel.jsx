import React, { useState, useEffect } from 'react';
import { UserCheck, BookOpen, Save, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import EmptyState from '../../shared/EmptyState';
import Toast from '../../shared/Toast';

export default function TrainerProfilePanel() {
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [education, setEducation] = useState('');
  const [currentRole, setCurrentRole] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/api/trainer/profile');
      setProfile(data);
      setFullName(data.full_name || '');
      setEducation(data.education || '');
      setCurrentRole(data.current_role || '');
    } catch (err) {
      setError(err.message || 'Failed to load educator profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put('/api/trainer/profile', {
        full_name: fullName,
        education: education,
        current_role: currentRole
      });
      setToastMessage('Educator profile updated successfully!');
      fetchProfile();
    } catch (err) {
      setToastMessage(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white border border-[#E5E5E2] rounded-xl">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#174A7E]" />
        <p className="text-xs font-semibold text-gray-700">Loading Educator Profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Could not load trainer profile"
        message={error}
        onRetry={fetchProfile}
      />
    );
  }

  return (
    <div className="h-full w-full min-h-0 flex flex-col overflow-hidden space-y-4">
      
      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Header Banner */}
      <div className="shrink-0 inst-card p-4 sm:p-5 bg-white border border-[#E5E5E2] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-[#174A7E] mb-1">
            <UserCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase bg-[#EAF2F8] px-2 py-0.5 rounded">Educator Credentials</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">{profile?.full_name}'s Educator Profile</h2>
          <p className="text-xs text-gray-500">{profile?.current_role} &bull; {profile?.email}</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Left Column: Form Settings */}
        <div className="md:col-span-2 flex-1 min-h-0 overflow-y-auto inst-card bg-white border border-[#E5E5E2] rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">Edit Educator Information</h3>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Full Name:</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 bg-[#F7F7F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#174A7E] font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Education & Degrees:</label>
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full p-2.5 bg-[#F7F7F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#174A7E]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Current Academic Role / Specialization:</label>
              <input
                type="text"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                className="w-full p-2.5 bg-[#F7F7F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#174A7E]"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[#174A7E] text-white font-semibold text-xs rounded-lg hover:bg-[#12395F] transition-colors flex items-center space-x-1.5 shadow shrink-0"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Assigned Courses List */}
        <div className="flex-1 min-h-0 overflow-y-auto inst-card bg-white border border-[#E5E5E2] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-[#174A7E] border-b border-gray-100 pb-2">
            <BookOpen className="w-4 h-4" />
            <h3 className="font-bold text-sm text-gray-900">Assigned Teaching Tracks</h3>
          </div>

          <div className="space-y-2 text-xs">
            {profile?.assigned_courses?.length > 0 ? (
              profile.assigned_courses.map((c) => (
                <div key={c.course_id} className="p-3 bg-[#F7F7F5] border border-[#E5E5E2] rounded-lg">
                  <span className="font-extrabold text-[#174A7E] block">{c.code}</span>
                  <p className="font-bold text-gray-900">{c.title}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                    Level: {c.level}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No assigned courses found.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
