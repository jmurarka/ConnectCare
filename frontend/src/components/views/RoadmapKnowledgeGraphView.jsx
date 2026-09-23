import React, { useState, useEffect } from 'react';
import { Map, Network, Sparkles, CheckCircle2, Lock, AlertTriangle, HelpCircle, ArrowRight, UserCheck, RefreshCw } from 'lucide-react';
import { traineeApi } from '../../api/traineeApi';

export default function RoadmapKnowledgeGraphView({ onNavigate }) {
  const [activeSubTab, setActiveSubTab] = useState('roadmap'); // 'roadmap' | 'kg'
  const [roadmapData, setRoadmapData] = useState(null);
  const [kgData, setKgData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rm, kg] = await Promise.all([
        traineeApi.getRoadmap(3),
        traineeApi.getKnowledgeGraph(3)
      ]);

      if (rm) setRoadmapData(rm);
      if (kg) {
        setKgData(kg);
        if (kg.nodes && kg.nodes.length > 0) {
          setSelectedNode(kg.nodes[0]);
        }
      }
    } catch (e) {
      setError(e.message || 'Failed to fetch Knowledge Graph & Roadmap');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#174A7E]" />
        <p className="text-sm font-medium">Fetching Knowledge Graph & Personalized Roadmap...</p>
      </div>
    );
  }

  // Fallback items if API returned empty
  const items = (roadmapData && roadmapData.items && roadmapData.items.length > 0) ? roadmapData.items : [
    { id: 1, title: 'Python Basics & Syntax', module_name: 'Python Programming', week_number: 1, estimated_hours: 1.0, status: 'skipped_mastered', reason_explanation: 'Fast-tracked revision (85% diagnostic score)' },
    { id: 2, title: 'Linear Algebra & Vectors', module_name: 'Mathematics for ML', week_number: 1, estimated_hours: 1.25, status: 'skipped_mastered', reason_explanation: 'Fast-tracked revision (80% diagnostic score)' },
    { id: 3, title: 'Calculus & Gradients', module_name: 'Mathematics for ML', week_number: 1, estimated_hours: 3.75, status: 'needs_revision', reason_explanation: 'Targeted learning: Focused practice scheduled (65% baseline)' },
    { id: 4, title: 'NumPy & pandas Data Wrangling', module_name: 'Data Analysis Tools', week_number: 2, estimated_hours: 4.5, status: 'needs_revision', reason_explanation: 'Targeted learning (75% baseline score)' },
    { id: 5, title: 'Linear & Logistic Regression', module_name: 'Supervised Learning', week_number: 2, estimated_hours: 6.0, status: 'in_progress', reason_explanation: 'Standard comprehensive learning module' },
    { id: 6, title: 'Decision Trees & Random Forests', module_name: 'Supervised Learning', week_number: 3, estimated_hours: 6.0, status: 'upcoming', reason_explanation: 'Scheduled after Linear Regression' },
    { id: 7, title: 'Neural Network Fundamentals', module_name: 'Neural Network Basics', week_number: 4, estimated_hours: 6.0, status: 'locked', reason_explanation: 'Locked: Requires prerequisite mastery in Calculus & Regression' }
  ];

  const nodes = (kgData && kgData.nodes) ? kgData.nodes : [
    { id: 1, code: 'AIML01-C1', title: 'Python Basics & Syntax', mastery_score: 85.0, status: 'strong', badge: 'Strong (85%)' },
    { id: 2, code: 'AIML01-C2', title: 'Linear Algebra & Vectors', mastery_score: 80.0, status: 'strong', badge: 'Strong (80%)' },
    { id: 3, code: 'AIML01-C3', title: 'Calculus & Gradients', mastery_score: 65.0, status: 'proficient', badge: 'Proficient (65%)' },
    { id: 4, code: 'AIML01-C5', title: 'NumPy & pandas Wrangling', mastery_score: 75.0, status: 'proficient', badge: 'Proficient (75%)' },
    { id: 5, code: 'AIML02-C2', title: 'Linear & Logistic Regression', mastery_score: 45.0, status: 'developing', badge: 'Developing (45%)' },
    { id: 6, code: 'AIML02-C3', title: 'Trees & Random Forests', mastery_score: 30.0, status: 'weak', badge: 'Needs Revision (30%)' },
    { id: 7, code: 'AIML03-C1', title: 'Neural Network Fundamentals', mastery_score: 0.0, status: 'blocked', badge: 'Blocked by Prerequisite' }
  ];

  // Group roadmap by week number
  const groupedRoadmap = {};
  items.forEach(item => {
    const w = item.week_number || 1;
    if (!groupedRoadmap[w]) groupedRoadmap[w] = [];
    groupedRoadmap[w].push(item);
  });

  return (
    <div className="space-y-6">
      
      {/* View Header & SubTab Switcher */}
      <div className="inst-card p-5 bg-white border border-[#E5E5E2] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Personalized Learning Trajectory</h1>
          <p className="text-xs text-gray-600">Driven by Capacity Connect Knowledge Graph Engine &bull; AIML-02 Track</p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex bg-[#F7F7F5] p-1 rounded-lg border border-[#E5E5E2] text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('roadmap')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeSubTab === 'roadmap' ? 'bg-[#174A7E] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Personalized Roadmap</span>
          </button>

          <button
            onClick={() => setActiveSubTab('kg')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeSubTab === 'kg' ? 'bg-[#174A7E] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Knowledge Graph</span>
          </button>
        </div>
      </div>

      {/* ROADMAP TAB CONTENT */}
      {activeSubTab === 'roadmap' && (
        <div className="space-y-6">
          
          {/* Roadmap Info Card */}
          <div className="inst-card p-5 bg-white border border-[#E5E5E2] rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#174A7E] bg-[#EAF2F8] px-2 py-0.5 rounded">AIML-02</span>
                <h2 className="text-base font-bold text-gray-900">Personalized Study Plan Timeline</h2>
                {roadmapData?.is_trainer_overridden && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                    <UserCheck className="w-3 h-3 mr-1" /> Trainer Override Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600">
                Weekly Available Capacity: <span className="font-semibold text-gray-800">{roadmapData?.weekly_capacity_hours || 16} hrs/week</span> &bull; Estimated Completion: <span className="font-bold text-[#174A7E]">{roadmapData?.estimated_completion_date || '18 October 2026'}</span>
              </p>
            </div>
          </div>

          {/* "Why This Path?" AI Grounded Explanation Panel */}
          <div className="inst-card p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-2 text-xs text-blue-900 shadow-xs">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#174A7E]" />
              <h3 className="font-bold text-gray-900 text-sm">Why this personalized sequence?</h3>
            </div>
            <p className="leading-relaxed text-gray-700">
              Your high Python & Linear Algebra diagnostic baseline (80%+) saved approximately <span className="font-semibold text-emerald-800">7.5 hours</span> of basic revision. Deep Learning and Neural Networks are scheduled in Week 4 because your prerequisite Calculus score (65%) requires targeted gradient descent practice before unlocking backpropagation.
            </p>
          </div>

          {/* Grouped Roadmap Items by Week */}
          <div className="space-y-6">
            {Object.keys(groupedRoadmap).map((weekNum) => (
              <div key={weekNum} className="space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 border-b border-gray-200 pb-1">
                  <span className="bg-[#174A7E] text-white px-2 py-0.5 rounded text-[11px]">Week {weekNum}</span>
                  <span>Scheduled Learning Modules</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {groupedRoadmap[weekNum].map((item) => {
                    let badgeClass = 'bg-blue-50 text-blue-800 border-blue-200';
                    let badgeText = 'Scheduled';

                    if (item.status === 'skipped_mastered') {
                      badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                      badgeText = 'Fast-Tracked (Mastered)';
                    } else if (item.status === 'needs_revision') {
                      badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
                      badgeText = 'Targeted Revision';
                    } else if (item.status === 'locked') {
                      badgeClass = 'bg-gray-100 text-gray-600 border-gray-300';
                      badgeText = 'Locked by Prerequisite';
                    } else if (item.status === 'in_progress') {
                      badgeClass = 'bg-blue-100 text-[#174A7E] border-blue-300 font-bold';
                      badgeText = 'Current Active Module';
                    }

                    return (
                      <div key={item.id} className="inst-card p-4 rounded-lg space-y-2.5 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badgeClass}`}>
                              {badgeText}
                            </span>
                            <span className="text-[11px] font-semibold text-gray-500">{item.estimated_hours} hrs</span>
                          </div>

                          <h4 className="font-bold text-sm text-gray-900 leading-snug">{item.title}</h4>
                          <p className="text-xs text-gray-500">{item.module_name}</p>
                        </div>

                        <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-600 flex items-start space-x-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-[#174A7E] shrink-0 mt-0.5" />
                          <span className="leading-snug">{item.reason_explanation}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* KNOWLEDGE GRAPH TAB CONTENT */}
      {activeSubTab === 'kg' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Side (2 Cols): Interactive Canvas/SVG Node Graph */}
          <div className="lg:col-span-2 inst-card p-5 bg-white border border-[#E5E5E2] rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Personalized Concept Competency DAG</h2>
                <p className="text-xs text-gray-500">Interactive Knowledge Graph (Click node to inspect prerequisites & mastery)</p>
              </div>

              {/* Status Legend */}
              <div className="hidden sm:flex items-center space-x-2 text-[10px]">
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1"></span> Strong</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1"></span> Proficient</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1"></span> Developing</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1"></span> Revision</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-gray-400 mr-1"></span> Blocked</span>
              </div>
            </div>

            {/* Interactive Concept Nodes List Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[350px]">
              {nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                let colorClass = 'border-emerald-300 bg-emerald-50/50 text-emerald-900';
                let iconColor = 'bg-emerald-500';

                if (node.status === 'proficient') {
                  colorClass = 'border-blue-300 bg-blue-50/50 text-blue-900';
                  iconColor = 'bg-blue-500';
                } else if (node.status === 'developing') {
                  colorClass = 'border-amber-300 bg-amber-50/50 text-amber-900';
                  iconColor = 'bg-amber-500';
                } else if (node.status === 'weak') {
                  colorClass = 'border-red-300 bg-red-50/50 text-red-900';
                  iconColor = 'bg-red-500';
                } else if (node.status === 'blocked') {
                  colorClass = 'border-gray-300 bg-gray-100 text-gray-600 opacity-70';
                  iconColor = 'bg-gray-400';
                }

                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-3.5 text-left rounded-lg border transition-all ${colorClass} ${
                      isSelected ? 'ring-2 ring-[#174A7E] shadow-md font-semibold' : 'hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/80 border">
                        {node.code}
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className={`w-2 h-2 rounded-full ${iconColor}`} />
                        <span className="text-xs font-extrabold">{node.mastery_score}%</span>
                      </div>
                    </div>

                    <p className="text-xs font-bold leading-tight">{node.title}</p>
                    <p className="text-[11px] opacity-80 mt-1">{node.badge}</p>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Right Side (1 Col): Node Inspector Panel */}
          <div className="inst-card p-5 bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2">
              Concept Inspector Panel
            </h3>

            {selectedNode ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#174A7E] uppercase bg-[#EAF2F8] px-2 py-0.5 rounded">
                    {selectedNode.code}
                  </span>
                  <h4 className="text-base font-bold text-gray-900 mt-1">{selectedNode.title}</h4>
                  <p className="text-xs text-gray-500">{selectedNode.module_name}</p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#E5E5E2] space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Evaluated Mastery Score</span>
                    <span className="text-[#174A7E]">{selectedNode.mastery_score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#174A7E] h-full" style={{ width: `${selectedNode.mastery_score}%` }} />
                  </div>
                  <p className="text-[11px] text-gray-500 pt-1">Status: <span className="font-semibold text-gray-800 capitalize">{selectedNode.status}</span></p>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-gray-800">Prerequisite Dependency Rules:</p>
                  {selectedNode.prereq_reasons && selectedNode.prereq_reasons.length > 0 ? (
                    <ul className="space-y-1 text-gray-600">
                      {selectedNode.prereq_reasons.map((r, idx) => (
                        <li key={idx} className="flex items-center text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1.5 shrink-0 text-amber-600" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-emerald-700 font-semibold bg-emerald-50 p-2 rounded border border-emerald-200 flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" />
                      All prerequisite requirements satisfied!
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onNavigate('lesson')}
                  className="w-full py-2.5 bg-[#174A7E] hover:bg-[#12395F] text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
                >
                  <span>Launch Concept Lesson</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Click any node on the left graph to view prerequisite status.</p>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
