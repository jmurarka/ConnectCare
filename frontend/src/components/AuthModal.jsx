import React, { useState } from 'react';
import { X, LogIn, UserPlus, Lock, Mail, User, Briefcase, GraduationCap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('trainee');
  const [regEducation, setRegEducation] = useState('B.Tech CS');
  const [regCurrentRole, setRegCurrentRole] = useState('Learner');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!loginEmail || !loginPassword) {
      setError('Please provide email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(loginEmail, loginPassword);
      onClose();
    } catch (err) {
      setError(err.message || 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!regFullName || !regEmail || !regPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      await register(regFullName, regEmail, regPassword, regRole, regEducation, regCurrentRole);
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed. Email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (email, password) => {
    setLoginEmail(email);
    setLoginPassword(password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white border border-[#E5E5E2] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-[#174A7E] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg border border-white/20">
              CC
            </div>
            <div>
              <h2 className="text-lg font-bold">Capacity Connect</h2>
              <p className="text-xs text-blue-100">Institutional LMS & Adaptive Knowledge Graph Engine</p>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex bg-black/20 p-1 rounded-xl mt-5 border border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'login' ? 'bg-white text-[#174A7E] shadow-md font-bold' : 'text-white/80 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setError(''); }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'register' ? 'bg-white text-[#174A7E] shadow-md font-bold' : 'text-white/80 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold">
              {error}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="name@connectcare.edu"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-[#E5E5E2] rounded-xl focus:outline-none focus:border-[#174A7E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-[#E5E5E2] rounded-xl focus:outline-none focus:border-[#174A7E]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#174A7E] text-white text-xs font-bold rounded-xl hover:bg-[#12395F] disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
              </button>

              {/* Demo Account Fillers */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Sign-In Accounts</p>
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('rajesh@capacityconnect.edu', 'demo1234')}
                    className="p-1.5 border border-blue-200 bg-blue-50 text-[#174A7E] rounded-lg font-semibold hover:bg-blue-100"
                  >
                    Trainer Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('jhanvi@capacityconnect.edu', 'demo1234')}
                    className="p-1.5 border border-emerald-200 bg-emerald-50 text-emerald-800 rounded-lg font-semibold hover:bg-emerald-100"
                  >
                    Trainee Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin@capacityconnect.edu', 'demo1234')}
                    className="p-1.5 border border-purple-200 bg-purple-50 text-purple-800 rounded-lg font-semibold hover:bg-purple-100"
                  >
                    Admin Demo
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Dr. Rajesh Kumar"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-[#E5E5E2] rounded-xl focus:outline-none focus:border-[#174A7E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="user@connectcare.edu"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-[#E5E5E2] rounded-xl focus:outline-none focus:border-[#174A7E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Set account password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-[#E5E5E2] rounded-xl focus:outline-none focus:border-[#174A7E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Role Type</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full text-xs py-2 px-2.5 border border-[#E5E5E2] rounded-xl focus:outline-none focus:border-[#174A7E] bg-white font-semibold"
                  >
                    <option value="trainee">Trainee Learner</option>
                    <option value="trainer">Trainer Educator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Education</label>
                  <input
                    type="text"
                    placeholder="Ph.D. / M.Tech"
                    value={regEducation}
                    onChange={(e) => setRegEducation(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-[#E5E5E2] rounded-xl focus:outline-none focus:border-[#174A7E]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#174A7E] text-white text-xs font-bold rounded-xl hover:bg-[#12395F] disabled:opacity-50 transition-colors shadow-sm mt-2"
              >
                {loading ? 'Creating Account...' : 'Register & Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
