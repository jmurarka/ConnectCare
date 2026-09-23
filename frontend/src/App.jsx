import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { AuthProvider, useAuth } from './context/AuthContext';

import TraineeDashboardView from './components/views/TraineeDashboardView';
import GoalCourseExplorerView from './components/views/GoalCourseExplorerView';
import DiagnosticAssessmentView from './components/views/DiagnosticAssessmentView';
import AvailabilityPlannerView from './components/views/AvailabilityPlannerView';
import RoadmapKnowledgeGraphView from './components/views/RoadmapKnowledgeGraphView';
import LessonPlayerView from './components/views/LessonPlayerView';
import TrainerPortalView from './components/views/TrainerPortalView';
import AdminPortalView from './components/views/AdminPortalView';
import CertificateView from './components/views/CertificateView';
import AssignmentsView from './components/views/AssignmentsView';

import { RefreshCw } from 'lucide-react';
import RoleSelectionLanding from './components/views/RoleSelectionLanding';

function MainLayout() {
  const { user, role, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const trainerTabs = ['overview', 'enrollments', 'analytics', 'overrides', 'curriculum', 'questionbank', 'assignments', 'discussions', 'ratings', 'cohorts', 'certificates', 'profile', 'trainer'];
  const traineeTabs = ['dashboard', 'goals', 'diagnostic', 'assignments', 'availability', 'roadmap', 'kg', 'lesson', 'certificate'];
  const adminTabs = ['admin', 'overview', 'enrollments', 'analytics', 'curriculum'];

  useEffect(() => {
    if (role === 'trainer' && !trainerTabs.includes(activeTab)) {
      setActiveTab('overview');
    } else if (role === 'admin' && !adminTabs.includes(activeTab)) {
      setActiveTab('admin');
    } else if (role === 'trainee' && !traineeTabs.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [role, activeTab]);

  const handleNavigate = (tabId) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0F172A] text-white flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto text-[#2563EB]" />
          <p className="text-sm font-bold tracking-wider uppercase text-white">Initializing Capacity Connect Engine...</p>
          <p className="text-xs text-slate-400">Verifying institutional RBAC security state</p>
        </div>
      </div>
    );
  }

  // Unauthenticated -> Show Role Selection Landing Page
  if (!user) {
    return <RoleSelectionLanding />;
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#F8FAFC]">
      
      {/* Top Navbar */}
      <Navbar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex w-full overflow-hidden">
        
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Center Main View Area */}
        <main className="flex-1 h-full min-h-0 w-full min-w-0 flex flex-col p-3.5 sm:p-6 overflow-y-auto pb-12">
          {role === 'trainer' ? (
            <TrainerPortalView activeSubTab={activeTab === 'trainer' ? 'overview' : activeTab} setActiveSubTab={setActiveTab} />
          ) : role === 'admin' ? (
            activeTab === 'admin' ? (
              <AdminPortalView />
            ) : (
              <TrainerPortalView activeSubTab={activeTab} setActiveSubTab={setActiveTab} />
            )
          ) : (
            <>
              {activeTab === 'dashboard' && <TraineeDashboardView onNavigate={handleNavigate} />}
              {activeTab === 'goals' && <GoalCourseExplorerView onNavigate={handleNavigate} />}
              {activeTab === 'diagnostic' && <DiagnosticAssessmentView onNavigate={handleNavigate} />}
              {activeTab === 'assignments' && <AssignmentsView onNavigate={handleNavigate} />}
              {activeTab === 'availability' && <AvailabilityPlannerView onNavigate={handleNavigate} />}
              {activeTab === 'roadmap' && <RoadmapKnowledgeGraphView onNavigate={handleNavigate} />}
              {activeTab === 'kg' && <RoadmapKnowledgeGraphView onNavigate={handleNavigate} />}
              {activeTab === 'lesson' && <LessonPlayerView onNavigate={handleNavigate} />}
              {activeTab === 'certificate' && <CertificateView onNavigate={handleNavigate} />}
            </>
          )}
        </main>

      </div>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
