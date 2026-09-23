import React, { useState } from 'react';
import { LayoutDashboard, Users, Network, Edit3, BookOpen, HelpCircle, FileText, Award, UserCheck, MessageSquare, Star, FolderGit2 } from 'lucide-react';
import OverviewPanel from './trainer/OverviewPanel';
import EnrollmentQueuePanel from './trainer/EnrollmentQueuePanel';
import CompetencyHeatmapPanel from './trainer/CompetencyHeatmapPanel';
import RoadmapOverridePanel from './trainer/RoadmapOverridePanel';
import CurriculumStudioPanel from './trainer/CurriculumStudioPanel';
import QuestionBankPanel from './trainer/QuestionBankPanel';
import AssignmentGradingPanel from './trainer/AssignmentGradingPanel';
import CertificateIssuancePanel from './trainer/CertificateIssuancePanel';
import TrainerProfilePanel from './trainer/TrainerProfilePanel';
import DiscussionModerationPanel from './trainer/DiscussionModerationPanel';
import TrainerAnalyticsPanel from './trainer/TrainerAnalyticsPanel';
import CohortManagementPanel from './trainer/CohortManagementPanel';

export default function TrainerPortalView({ activeSubTab: externalTab, setActiveSubTab: setExternalTab }) {
  const [internalTab, setInternalTab] = useState('overview');
  const [overrideTarget, setOverrideTarget] = useState(null);

  const activeSubTab = externalTab || internalTab;
  const setActiveSubTab = setExternalTab || setInternalTab;

  const handleSelectTraineeForOverride = (traineeId, courseId) => {
    setOverrideTarget({ traineeId, courseId });
    setActiveSubTab('overrides');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'enrollments', label: 'Enrollment Moderation', icon: Users },
    { id: 'analytics', label: 'Competency Heatmap', icon: Network },
    { id: 'overrides', label: 'Roadmap Overrides', icon: Edit3 },
    { id: 'curriculum', label: 'Curriculum Studio', icon: BookOpen },
    { id: 'questionbank', label: 'Question Bank', icon: HelpCircle },
    { id: 'assignments', label: 'Assignments & Grading', icon: FileText },
    { id: 'discussions', label: 'Discussions', icon: MessageSquare },
    { id: 'ratings', label: 'Quality Analytics', icon: Star },
    { id: 'cohorts', label: 'Cohort Batches', icon: FolderGit2 },
    { id: 'certificates', label: 'Certificate Issuance', icon: Award },
    { id: 'profile', label: 'Educator Profile', icon: UserCheck },
  ];

  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-y-auto pr-1 space-y-4">
      
      {/* Main Tab Panels Rendering */}
      <div className="w-full flex-1 flex flex-col">
        {activeSubTab === 'overview' && (
          <OverviewPanel 
            onNavigateSubTab={(subTab) => setActiveSubTab(subTab)} 
            onSelectTraineeForOverride={handleSelectTraineeForOverride}
          />
        )}

        {activeSubTab === 'enrollments' && (
          <EnrollmentQueuePanel />
        )}

        {activeSubTab === 'analytics' && (
          <CompetencyHeatmapPanel />
        )}

        {activeSubTab === 'overrides' && (
          <RoadmapOverridePanel 
            preselectedTraineeId={overrideTarget?.traineeId}
            preselectedCourseId={overrideTarget?.courseId}
          />
        )}

        {activeSubTab === 'curriculum' && (
          <CurriculumStudioPanel />
        )}

        {activeSubTab === 'questionbank' && (
          <QuestionBankPanel />
        )}

        {activeSubTab === 'assignments' && (
          <AssignmentGradingPanel />
        )}

        {activeSubTab === 'discussions' && (
          <DiscussionModerationPanel />
        )}

        {activeSubTab === 'ratings' && (
          <TrainerAnalyticsPanel />
        )}

        {activeSubTab === 'cohorts' && (
          <CohortManagementPanel />
        )}

        {activeSubTab === 'certificates' && (
          <CertificateIssuancePanel />
        )}

        {activeSubTab === 'profile' && (
          <TrainerProfilePanel />
        )}
      </div>

    </div>
  );
}

