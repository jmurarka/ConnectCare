import React, { useState } from 'react';
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  Headphones, 
  ArrowRight, 
  ArrowLeft,
  GraduationCap, 
  UserCheck, 
  Settings, 
  Mail, 
  Lock, 
  User, 
  CheckCircle2, 
  Leaf, 
  Sun,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RoleSelectionLanding() {
  const { login, register } = useAuth();

  // Role State: null | 'trainer' | 'trainee' | 'admin'
  const [selectedRole, setSelectedRole] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  // Login Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form Fields
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEducation, setRegEducation] = useState('B.Tech CS');
  const [regCurrentRole, setRegCurrentRole] = useState('Learner');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectRole = (roleType) => {
    setSelectedRole(roleType);
    setError('');
    setAuthMode('login');
    if (roleType === 'trainer') {
      setEmail('rajesh@capacityconnect.edu');
      setPassword('demo1234');
    } else if (roleType === 'trainee') {
      setEmail('jhanvi@capacityconnect.edu');
      setPassword('demo1234');
    } else if (roleType === 'admin') {
      setEmail('admin@capacityconnect.edu');
      setPassword('demo1234');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!fullName || !regEmail || !regPassword) {
      setError('Please complete all required fields.');
      return;
    }

    try {
      setLoading(true);
      await register(fullName, regEmail, regPassword, selectedRole || 'trainee', regEducation, regCurrentRole);
    } catch (err) {
      setError(err.message || 'Registration failed. Email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden flex flex-col md:flex-row bg-[#F5F2EB] font-sans selection:bg-[#C5A880] selection:text-zinc-950">
      
      {/* -------------------------------------------------- */}
      {/* LEFT HERO SECTION (Dark Atmospheric Editorial)     */}
      {/* -------------------------------------------------- */}
      <div className="w-full md:w-[46%] lg:w-[44%] bg-[#121214] text-white relative flex flex-col justify-between p-5 sm:p-6 lg:p-8 overflow-hidden shrink-0 h-full max-h-screen border-r border-zinc-800/80 shadow-2xl">
        
        {/* Background Image & Ambient Gradient Overlay */}
        <div 
          className="absolute inset-0 z-0 opacity-25 mix-blend-luminosity bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=1200')` }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#121214] via-[#121214]/85 to-[#121214]/50" />

        {/* Hero Upper Content */}
        <div className="relative z-10 space-y-4 sm:space-y-5 lg:space-y-6">
          
          {/* Top Brand Header */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E6CA9E] via-[#C5A880] to-[#8C6D3B] text-zinc-950 flex items-center justify-center font-black text-sm shadow-[0_0_20px_rgba(197,168,128,0.35)] ring-1 ring-amber-300/50 shrink-0">
              <ShieldCheck className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider text-white block leading-none">CAPACITY CONNECT</span>
              <span className="text-[9px] uppercase font-bold text-[#C5A880] tracking-widest mt-1 block">INSTITUTIONAL LMS & KG ENGINE</span>
            </div>
          </div>

          {/* Sub-tagline / Institutional Pillars */}
          <div className="flex items-center space-x-2 text-[9px] font-mono tracking-widest text-zinc-400 border-y border-zinc-800/80 py-2">
            <span className="text-zinc-300">PEOPLE</span>
            <span>&bull;</span>
            <span className="text-zinc-300">LEARNING</span>
            <span>&bull;</span>
            <span className="text-zinc-300">INSTITUTIONS</span>
            <span>&bull;</span>
            <span className="text-[#C5A880] font-bold">A BRIGHTER TOMORROW</span>
          </div>

          {/* Main Headline */}
          <div className="pt-1">
            <h1 className="text-2xl sm:text-3xl lg:text-[36px] xl:text-[40px] font-light text-white tracking-tight leading-[1.15]">
              Build capability. <br />
              <span className="font-serif italic font-normal text-[#C5A880]">
                Personalize potential.
              </span>
            </h1>
            <p className="text-xs text-zinc-300 mt-2 sm:mt-3 leading-relaxed max-w-sm font-normal">
              One intelligent learning ecosystem connecting trainers, trainees, and institutional operations.
            </p>
          </div>

          {/* 3 Elevated Glassmorphic Feature Cards */}
          <div className="pt-2 space-y-2.5 max-w-sm">
            <div className="flex items-start space-x-3 p-3 bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-xl hover:border-[#C5A880]/40 transition-all shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-[#C5A880]/15 text-[#C5A880] flex items-center justify-center shrink-0 border border-[#C5A880]/30 mt-0.5">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">Personalized Learning Trajectory</h4>
                <p className="text-[10px] text-zinc-400 mt-0.5">Adaptive Knowledge Graph paths tailored to every learner</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-xl hover:border-[#C5A880]/40 transition-all shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-[#C5A880]/15 text-[#C5A880] flex items-center justify-center shrink-0 border border-[#C5A880]/30 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">Empowered Institutional Educators</h4>
                <p className="text-[10px] text-zinc-400 mt-0.5">Custom curriculum overrides & diagnostic analytics</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-xl hover:border-[#C5A880]/40 transition-all shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-[#C5A880]/15 text-[#C5A880] flex items-center justify-center shrink-0 border border-[#C5A880]/30 mt-0.5">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">Tamper-Evident Admin Audit Engine</h4>
                <p className="text-[10px] text-zinc-400 mt-0.5">SHA-256 hash-chained logs & Maker-Checker governance</p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Clean Institutional Footer */}
        <div className="relative z-10 pt-4 shrink-0 border-t border-zinc-800/80">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-zinc-300 font-medium">KG Engine Active &bull; v1.0.0</span>
            </div>
            <span className="text-[#C5A880] font-semibold">Enterprise RBAC</span>
          </div>
        </div>

      </div>

      {/* -------------------------------------------------- */}
      {/* RIGHT INTERACTION SIDE (Warm Cream Section)        */}
      {/* -------------------------------------------------- */}
      <div className="flex-1 bg-[#F5F2EB] text-zinc-900 flex flex-col justify-between p-5 sm:p-6 lg:p-8 overflow-hidden h-full max-h-screen relative">
        
        {/* Top Minimal Navigation */}
        <div className="flex items-center justify-end space-x-5 text-xs font-semibold text-zinc-600 shrink-0 mb-2 sm:mb-4">
          <a href="#learn" className="hover:text-zinc-900 transition-colors">Learn</a>
          <a href="#teach" className="hover:text-zinc-900 transition-colors">Teach</a>
          <a href="#grow" className="hover:text-zinc-900 transition-colors">Grow</a>
          <a href="#about" className="hover:text-zinc-900 transition-colors">About</a>
          <span className="text-zinc-300">|</span>
          <button className="px-3 py-1 bg-[#EBE5D8] border border-[#DDD5C7] rounded-full text-zinc-800 hover:bg-[#E2DBCB] transition-colors flex items-center space-x-1.5 font-bold shadow-sm">
            <Headphones className="w-3 h-3 text-[#4A3E2A]" />
            <span>Support</span>
          </button>
        </div>

        {/* CENTER INTERACTION CONTAINER CARD */}
        <div className="w-full max-w-2xl mx-auto my-auto flex-1 min-h-0 flex flex-col justify-center py-2">
          
          {selectedRole === null ? (
            
            /* -------------------------------------------------- */
            /* STEP 1: ROLE SELECTION CARDS VIEW                  */
            /* -------------------------------------------------- */
            <div className="bg-[#FAF8F4] border border-[#E6E0D4] rounded-2xl p-5 sm:p-6 lg:p-8 shadow-xl shadow-amber-900/5 transition-all flex flex-col justify-between">
              
              <div className="text-center mb-4 sm:mb-6">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#C5A880]">
                  WELCOME TO CAPACITY CONNECT
                </span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-normal text-zinc-900 mt-0.5">
                  Choose how you use the platform
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Select your role to access a tailored experience
                </p>
              </div>

              {/* 3 Role Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
                
                {/* Trainer Role Card */}
                <div
                  onClick={() => handleSelectRole('trainer')}
                  className="bg-[#F5F2EC] hover:bg-[#FAF5EC] border border-[#E3DCD0] hover:border-[#C5A880] rounded-xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md"
                >
                  <div>
                    <div className="w-8 h-8 rounded-full bg-[#EAE4D7] text-[#4A3E2A] flex items-center justify-center mb-2.5 group-hover:bg-[#C5A880] group-hover:text-zinc-950 transition-colors">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-serif font-semibold text-zinc-900 mb-1 group-hover:text-[#4A3E2A]">Trainer</h3>
                    <p className="text-[11px] text-zinc-500 leading-snug">
                      Guide learners. Personalize learning paths. Monitor progress.
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <div className="w-7 h-7 rounded-full bg-[#E3DCD0] group-hover:bg-[#4A3E2A] group-hover:text-white text-zinc-700 flex items-center justify-center transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Trainee Role Card (Highlighted Default) */}
                <div
                  onClick={() => handleSelectRole('trainee')}
                  className="bg-[#FAF5EC] border-2 border-[#C5A880] rounded-xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer group shadow-md hover:shadow-lg relative"
                >
                  <div>
                    <div className="w-8 h-8 rounded-full bg-[#C5A880] text-zinc-950 flex items-center justify-center mb-2.5">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-serif font-semibold text-zinc-900 mb-1">Trainee</h3>
                    <p className="text-[11px] text-zinc-500 leading-snug">
                      Learn, practice, and track your personalized journey.
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <div className="w-7 h-7 rounded-full bg-[#4A3E2A] text-white flex items-center justify-center shadow-sm">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Admin Role Card */}
                <div
                  onClick={() => handleSelectRole('admin')}
                  className="bg-[#F5F2EC] hover:bg-[#FAF5EC] border border-[#E3DCD0] hover:border-[#C5A880] rounded-xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md"
                >
                  <div>
                    <div className="w-8 h-8 rounded-full bg-[#EAE4D7] text-[#4A3E2A] flex items-center justify-center mb-2.5 group-hover:bg-[#C5A880] group-hover:text-zinc-950 transition-colors">
                      <Settings className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-serif font-semibold text-zinc-900 mb-1 group-hover:text-[#4A3E2A]">Admin</h3>
                    <p className="text-[11px] text-zinc-500 leading-snug">
                      Manage the institution, users, programs, and platform operations.
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <div className="w-7 h-7 rounded-full bg-[#E3DCD0] group-hover:bg-[#4A3E2A] group-hover:text-white text-zinc-700 flex items-center justify-center transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

              </div>

              {/* Quote Footer Accent */}
              <div className="text-center pt-4 border-t border-[#E8E2D6] mt-4 sm:mt-6">
                <p className="font-serif italic text-xs text-zinc-500">
                  “Learning is a journey we build together.”
                </p>
              </div>

            </div>

          ) : (

            /* -------------------------------------------------- */
            /* STEP 2: DYNAMIC ROLE AUTHENTICATION FORM VIEW      */
            /* -------------------------------------------------- */
            <div className="bg-[#FAF8F4] border border-[#E6E0D4] rounded-2xl p-5 sm:p-6 shadow-xl shadow-amber-900/5 transition-all max-h-[calc(100vh-130px)] overflow-y-auto">
              
              {/* Change Role Back Link */}
              <button
                onClick={() => setSelectedRole(null)}
                className="inline-flex items-center space-x-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 mb-4 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change role</span>
              </button>

              <div className="flex items-center space-x-2 mb-1">
                <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#EAE4D7] text-[#4A3E2A] border border-[#DDD5C7]">
                  {selectedRole.toUpperCase()} PORTAL
                </span>
              </div>

              <h2 className="text-xl font-serif text-zinc-900 font-normal">Welcome back</h2>
              <p className="text-xs text-zinc-500 mt-0.5 mb-4">
                Sign in to your {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Portal
              </p>

              {/* Error Alert */}
              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg font-semibold mb-3">
                  {error}
                </div>
              )}

              {/* Mode Switch Tabs (Sign In / Create Account) */}
              <div className="flex bg-[#EAE4D7] p-1 rounded-lg border border-[#DDD5C7] text-xs font-semibold mb-4">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setError(''); }}
                  className={`flex-1 py-1 rounded-md transition-all ${
                    authMode === 'login' ? 'bg-[#18181B] text-white shadow-sm font-bold' : 'text-zinc-700 hover:text-zinc-950'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setError(''); }}
                  className={`flex-1 py-1 rounded-md transition-all ${
                    authMode === 'register' ? 'bg-[#18181B] text-white shadow-sm font-bold' : 'text-zinc-700 hover:text-zinc-950'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {authMode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Email / Institutional ID</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        placeholder={`${selectedRole}@capacityconnect.edu`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-[#DDD6C9] rounded-lg text-zinc-900 focus:outline-none focus:border-[#4A3E2A]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-zinc-700">Password</label>
                      <a href="#forgot" className="text-[10px] font-semibold text-[#4A3E2A] hover:underline">Forgot password?</a>
                    </div>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-[#DDD6C9] rounded-lg text-zinc-900 focus:outline-none focus:border-[#4A3E2A]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-0.5">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3 h-3 text-[#4A3E2A] accent-[#4A3E2A] rounded"
                    />
                    <label htmlFor="rememberMe" className="text-xs text-zinc-600">Remember me</label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-[#18181B] text-white text-xs font-bold rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-md flex items-center justify-center space-x-1.5 mt-1"
                  >
                    <span>{loading ? 'Signing in...' : `Sign In to ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Portal`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="relative flex py-1.5 items-center">
                    <div className="flex-grow border-t border-[#E6E0D4]"></div>
                    <span className="flex-shrink mx-2 text-[9px] uppercase tracking-wider text-zinc-400 font-bold">OR</span>
                    <div className="flex-grow border-t border-[#E6E0D4]"></div>
                  </div>

                  <p className="text-center text-xs text-zinc-600">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className="font-bold text-[#4A3E2A] hover:underline"
                    >
                      Create one
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Full Name *</label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Rajesh Kumar"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-[#DDD6C9] rounded-lg text-zinc-900 focus:outline-none focus:border-[#4A3E2A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Institutional Email *</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        placeholder="user@capacityconnect.edu"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-[#DDD6C9] rounded-lg text-zinc-900 focus:outline-none focus:border-[#4A3E2A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Password *</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        placeholder="Set account password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-[#DDD6C9] rounded-lg text-zinc-900 focus:outline-none focus:border-[#4A3E2A]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-[#18181B] text-white text-xs font-bold rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-md mt-1"
                  >
                    {loading ? 'Creating Account...' : `Register & Create ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Account`}
                  </button>

                  <p className="text-center text-xs text-zinc-600 pt-1">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="font-bold text-[#4A3E2A] hover:underline"
                    >
                      Sign In
                    </button>
                  </p>
                </form>
              )}

            </div>

          )}

        </div>

        {/* BOTTOM RIGHT VISUAL DETAIL & FOOTER */}
        <div className="shrink-0 flex items-center justify-between gap-4 pt-3 border-t border-[#E6E0D4] relative z-10">
          
          {/* 3 Feature Badges */}
          <div className="flex items-center space-x-5 text-xs">
            <div className="flex items-center space-x-1.5">
              <Leaf className="w-3.5 h-3.5 text-[#4A3E2A]" />
              <div>
                <p className="font-bold text-zinc-900 text-[10px] leading-none">Future-Ready Skills</p>
                <p className="text-[9px] text-zinc-500 leading-none mt-0.5">For a changing world</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-[#4A3E2A]" />
              <div>
                <p className="font-bold text-zinc-900 text-[10px] leading-none">Stronger Institutions</p>
                <p className="text-[9px] text-zinc-500 leading-none mt-0.5">Smarter learning</p>
              </div>
            </div>

            <div className="hidden lg:flex items-center space-x-1.5">
              <Sun className="w-3.5 h-3.5 text-[#4A3E2A]" />
              <div>
                <p className="font-bold text-zinc-900 text-[10px] leading-none">More Opportunities</p>
                <p className="text-[9px] text-zinc-500 leading-none mt-0.5">For every learner</p>
              </div>
            </div>
          </div>

          {/* Decorative Line Art & Footer Tag */}
          <div className="text-right text-[8px] uppercase font-mono tracking-widest text-zinc-400">
            <span className="hidden sm:inline">KNOWLEDGE • PEOPLE • </span>
            <span className="text-[#4A3E2A] font-bold">PROGRESS</span>
          </div>

        </div>

      </div>

    </div>
  );
}
