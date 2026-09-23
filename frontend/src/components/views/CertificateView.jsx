import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, ShieldCheck, Printer, Search, RefreshCw, Lock, BookOpen, ArrowRight, QrCode } from 'lucide-react';
import { traineeApi } from '../../api/traineeApi';
import { useAuth } from '../../context/AuthContext';

export default function CertificateView({ onNavigate }) {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCertIndex, setSelectedCertIndex] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [certs, dash] = await Promise.all([
        traineeApi.getCertificates().catch(() => []),
        traineeApi.getDashboard().catch(() => null)
      ]);
      setCertificates(certs || []);
      setDashboardData(dash);
      if (certs && certs.length > 0) {
        setVerifyCode(certs[0].certificate_code);
      }
    } catch (e) {
      setError(e.message || 'Failed to load certificate information');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyCode.trim()) return;
    setSearching(true);
    setVerifyResult(null);
    try {
      const data = await traineeApi.verifyCertificate(verifyCode.trim());
      setVerifyResult(data);
    } catch (e) {
      setVerifyResult({ is_valid: false, message: e.message || 'Invalid certificate code' });
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#174A7E]" />
        <p className="text-sm font-medium">Verifying Institutional Certificate Records...</p>
      </div>
    );
  }

  const activeCert = certificates.length > 0 ? certificates[selectedCertIndex] || certificates[0] : null;
  const currentCourse = dashboardData?.current_course;
  const traineeName = user?.full_name || 'Trainee Learner';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Print-Only CSS Styles: Hides navbar, sidebar, buttons during print */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #certificate-print-area, #certificate-print-area * {
            visibility: visible !important;
          }
          #certificate-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 40px !important;
            box-shadow: none !important;
            border: 6px solid #174A7E !important;
            background: #FFFFFF !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Banner (Screen Only) */}
      <div className="no-print inst-card p-5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-[#174A7E] mb-1">
            <Award className="w-5 h-5" />
            <span className="text-xs font-bold uppercase bg-[#EAF2F8] px-2 py-0.5 rounded">Digital Certification</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Official Institutional Certificate</h1>
          <p className="text-xs text-slate-600">Formal capacity credential &bull; Awarded upon 100% course completion</p>
        </div>

        {activeCert && (
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 flex items-center space-x-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#174A7E]" />
            <span>Print / Save PDF</span>
          </button>
        )}
      </div>

      {/* Multiple Certificates Selector Tabs */}
      {certificates.length > 1 && (
        <div className="no-print flex space-x-2 border-b border-slate-200 pb-2">
          {certificates.map((c, idx) => (
            <button
              key={c.id}
              onClick={() => setSelectedCertIndex(idx)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedCertIndex === idx ? 'bg-[#174A7E] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {c.course_code || `Certificate #${idx + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* MAIN DISPLAY: ACTIVE CERTIFICATE OR NO CERTIFICATE EARNED STATE */}
      {activeCert ? (
        /* FORMAL CERTIFICATE DISPLAY BOX (Print Target ID) */
        <div id="certificate-print-area" className="inst-card p-8 sm:p-12 bg-white border-4 border-[#174A7E] rounded-xl space-y-8 text-center shadow-lg relative overflow-hidden">
          
          {/* Background Seal */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <Award className="w-96 h-96 text-[#174A7E]" />
          </div>

          {/* Certificate Header */}
          <div className="space-y-2 relative">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#174A7E] text-white flex items-center justify-center font-extrabold text-2xl shadow-md border-2 border-blue-200">
              CC
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-extrabold tracking-widest text-[#174A7E] uppercase pt-2">
              Certificate of Completion
            </h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
              Capacity Connect Institutional Learning Board
            </p>
          </div>

          {/* Recipient Details */}
          <div className="space-y-4 max-w-xl mx-auto relative">
            <p className="text-xs text-slate-600 italic">This is to certify that</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 underline decoration-[#174A7E] decoration-2 underline-offset-8 uppercase">
              {activeCert.trainee_name || traineeName}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed pt-2">
              has successfully fulfilled all required modules, diagnostic assessments, and competency standards for the capacity-building course in
            </p>
            <p className="text-lg font-bold text-[#174A7E] bg-[#F0F7FF] py-2 px-4 rounded-lg border border-blue-200">
              {activeCert.course_code ? `${activeCert.course_code}: ` : ''}{activeCert.course_title}
            </p>
          </div>

          {/* Footer Meta Details with QR Code Verification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-200 text-left text-xs relative items-center">
            
            {/* Left: Certificate Code & Date */}
            <div className="space-y-1">
              <p className="text-slate-500 font-semibold">Certificate ID:</p>
              <p className="font-mono font-bold text-[#174A7E] text-sm">{activeCert.certificate_code}</p>
              <p className="text-[11px] text-slate-500">Issued On: <span className="font-semibold text-slate-800">{activeCert.issued_date}</span></p>
            </div>

            {/* Center: Real QR Code Verification */}
            <div className="flex flex-col items-center justify-center space-y-1 text-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://capacityconnect.edu/verify/${activeCert.certificate_code}`}
                alt="Certificate Verification QR Code"
                className="w-20 h-20 border border-slate-300 p-1 bg-white rounded shadow-xs"
              />
              <span className="text-[9px] font-mono text-slate-500">Scan to Verify Authenticity</span>
            </div>

            {/* Right: Signature */}
            <div className="text-right space-y-1">
              <p className="text-slate-500 font-semibold">Authorized Authority:</p>
              <p className="font-bold text-slate-900 text-sm italic font-serif">Dr. Rajesh Kumar</p>
              <p className="text-[11px] text-slate-500">Lead Educator & Program Director</p>
            </div>

          </div>

        </div>
      ) : (
        /* NO CERTIFICATE EARNED YET STATE */
        <div className="no-print inst-card p-8 bg-white border border-slate-200 rounded-xl space-y-6 text-center shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-[#174A7E] flex items-center justify-center border border-blue-200">
            <Lock className="w-7 h-7" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-bold text-slate-900">No Certificates Earned Yet</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Welcome, <span className="font-bold text-slate-800">{traineeName}</span>! Official digital certificates are issued by program trainers upon 100% completion of course concepts and passing diagnostic assessments.
            </p>
          </div>

          {/* Current In-Progress Course Card */}
          {currentCourse && (
            <div className="max-w-lg mx-auto p-4 bg-slate-50 border border-slate-200 rounded-lg text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#174A7E] bg-[#EAF2F8] px-2 py-0.5 rounded">
                  {currentCourse.code}
                </span>
                <span className="text-xs font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Course In-Progress
                </span>
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">{currentCourse.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">Current Progress: <span className="font-bold text-[#174A7E]">{currentCourse.progress}%</span></p>
              </div>

              {/* Mastery Progress Bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-[#174A7E] h-full rounded-full transition-all duration-300" style={{ width: `${currentCourse.progress}%` }} />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => onNavigate && onNavigate('roadmap')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#174A7E] hover:bg-[#12395F] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Continue Learning in Roadmap</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Public Certificate Verification Tool Box (Screen Only) */}
      <div className="no-print inst-card p-6 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
        <div className="flex items-center space-x-2 text-slate-900">
          <ShieldCheck className="w-5 h-5 text-[#174A7E]" />
          <h3 className="text-sm font-bold">Public Certificate Verification Lookup</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
            placeholder="Enter Certificate Code (e.g. CC-AIML-2026-000184)"
            className="flex-1 p-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#174A7E]"
          />
          <button
            onClick={handleVerify}
            disabled={searching}
            className="px-5 py-2.5 bg-[#174A7E] hover:bg-[#12395F] text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5"
          >
            <Search className="w-4 h-4" />
            <span>Verify Certificate</span>
          </button>
        </div>

        {verifyResult && (
          <div className={`p-4 rounded-lg border text-xs space-y-1 ${verifyResult.is_valid ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-900 border-red-200'}`}>
            {verifyResult.is_valid ? (
              <>
                <p className="font-bold flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" />
                  Authentic Verified Certificate
                </p>
                <p className="text-[11px]">Issued to: <span className="font-bold">{verifyResult.trainee_name}</span> &bull; Course: <span className="font-bold">{verifyResult.course_title}</span> &bull; Code: <span className="font-mono font-bold">{verifyResult.certificate_code}</span></p>
              </>
            ) : (
              <p className="font-bold">Invalid or Unverified Certificate Code.</p>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
