import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import EmptyState from '../../shared/EmptyState';
import Toast from '../../shared/Toast';

import { useAuth } from '../../../context/AuthContext';

export default function CertificateIssuancePanel() {
  const { role } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(2); // AIML-01 default
  const [eligibleTrainees, setEligibleTrainees] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [issuingId, setIssuingId] = useState(null);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if ((role === 'trainer' || role === 'admin') && selectedCourseId) {
      fetchEligibleTrainees(selectedCourseId);
    }
  }, [selectedCourseId, role]);

  const fetchCourses = async () => {
    try {
      const data = await apiClient.get('/api/courses');
      setCourses(data);
      if (data.length > 0) {
        const preferred = data.find(c => c.code === 'AIML-01') || data.find(c => c.code === 'AIML-02') || data[0];
        setSelectedCourseId(preferred.id);
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchEligibleTrainees = async (courseId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(`/api/trainer/courses/${courseId}/completion-eligible`);
      setEligibleTrainees(data.eligible_trainees || []);
    } catch (err) {
      setError(err.message || 'Failed to load eligible trainees');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCertificate = async (traineeId) => {
    setIssuingId(traineeId);
    try {
      const res = await apiClient.post('/api/trainer/certificates/issue', {
        trainee_id: traineeId,
        course_id: selectedCourseId
      });
      setToastMessage(`Certificate ${res.certificate_code} issued successfully!`);
      fetchEligibleTrainees(selectedCourseId);
    } catch (err) {
      setToastMessage(err.message || 'Failed to issue certificate');
    } finally {
      setIssuingId(null);
    }
  };

  return (
    <div className="h-full w-full min-h-0 flex flex-col overflow-hidden space-y-3 bg-[#F4F1EA]">
      
      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Header Banner Hero */}
      <div className="shrink-0 bg-[#EBE6DD] border border-[#DDD5C7] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#4A3E2A] text-amber-200 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1 bg-[#DDD5C7] text-[#4A3E2A] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#CCC2B2] mb-0.5">
                <span>Credential Management</span>
              </div>
              <h2 className="text-base font-extrabold text-zinc-900 leading-none">Institutional Certificate Issuance Center</h2>
            </div>
          </div>
          <p className="text-xs text-zinc-600 mt-1">
            Award verifiable digital certificates to learners who have completed course prerequisites & mastery threshold.
          </p>
        </div>

        {/* Course Selector */}
        <div className="flex items-center space-x-2 shrink-0">
          <label className="text-xs font-bold text-zinc-700">Course Track:</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(Number(e.target.value))}
            className="p-1.5 bg-white border border-[#DDD6C9] rounded-lg text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#4A3E2A]"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}: {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Eligible Trainees Table Section */}
      {loading ? (
        <div className="flex-1 min-h-0 flex items-center justify-center p-12 text-center text-gray-500 bg-white border border-[#E5E5E2] rounded-xl">
          <div>
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#174A7E]" />
            <p className="text-xs font-semibold text-gray-700">Checking Completion Eligibility...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <EmptyState
            icon={AlertCircle}
            title="Could not load completion eligibility"
            message={error}
            onRetry={() => fetchEligibleTrainees(selectedCourseId)}
          />
        </div>
      ) : eligibleTrainees.length === 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <EmptyState
            icon={Award}
            title="No eligible learners"
            message="No trainees are currently enrolled or eligible for certificate issuance in this track."
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col inst-card bg-white border border-[#E5E5E2] rounded-xl p-4 shadow-sm overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto border border-[#E5E5E2] rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#F7F7F5] z-10">
                <tr className="border-b border-[#E5E5E2] text-gray-700 font-bold uppercase tracking-wider">
                  <th className="p-3">Learner Name</th>
                  <th className="p-3">Diagnostic Score</th>
                  <th className="p-3">Avg Mastery</th>
                  <th className="p-3">Eligibility Status</th>
                  <th className="p-3">Certificate Code</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {eligibleTrainees.map((t) => (
                  <tr key={t.trainee_id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <p className="font-bold text-gray-900">{t.full_name}</p>
                      <p className="text-[10px] text-gray-500">{t.email}</p>
                    </td>
                    <td className="p-3 font-bold text-[#174A7E]">{t.diagnostic_score}%</td>
                    <td className="p-3 font-bold text-gray-800">{t.avg_mastery_percentage}%</td>
                    <td className="p-3">
                      {t.already_issued ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-[#174A7E] border border-blue-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Issued</span>
                        </span>
                      ) : t.is_eligible ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Eligible to Award
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          Pending Threshold
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-gray-800">
                      {t.existing_certificate_code || '—'}
                    </td>
                    <td className="p-3 text-right">
                      {t.already_issued ? (
                        <span className="text-[11px] text-gray-400 font-semibold">Awarded</span>
                      ) : (
                        <button
                          disabled={issuingId === t.trainee_id || !t.is_eligible}
                          onClick={() => handleIssueCertificate(t.trainee_id)}
                          className="px-3 py-1.5 bg-[#174A7E] hover:bg-[#12395F] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded text-xs transition-colors flex items-center space-x-1 ml-auto"
                        >
                          {issuingId === t.trainee_id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Award className="w-3.5 h-3.5" />
                          )}
                          <span>Issue Certificate</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
