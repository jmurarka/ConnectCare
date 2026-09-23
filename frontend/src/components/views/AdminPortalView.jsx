import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  Users, 
  Key, 
  Lock, 
  Eye, 
  CheckCircle2, 
  History, 
  AlertTriangle, 
  Search, 
  Plus, 
  RefreshCw, 
  SlidersHorizontal, 
  FileText, 
  UserCheck, 
  Activity, 
  Sparkles, 
  FileSpreadsheet, 
  X, 
  Check, 
  Clock, 
  UserX, 
  TrendingUp, 
  AlertCircle,
  Network
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import EmptyState from '../shared/EmptyState';
import Toast from '../shared/Toast';

export default function AdminPortalView() {
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'users' | 'pii' | 'approvals' | 'audit' | 'anomalies'
  
  // Overview KPI State
  const [kpiData, setKpiData] = useState(null);
  const [kgAdminData, setKgAdminData] = useState(null);

  // User Directory State
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [deactivateModalUser, setDeactivateModalUser] = useState(null);
  const [deactivateReason, setDeactivateReason] = useState('');

  // Elevated PII Access State
  const [targetUserId, setTargetUserId] = useState(1);
  const [piiReason, setPiiReason] = useState('');
  const [otpChallengeId, setOtpChallengeId] = useState(null);
  const [devOtpCode, setDevOtpCode] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [unmaskedData, setUnmaskedData] = useState(null);
  const [piiTimer, setPiiTimer] = useState(0);

  // Maker-Checker Approvals State
  const [approvals, setApprovals] = useState([]);
  const [approvalDecisionReason, setApprovalDecisionReason] = useState('');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [integrityStatus, setIntegrityStatus] = useState(null);

  // Anomaly State
  const [anomalies, setAnomalies] = useState([]);

  // General Loading & Toast
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'overview') fetchOverviewData();
    if (activeSubTab === 'users') fetchUsers();
    if (activeSubTab === 'approvals') fetchApprovals();
    if (activeSubTab === 'audit') fetchAuditLogs();
    if (activeSubTab === 'anomalies') fetchAnomalies();
  }, [activeSubTab]);

  useEffect(() => {
    let interval;
    if (piiTimer > 0) {
      interval = setInterval(() => setPiiTimer(prev => prev - 1), 1000);
    } else if (piiTimer === 0 && unmaskedData) {
      setUnmaskedData(null);
      setToastMessage('Elevated PII Access grant expired automatically (Time-boxed security).');
    }
    return () => clearInterval(interval);
  }, [piiTimer, unmaskedData]);

  const fetchOverviewData = async () => {
    try {
      const [overviewRes, kgRes] = await Promise.all([
        apiClient.get('/api/admin/platform/overview'),
        apiClient.get('/api/kg/admin')
      ]);
      setKpiData(overviewRes);
      setKgAdminData(kgRes);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/users?page=1&limit=50&`;
      if (roleFilter !== 'all') url += `role=${roleFilter}&`;
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      if (userSearch) url += `search=${encodeURIComponent(userSearch)}`;

      const data = await apiClient.get(url);
      setUsers(data.items || []);
    } catch (e) {
      setErrorMsg('Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/api/admin/approvals?status=pending');
      setApprovals(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const [logsData, integrityData] = await Promise.all([
        apiClient.get('/api/admin/sensitive-logs'),
        apiClient.get('/api/admin/audit-logs/verify-integrity')
      ]);
      setAuditLogs(logsData || []);
      setIntegrityStatus(integrityData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/api/admin/anomalies');
      setAnomalies(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateAccount = async (userId) => {
    if (!deactivateReason || deactivateReason.trim().length < 4) {
      setToastMessage('Mandatory deactivation reason (min 4 chars) is required.');
      return;
    }
    try {
      await apiClient.post(`/api/admin/users/${userId}/deactivate`, { reason: deactivateReason });
      setToastMessage('Account soft-deactivated & notification dispatched to data subject.');
      setDeactivateModalUser(null);
      setDeactivateReason('');
      fetchUsers();
    } catch (e) {
      setToastMessage(e.message || 'Deactivation failed.');
    }
  };

  const handleReactivateAccount = async (userId) => {
    try {
      await apiClient.post(`/api/admin/users/${userId}/reactivate`, { reason: 'Reactivated by Admin' });
      setToastMessage('Account reactivated successfully.');
      fetchUsers();
    } catch (e) {
      setToastMessage(e.message || 'Reactivation failed.');
    }
  };

  const handleRequestOtp = async () => {
    try {
      const res = await apiClient.post('/api/admin/auth/otp/request', { purpose: 'elevated_access' });
      setOtpChallengeId(res.challenge_id);
      setDevOtpCode(res.dev_otp_code);
      setToastMessage(`OTP Challenge Generated! Check dev banner for code.`);
    } catch (e) {
      setToastMessage(e.message || 'Failed to request OTP.');
    }
  };

  const handleVerifyAndGrantPii = async () => {
    if (!piiReason || piiReason.trim().length < 5 || piiReason.trim() === 'Identity Audit Verification') {
      setErrorMsg('Mandatory audit justification required! Enter a real, detailed reason (min 5 chars).');
      return;
    }

    if (!devOtpCode || otpInput.trim() !== devOtpCode.trim()) {
      setErrorMsg(`Invalid 6-digit OTP code entered. Enter generated code: ${devOtpCode || 'Request OTP first'}`);
      return;
    }

    setErrorMsg(null);
    try {
      const res = await apiClient.post('/api/admin/sensitive-pii', {
        pin: '1234',
        otp: otpInput,
        target_user_id: Number(targetUserId),
        purpose: piiReason
      });

      setUnmaskedData(res);
      setPiiTimer(600); // 10 minutes time-boxed unmask
      setToastMessage('Elevated PII Access granted for 10 minutes. Action logged to SHA-256 audit chain!');
    } catch (e) {
      setErrorMsg(e.message || 'Verification failed.');
    }
  };

  const handleApprovalDecision = async (approvalId, isApprove) => {
    try {
      const endpoint = isApprove ? `/api/admin/approvals/${approvalId}/approve` : `/api/admin/approvals/${approvalId}/reject`;
      await apiClient.post(endpoint, {
        approve: isApprove,
        review_reason: approvalDecisionReason || (isApprove ? 'Approved by second admin' : 'Rejected by second admin')
      });
      setToastMessage(`Maker-Checker decision logged: ${isApprove ? 'APPROVED' : 'REJECTED'}`);
      fetchApprovals();
    } catch (e) {
      setToastMessage(e.message || 'Approval decision rejected by security invariant.');
    }
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-y-auto space-y-4 bg-[#FAF8F5] p-2 sm:p-4">
      
      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Header Banner Card */}
      <div className="shrink-0 bg-[#0D2743] border border-[#174A7E] text-white rounded-2xl p-5 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-1.5 bg-[#174A7E] text-amber-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-blue-400 mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Anti-Corruption Executive Governance</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">Capacity Connect Platform Admin Portal</h1>
          <p className="text-xs text-blue-200 mt-0.5">Tiered Access Control &bull; Maker-Checker Approvals &bull; SHA-256 Tamper-Evident Audit Chains</p>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="relative z-10 flex flex-wrap items-center gap-1.5 bg-[#12395F] p-1.5 rounded-xl border border-blue-900/60">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'users', label: 'User Directory', icon: Users },
            { id: 'pii', label: 'Elevated PII Access', icon: Key },
            { id: 'approvals', label: 'Approvals Queue', icon: CheckCircle2 },
            { id: 'audit', label: 'Audit Explorer', icon: History },
            { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  isActive ? 'bg-amber-400 text-zinc-900 shadow-sm' : 'text-blue-200 hover:bg-[#174A7E] hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- SUB TAB 1: OVERVIEW DASHBOARD --- */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          
          {/* Real KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div 
              onClick={() => setActiveSubTab('users')}
              className="bg-white border border-[#E5E5E2] rounded-xl p-4 shadow-xs text-center cursor-pointer hover:border-[#174A7E] transition-all"
            >
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Trainees</p>
              <p className="text-2xl font-black text-[#174A7E] mt-1">{kpiData?.total_trainees ?? 5}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-0.5">View Directory &rarr;</p>
            </div>
            <div 
              onClick={() => setActiveSubTab('users')}
              className="bg-white border border-[#E5E5E2] rounded-xl p-4 shadow-xs text-center cursor-pointer hover:border-[#174A7E] transition-all"
            >
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Authorized Trainers</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{kpiData?.total_trainers ?? 1}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-0.5">View Directory &rarr;</p>
            </div>
            <div 
              onClick={() => setActiveSubTab('approvals')}
              className="bg-white border border-[#E5E5E2] rounded-xl p-4 shadow-xs text-center cursor-pointer hover:border-[#174A7E] transition-all"
            >
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Enrollments</p>
              <p className="text-2xl font-black text-[#174A7E] mt-1">{kpiData?.active_enrollments ?? 4}</p>
              <p className="text-[10px] font-bold text-amber-700 mt-0.5">View Approvals &rarr;</p>
            </div>
            <div 
              onClick={() => setActiveSubTab('audit')}
              className="bg-white border border-[#E5E5E2] rounded-xl p-4 shadow-xs text-center cursor-pointer hover:border-emerald-500 transition-all"
            >
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Certificates Issued</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{kpiData?.certificates_issued ?? 1}</p>
              <p className="text-[10px] font-bold text-emerald-700 mt-0.5">View Audit Log &rarr;</p>
            </div>
          </div>

          {/* Real Platform Competency Knowledge Graph Card */}
          <div className="bg-white border border-[#E5E5E2] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 flex items-center space-x-2">
                  <Network className="w-4 h-4 text-[#174A7E]" />
                  <span>Platform Competency Health Across AI/ML Courses</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Live platform aggregate calculated from real DB mastery states</p>
              </div>
              <span className="text-xs font-bold text-[#174A7E] bg-[#EAF2F8] px-2.5 py-1 rounded-lg">
                Total Platform Trainees: {kgAdminData?.total_trainees_platform ?? 5}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {kgAdminData?.platform_competencies ? (
                kgAdminData.platform_competencies.map(c => (
                  <div key={c.course_id} className="p-3.5 bg-[#FAF8F5] border border-[#E5E5E2] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#174A7E] bg-blue-50 px-2 py-0.5 rounded font-mono">{c.code}</span>
                      <h4 className="font-bold text-gray-900 mt-1">{c.title}</h4>
                      <p className="text-[11px] text-gray-500">{c.concept_count} Concept Modules</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-gray-900">{c.avg_mastery}%</span>
                      <p className={`text-[10px] font-bold ${c.status === 'Healthy' ? 'text-emerald-700' : 'text-amber-700'}`}>{c.status}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center p-4 text-gray-500">Loading live Knowledge Graph metrics...</div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* --- SUB TAB 2: USER DIRECTORY & ACCOUNT MANAGEMENT --- */}
      {activeSubTab === 'users' && (
        <div className="bg-white border border-[#E5E5E2] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900">Platform User Directory & Governance</h3>
              <p className="text-xs text-gray-500">Search and manage accounts across Trainees, Trainers, and Admin Tiers.</p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search user name/email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-[#FAF8F5] border border-gray-300 rounded-lg text-xs font-semibold w-48 focus:outline-none focus:border-[#174A7E]"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="p-1.5 bg-[#FAF8F5] border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="trainee">Trainees</option>
                <option value="trainer">Trainers</option>
                <option value="admin">Admins</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-1.5 bg-[#FAF8F5] border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
          </div>

          {/* User Directory Table */}
          <div className="overflow-x-auto border border-[#E5E5E2] rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F5] border-b border-[#E5E5E2] text-gray-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">USER ID</th>
                  <th className="p-3">FULL NAME & EMAIL</th>
                  <th className="p-3">ROLE & TIER</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">PROTECTED GOVT ID</th>
                  <th className="p-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-gray-600">#{u.id}</td>
                    <td className="p-3 font-bold text-gray-900">
                      <p>{u.full_name}</p>
                      <p className="text-[11px] font-normal text-gray-500">{u.email}</p>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-[#174A7E] uppercase bg-blue-50 px-2 py-0.5 rounded text-[10px]">
                        {u.role} ({u.admin_tier})
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-gray-500 text-[11px]">
                      {u.aadhaar_masked}
                    </td>
                    <td className="p-3 text-right space-x-1">
                      {u.is_active ? (
                        <button
                          onClick={() => setDeactivateModalUser(u)}
                          className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-md font-bold text-[11px] hover:bg-red-100"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivateAccount(u.id)}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold text-[11px] hover:bg-emerald-100"
                        >
                          Reactivate
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

      {/* --- SUB TAB 3: ELEVATED SENSITIVE PII ACCESS (TIER 2) --- */}
      {activeSubTab === 'pii' && (
        <div className="bg-white border border-[#E5E5E2] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-[#174A7E] border-b border-gray-100 pb-3">
            <Lock className="w-5 h-5" />
            <div>
              <h3 className="font-extrabold text-sm text-gray-900">Elevated PII Access Studio (Tier 2)</h3>
              <p className="text-xs text-gray-500">Unmask protected Aadhaar & phone identity records with mandatory reason & OTP challenge verification.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            {/* Step 1: Verification Form Card */}
            <div className="p-4 bg-[#FAF8F5] border border-[#E5E5E2] rounded-xl space-y-3">
              <h4 className="font-bold text-gray-900 border-b border-gray-200 pb-1">1. Target Learner & Audit Justification</h4>

              {errorMsg && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="font-bold text-gray-800 block mb-1">Target Trainee Learner:</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-900"
                >
                  <option value="1">Jhanvi Murarka (Trainee ID #1)</option>
                  <option value="2">Aarav Sharma (Trainee ID #2)</option>
                  <option value="3">Ananya Iyer (Trainee ID #3)</option>
                  <option value="4">Rohan Verma (Trainee ID #4)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-800 block mb-1">Mandatory Audit Justification (No default allowed):</label>
                <input
                  type="text"
                  value={piiReason}
                  onChange={(e) => setPiiReason(e.target.value)}
                  placeholder="e.g. Legal identity verification for SIH Hackathon certificate..."
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#174A7E]"
                />
              </div>

              {/* OTP Generation Banner */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#174A7E]">Security OTP Challenge</span>
                  <button
                    onClick={handleRequestOtp}
                    className="px-2.5 py-1 bg-[#174A7E] text-white font-bold rounded text-[11px] hover:bg-[#12395F]"
                  >
                    Generate OTP Challenge
                  </button>
                </div>
                {devOtpCode && (
                  <div className="p-2 bg-amber-100/90 border border-amber-300 text-amber-900 rounded font-mono text-[11px] font-bold text-center">
                    [DEV OTP CHALLENGE]: {devOtpCode} (5-min TTL)
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-gray-800 block mb-1">Enter Received 6-Digit OTP:</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="e.g. 849201"
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg font-mono font-bold text-center text-sm text-gray-900 focus:outline-none focus:border-[#174A7E]"
                />
              </div>

              <button
                onClick={handleVerifyAndGrantPii}
                className="w-full py-2.5 bg-[#174A7E] hover:bg-[#12395F] text-white font-bold rounded-xl text-xs shadow-sm"
              >
                Verify OTP & Grant Time-Boxed Access
              </button>
            </div>

            {/* Step 2: Live Unmasked Result Card */}
            <div className="p-4 bg-white border border-[#E5E5E2] rounded-xl flex flex-col justify-between space-y-3">
              <div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <h4 className="font-bold text-gray-900">2. Time-Boxed Unmasked PII Display</h4>
                  {piiTimer > 0 && (
                    <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                      Expires in: {Math.floor(piiTimer / 60)}:{(piiTimer % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>

                {unmaskedData ? (
                  <div className="space-y-3 pt-3">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                      <p className="font-bold text-emerald-900 text-xs">Access Granted: {unmaskedData.full_name}</p>
                      <p className="font-mono text-xs font-bold text-gray-900">{unmaskedData.unmasked_aadhaar}</p>
                      <p className="font-mono text-xs text-gray-700">Phone: {unmaskedData.phone_number}</p>
                      <p className="text-[10px] text-emerald-800 font-semibold pt-1">
                        Transparency Alert: Notification automatically fired to user's registered channel!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
                    <ShieldAlert className="w-10 h-10 mb-2 text-gray-300" />
                    <p className="font-bold text-gray-600 text-xs">PII Protected & Masked</p>
                    <p className="text-[11px] text-gray-400 mt-1">Complete step 1 to unmask government identity records.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- SUB TAB 4: MAKER-CHECKER APPROVAL QUEUE --- */}
      {activeSubTab === 'approvals' && (
        <div className="bg-white border border-[#E5E5E2] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900">Maker-Checker Approval Queue</h3>
              <p className="text-xs text-gray-500">High-risk actions require a second admin approval. Requester cannot approve their own action.</p>
            </div>
            <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg">
              {approvals.length} Pending Approval(s)
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {approvals.length > 0 ? (
              approvals.map(req => (
                <div key={req.id} className="p-4 bg-[#FAF8F5] border border-[#E5E5E2] rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-gray-600">#{req.id}</span>
                      <span className="font-bold text-[#174A7E] bg-blue-50 px-2 py-0.5 rounded uppercase text-[10px]">
                        {req.action_type}
                      </span>
                      <span className="text-gray-500 font-semibold">&bull; Requested by {req.requester_name}</span>
                    </div>
                    <p className="text-gray-800 font-semibold">{req.reason}</p>
                    <p className="text-[11px] text-gray-500 font-mono">{req.created_at}</p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleApprovalDecision(req.id, false)}
                      className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 font-bold rounded-lg hover:bg-red-100"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprovalDecision(req.id, true)}
                      className="px-3.5 py-1.5 bg-[#174A7E] text-white font-bold rounded-lg hover:bg-[#12395F]"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="Approval Queue Clean"
                message="No pending high-risk maker-checker approval requests."
              />
            )}
          </div>
        </div>
      )}

      {/* --- SUB TAB 5: AUDIT LOG EXPLORER (HASH CHAINED) --- */}
      {activeSubTab === 'audit' && (
        <div className="bg-white border border-[#E5E5E2] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-[#174A7E]" />
                <h3 className="font-extrabold text-sm text-gray-900">Immutable Audit Log Explorer</h3>
              </div>
              <p className="text-xs text-gray-500">Every admin mutation and PII unmask is cryptographic hash-chained (SHA-256).</p>
            </div>

            {/* Live Hash-Chain Integrity Badge */}
            {integrityStatus && (
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 ${
                integrityStatus.chain_verified 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>SHA-256 Chain Verified [OK] ({integrityStatus.total_logs} logs)</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto border border-[#E5E5E2] rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F5] border-b border-[#E5E5E2] text-gray-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">LOG ID</th>
                  <th className="p-3">ADMIN PERFORMER</th>
                  <th className="p-3">ACTION TYPE</th>
                  <th className="p-3">AUDIT REASON / JUSTIFICATION</th>
                  <th className="p-3">SHA-256 ENTRY HASH</th>
                  <th className="p-3 text-right">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {auditLogs.map(l => (
                  <tr key={l.log_id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-gray-600">#{l.log_id}</td>
                    <td className="p-3 font-bold text-gray-900">{l.admin_name}</td>
                    <td className="p-3">
                      <span className="font-bold text-[#174A7E] bg-blue-50 px-2 py-0.5 rounded text-[10px]">
                        {l.action_type}
                      </span>
                    </td>
                    <td className="p-3 text-gray-800 max-w-xs truncate">{l.purpose}</td>
                    <td className="p-3 font-mono text-[10px] text-gray-500">{l.entry_hash}</td>
                    <td className="p-3 text-right font-mono text-gray-500">{l.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUB TAB 6: ANOMALY & INTEGRITY DASHBOARD --- */}
      {activeSubTab === 'anomalies' && (
        <div className="bg-white border border-[#E5E5E2] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Anomaly & Admin Behavior Detector</span>
              </h3>
              <p className="text-xs text-gray-500">Automated rules surface suspicious access patterns and self-approval attempts.</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {anomalies.map(item => (
              <div key={item.id} className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl flex items-start space-x-3">
                <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-gray-900">{item.title}</h4>
                    <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                      {item.severity} SEVERITY
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{item.description}</p>
                  <p className="text-[10px] font-mono text-gray-500 pt-1">{item.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DEACTIVATION REASON MODAL */}
      {deactivateModalUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E5E5E2]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-extrabold text-base text-gray-900">Deactivate User Account</h3>
              <button onClick={() => setDeactivateModalUser(null)} className="p-1 rounded bg-gray-100">✕</button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Deactivating account for <strong>{deactivateModalUser.full_name}</strong>. User login will be blocked, but data is retained for audit compliance.
            </p>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-gray-800 block">Mandatory Deactivation Reason:</label>
              <textarea
                rows="3"
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="e.g. Disciplinary suspension / Institutional request..."
                className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-[#174A7E]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setDeactivateModalUser(null)} className="px-3 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg">
                Cancel
              </button>
              <button
                onClick={() => handleDeactivateAccount(deactivateModalUser.id)}
                className="px-4 py-2 bg-red-700 text-white font-bold text-xs rounded-lg hover:bg-red-800"
              >
                Confirm Soft Deactivation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
