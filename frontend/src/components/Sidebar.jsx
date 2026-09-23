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
  FileCheck2, 
  Clock, 
  Map, 
  ShieldAlert,
  GraduationCap,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, mobileMenuOpen, setMobileMenuOpen }) {
  const { role } = useAuth();

  // Menu items for Trainee Portal
  const traineeMenuItems = [
    { id: 'dashboard', label: 'Trainee Dashboard', icon: LayoutDashboard },
    { id: 'goals', label: 'Goal & Courses', icon: Target },
    { id: 'diagnostic', label: 'Diagnostic Entry Gate', icon: FileCheck2 },
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
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:static top-14 bottom-0 left-0 z-30
        w-60 h-full bg-[#18181B] text-zinc-300 border-r border-zinc-800 flex flex-col justify-between overflow-hidden
        transform transition-transform duration-200 ease-in-out shrink-0
        ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex-1 p-3 overflow-y-auto space-y-4">
          
          <div>
            <div className="flex items-center justify-between px-2 mb-3">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                {sectionTitle}
              </p>
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#2D2820] text-[#C5A880] border border-[#524432]">
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
                        ? 'bg-[#2A2723] text-[#D4AF37] font-bold shadow-sm border-l-2 border-[#D4AF37]' 
                        : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100'}
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4AF37]' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Promo Wave Card (As in reference image) */}
          <div className="p-3 bg-gradient-to-br from-[#2D2820] to-[#1F1C18] rounded-xl border border-[#483B2A] text-white space-y-2 relative overflow-hidden shadow-lg">
            <div className="absolute right-0 bottom-0 opacity-20 w-24 h-24 pointer-events-none">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 100C40 100 60 50 100 0V100H0Z" fill="#C5A880"/>
              </svg>
            </div>
            <p className="font-bold text-xs leading-snug text-amber-100">
              Empowering Educators for a Smarter Tomorrow
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-amber-200/70">Capacity KG Engine</span>
              <div className="w-6 h-6 rounded-full bg-[#C5A880]/20 text-[#D4AF37] flex items-center justify-center border border-[#C5A880]/40">
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>

        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-zinc-800/80 text-[10px] text-zinc-400 text-center flex items-center justify-center space-x-1.5 bg-[#141416]">
          <span>Capacity Connect v1.0.0</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
          <span>Institutional</span>
        </div>
      </aside>
    </>
  );
}
