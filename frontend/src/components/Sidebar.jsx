import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Network, 
  Edit3, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  MessageSquare, 
  Star, 
  FolderGit2, 
  Award, 
  UserCheck, 
  Target, 
  Clock, 
  Map, 
  ShieldAlert,
  GraduationCap,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, mobileMenuOpen, setMobileMenuOpen }) {
  const { role } = useAuth();

  // Menu items for Trainee Portal (Diagnostic gate is completed post-enrollment, replaced with Assignments)
  const traineeMenuItems = [
    { id: 'dashboard', label: 'Trainee Dashboard', icon: LayoutDashboard },
    { id: 'goals', label: 'Goal & Courses', icon: Target },
    { id: 'assignments', label: 'Assignments & Submissions', icon: FileText },
    { id: 'availability', label: 'Availability Planner', icon: Clock },
    { id: 'roadmap', label: 'Personalized Roadmap', icon: Map },
    { id: 'kg', label: 'Knowledge Graph', icon: Network },
    { id: 'lesson', label: 'Learning Content', icon: BookOpen },
    { id: 'certificate', label: 'Digital Certificates', icon: Award },
  ];

  // Menu items for Trainer Portal
  const trainerMenuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'enrollments', label: 'Enrollment Moderation', icon: Users },
    { id: 'analytics', label: 'Competency Heatmap', icon: Network },
    { id: 'overrides', label: 'Roadmap Overrides', icon: Edit3 },
    { id: 'curriculum', label: 'Curriculum Studio', icon: BookOpen },
    { id: 'questionbank', label: 'Question Bank', icon: HelpCircle },
    { id: 'assignments', label: 'Assignments & Grading', icon: FileText },
    { id: 'discussions', label: 'Discussions Moderation', icon: MessageSquare },
    { id: 'ratings', label: 'Quality Analytics', icon: Star },
    { id: 'cohorts', label: 'Cohort Batches', icon: FolderGit2 },
    { id: 'certificates', label: 'Certificate Issuance', icon: Award },
    { id: 'profile', label: 'Educator Profile', icon: UserCheck },
  ];

  // Menu items for Admin Portal
  const adminMenuItems = [
    { id: 'admin', label: 'Admin PII & Audit Logs', icon: ShieldAlert },
    { id: 'overview', label: 'Trainer Overview', icon: LayoutDashboard },
    { id: 'enrollments', label: 'Enrollment Moderation', icon: Users },
    { id: 'analytics', label: 'Competency Heatmap', icon: Network },
    { id: 'curriculum', label: 'Curriculum Studio', icon: BookOpen },
    { id: 'dashboard', label: 'Trainee View', icon: GraduationCap },
  ];

  const currentMenuItems = role === 'trainer' 
    ? trainerMenuItems 
    : role === 'admin' 
    ? adminMenuItems 
    : traineeMenuItems;

  const sectionTitle = role === 'trainer'
    ? 'TRAINER PORTAL'
    : role === 'admin'
    ? 'ADMINISTRATOR'
    : 'TRAINEE MENU';

  const handleSelect = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Overlay Background */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container - Institutional Slate Navy & Royal Blue Theme */}
      <aside className={`
        fixed md:static top-14 bottom-0 left-0 z-30
        w-60 h-full bg-[#0F172A] text-slate-300 border-r border-slate-800 flex flex-col justify-between overflow-hidden
        transform transition-transform duration-200 ease-in-out shrink-0
        ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex-1 p-3 overflow-y-auto space-y-4">
          
          <div>
            <div className="flex items-center justify-between px-2 mb-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {sectionTitle}
              </p>
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                {role}
              </span>
            </div>

            <nav className="space-y-0.5">
              {currentMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`
                      w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group
                      ${isActive 
                        ? 'bg-[#2563EB] text-white font-bold shadow-sm' 
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'}
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Promo Blue Wave Card */}
          <div className="p-3 bg-gradient-to-br from-[#1E3A8A] to-[#0F172A] rounded-xl border border-blue-800 text-white space-y-2 relative overflow-hidden shadow-lg">
            <div className="absolute right-0 bottom-0 opacity-25 w-24 h-24 pointer-events-none">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 100C40 100 60 50 100 0V100H0Z" fill="#3B82F6"/>
              </svg>
            </div>
            <p className="font-bold text-xs leading-snug text-blue-100">
              Capacity Connect Knowledge Graph Platform
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-blue-200/80">AI/ML Adaptive Engine</span>
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/40">
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>

        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-slate-800 text-[10px] text-slate-400 text-center flex items-center justify-center space-x-1.5 bg-[#090D16]">
          <span>Capacity Connect v1.0.0</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
          <span>Institutional</span>
        </div>
      </aside>
    </>
  );
}
