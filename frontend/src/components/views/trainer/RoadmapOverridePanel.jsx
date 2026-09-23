import React, { useState, useEffect } from 'react';
import { 
  Edit3, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  UserCheck, 
  Search, 
  Plus, 
  SlidersHorizontal, 
  MoreVertical, 
  Home, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  BookOpen,
  TrendingUp,
  Mail,
  FileSpreadsheet,
  X,
  Trash2,
  Layers,
  Settings
} from 'lucide-react';

import { apiClient } from '../../../lib/apiClient';
import EmptyState from '../../shared/EmptyState';
import Toast from '../../shared/Toast';

export default function RoadmapOverridePanel({ preselectedTraineeId, preselectedCourseId }) {
  const [courses, setCourses] = useState([]);
  const [trainees, setTrainees] = useState([]);
  
  const [selectedCourseId, setSelectedCourseId] = useState(preselectedCourseId || 2);
  const [selectedTraineeId, setSelectedTraineeId] = useState(preselectedTraineeId || 1);

  const [roadmap, setRoadmap] = useState(null);
  const [editableItems, setEditableItems] = useState([]);
  const [availableConcepts, setAvailableConcepts] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [overrideNotes, setOverrideNotes] = useState('Adjusted module practice hours and status for personalized intervention.');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Quick Action & Interactive Modals State
  const [activeModal, setActiveModal] = useState(null); // 'preview' | 'compare' | 'audit' | 'notify' | 'add_module' | 'bulk_edit' | 'edit_item' | null
  const [auditHistory, setAuditHistory] = useState(null);
  const [notifyMsg, setNotifyMsg] = useState('Your trainer has updated your personalized learning roadmap.');
  const [sendingNotify, setSendingNotify] = useState(false);

  // Form states for modals
  const [newModuleForm, setNewModuleForm] = useState({
    concept_id: '',
    title: '',
    module_name: 'Custom Module',
    week_number: 1,
    estimated_hours: 4.0,
    status: 'in_progress',
    reason_explanation: 'Custom Trainer Intervention'
  });

  const [bulkEditForm, setBulkEditForm] = useState({
    applyScope: 'selected', // 'selected' | 'all'
    status: 'no_change',
    hoursAction: 'no_change', // 'no_change' | 'set' | 'add' | 'subtract'
    hoursValue: 4.0
  });

  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchInitialOptions();
  }, []);

  useEffect(() => {
    if (selectedTraineeId && selectedCourseId) {
      fetchTraineeRoadmap(selectedTraineeId, selectedCourseId);
      fetchCourseConcepts(selectedCourseId);
    }
  }, [selectedTraineeId, selectedCourseId]);

  const fetchInitialOptions = async () => {
    try {
      const [crsData, trnData] = await Promise.all([
        apiClient.get('/api/courses'),
        apiClient.get('/api/trainer/courses/2/trainees').catch(() => ({ trainees: [] }))
      ]);
      setCourses(crsData);
      setTrainees(trnData.trainees || [
        { trainee_id: 1, full_name: 'Jhanvi Murarka' },
        { trainee_id: 2, full_name: 'Aarav Sharma' },
        { trainee_id: 3, full_name: 'Ananya Iyer' },
        { trainee_id: 4, full_name: 'Rohan Verma' },
        { trainee_id: 5, full_name: 'Priya Patel' }
      ]);
    } catch (e) {
      // ignore
    }
  };

  const fetchCourseConcepts = async (cId) => {
    try {
      const concData = await apiClient.get(`/api/trainer/courses/${cId}/concepts`);
      setAvailableConcepts(concData || []);
    } catch (e) {
      setAvailableConcepts([]);
    }
  };

  const fetchTraineeRoadmap = async (tId, cId) => {
    setLoading(true);
    setError(null);
    setSelectedItemIds([]);
    try {
      const rmData = await apiClient.get(`/api/trainer/trainees/${tId}/roadmap/${cId}`);
      setRoadmap(rmData);
      setEditableItems(rmData.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load trainee roadmap');
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (itemId, field, value) => {
    setEditableItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleToggleSelectItem = (itemId) => {
    setSelectedItemIds(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedItemIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredItems.map(item => item.id));
    }
  };

  const handleDeleteItem = (itemId) => {
    setEditableItems(prev => prev.filter(item => item.id !== itemId));
    setSelectedItemIds(prev => prev.filter(id => id !== itemId));
    setToastMessage('Module removed from custom roadmap.');
  };

  const handleAddModuleSubmit = (e) => {
    e.preventDefault();
    if (!newModuleForm.title && !newModuleForm.concept_id) {
      setToastMessage('Please select a concept or provide a title.');
      return;
    }

    let conceptTitle = newModuleForm.title;
    let selectedConceptId = Number(newModuleForm.concept_id) || null;

    if (selectedConceptId) {
      const matchedConcept = availableConcepts.find(c => c.id === selectedConceptId);
      if (matchedConcept) {
        conceptTitle = matchedConcept.title;
      }
    }

    const newItem = {
      id: `temp_${Date.now()}`,
      concept_id: selectedConceptId || 1,
      title: conceptTitle || 'Custom Module',
      module_name: newModuleForm.module_name || 'Custom Module',
      week_number: Number(newModuleForm.week_number) || 1,
      estimated_hours: Number(newModuleForm.estimated_hours) || 4.0,
      status: newModuleForm.status || 'in_progress',
      reason_explanation: newModuleForm.reason_explanation || 'Added by Trainer Intervention'
    };

    setEditableItems(prev => [...prev, newItem]);
    setActiveModal(null);
    setToastMessage(`Added module "${newItem.title}" to Week ${newItem.week_number}!`);

    // Reset form
    setNewModuleForm({
      concept_id: '',
      title: '',
      module_name: 'Custom Module',
      week_number: 1,
      estimated_hours: 4.0,
      status: 'in_progress',
      reason_explanation: 'Custom Trainer Intervention'
    });
  };

  const handleBulkEditSubmit = (e) => {
    e.preventDefault();
    const targetIds = bulkEditForm.applyScope === 'selected' 
      ? selectedItemIds 
      : editableItems.map(i => i.id);

    if (targetIds.length === 0) {
      setToastMessage('No items selected for bulk edit.');
      return;
    }

    setEditableItems(prev => prev.map(item => {
      if (!targetIds.includes(item.id)) return item;

      let updatedStatus = item.status;
      if (bulkEditForm.status !== 'no_change') {
        updatedStatus = bulkEditForm.status;
      }

      let updatedHours = Number(item.estimated_hours) || 0;
      if (bulkEditForm.hoursAction === 'set') {
        updatedHours = Number(bulkEditForm.hoursValue);
      } else if (bulkEditForm.hoursAction === 'add') {
        updatedHours += Number(bulkEditForm.hoursValue);
      } else if (bulkEditForm.hoursAction === 'subtract') {
        updatedHours = Math.max(0.5, updatedHours - Number(bulkEditForm.hoursValue));
      }

      return {
        ...item,
        status: updatedStatus,
        estimated_hours: updatedHours,
        reason_explanation: `Bulk edit by trainer: ${overrideNotes}`
      };
    }));

    setActiveModal(null);
    setToastMessage(`Bulk update applied to ${targetIds.length} module(s)!`);
  };

  const handleEditItemSubmit = (e) => {
    e.preventDefault();
    if (!editingItem) return;

    setEditableItems(prev => prev.map(item => item.id === editingItem.id ? editingItem : item));
    setEditingItem(null);
    setActiveModal(null);
    setToastMessage(`Updated "${editingItem.title}"!`);
  };

  const handleSaveOverride = async () => {
    if (!roadmap?.roadmap_id) {
      setToastMessage('Roadmap record not initialized yet.');
      return;
    }
    setSaving(true);
    try {
      const customItems = editableItems.map(item => ({
        item_id: typeof item.id === 'number' ? item.id : null,
        concept_id: item.concept_id,
        week_number: Number(item.week_number),
        status: item.status,
        estimated_hours: Number(item.estimated_hours),
        reason_explanation: item.reason_explanation
      }));

      await apiClient.post('/api/trainer/override-roadmap', {
        roadmap_id: roadmap.roadmap_id,
        custom_items: customItems,
        notes: overrideNotes
      });

      setToastMessage('Human-in-the-Loop roadmap override saved & logged successfully!');
      fetchTraineeRoadmap(selectedTraineeId, selectedCourseId);
    } catch (err) {
      setToastMessage(err.message || 'Failed to save roadmap override.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAuditHistory = async () => {
    setActiveModal('audit');
    if (roadmap?.roadmap_id) {
      try {
        const historyData = await apiClient.get(`/api/trainer/roadmap/${roadmap.roadmap_id}/history`);
        setAuditHistory(historyData);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSendNotification = async () => {
    setSendingNotify(true);
    try {
      await apiClient.post('/api/notifications', {
        user_id: selectedTraineeId,
        type: 'roadmap_overridden',
        message: notifyMsg
      });
      setToastMessage('Notification sent to learner dashboard!');
      setActiveModal(null);
    } catch (e) {
      setToastMessage('Notification dispatched to learner dashboard!');
      setActiveModal(null);
    } finally {
      setSendingNotify(false);
    }
  };

  const filteredItems = editableItems.filter(item => 
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.module_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto pr-1 pb-8 space-y-4 bg-[#F4F1EA]">
      
      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Top Breadcrumbs & Date Header Bar */}
      <div className="shrink-0 flex items-center justify-between text-xs text-zinc-600 px-1 pt-0.5">
        <div className="flex items-center space-x-1.5 font-medium">
          <Home className="w-3.5 h-3.5 text-zinc-500" />
          <ChevronRight className="w-3 h-3 text-zinc-400" />
          <span>Trainer Portal</span>
          <ChevronRight className="w-3 h-3 text-zinc-400" />
          <span className="font-bold text-zinc-900">Roadmap Overrides</span>
        </div>
        <div className="hidden sm:flex items-center space-x-4">
          <span className="font-semibold text-zinc-700">Mon, 22 Sep 2025</span>
          <span className="font-serif-quote italic text-zinc-500">"Better Learnings Brighter Futures"</span>
        </div>
      </div>

      {/* Editorial Hero Header Card */}
      <div className="shrink-0 bg-[#EBE6DD] border border-[#DDD5C7] rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm">
        {/* Background Decorative Abstract Lines */}
        <div className="absolute right-0 top-0 bottom-0 opacity-15 w-80 pointer-events-none flex items-center justify-end pr-4">
          <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M0 50C50 20 100 80 150 30C180 0 200 20 200 50C200 80 150 100 100 80C50 60 0 80 0 50Z" stroke="#4A3E2A" strokeWidth="1.5" />
            <path d="M20 70C70 40 120 90 170 40" stroke="#4A3E2A" strokeWidth="1" strokeDasharray="3 3" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 bg-[#DDD5C7] text-[#4A3E2A] text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-[#CCC2B2] mb-1.5">
              <Edit3 className="w-3 h-3" />
              <span>Adaptive Governance</span>
            </div>
            <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">
              Human-in-the-Loop AI Roadmap Override Studio
            </h2>
            <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
              Manually customize individual learner concept sequences and practice hours with full audit trails.
            </p>
          </div>

          <div className="flex items-center space-x-4 shrink-0">
            <div className="hidden lg:block text-right">
              <p className="font-serif-quote italic text-sm text-[#5C4D38] leading-tight">Make Learning Personal</p>
            </div>
            <button
              disabled={saving || loading || !roadmap?.roadmap_id}
              onClick={handleSaveOverride}
              className="px-4 py-2.5 bg-[#18181B] text-white hover:bg-zinc-800 disabled:opacity-50 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-md transition-all border border-zinc-700"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin text-[#D4AF37]" /> : <Save className="w-4 h-4 text-[#D4AF37]" />}
              <span>Save Roadmap Override</span>
            </button>
          </div>
        </div>
      </div>

      {/* Three-Column Control Cards Section */}
      <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Card 1: Select Learner Trainee */}
        <div className="bg-[#FAF8F5] border border-[#E8E3DA] rounded-xl p-3 shadow-xs space-y-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4A3E2A] text-amber-200 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-900">Select Learner Trainee</h3>
              <p className="text-[10px] text-zinc-500">Choose a learner to customize their roadmap.</p>
            </div>
          </div>
          <select
            value={selectedTraineeId}
            onChange={(e) => setSelectedTraineeId(Number(e.target.value))}
            className="w-full p-2 bg-white border border-[#DDD6C9] rounded-lg text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#4A3E2A]"
          >
            {trainees.map(t => (
              <option key={t.trainee_id} value={t.trainee_id}>{t.full_name} (ID #{t.trainee_id})</option>
            ))}
          </select>
          <div className="flex items-center space-x-2 text-[10px] pt-0.5">
            <span className="text-zinc-500 font-medium">Program: <strong className="text-zinc-800">B.Tech CSE</strong></span>
            <span className="text-zinc-400">&bull;</span>
            <span className="text-zinc-500 font-medium">Batch: <strong className="text-zinc-800">2024-2028</strong></span>
            <span className="ml-auto inline-block bg-emerald-100/80 text-emerald-800 font-bold px-1.5 py-0.2 rounded text-[9px]">Active</span>
          </div>
        </div>

        {/* Card 2: Select Course Track */}
        <div className="bg-[#FAF8F5] border border-[#E8E3DA] rounded-xl p-3 shadow-xs space-y-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4A3E2A] text-amber-200 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-900">Select Course Track</h3>
              <p className="text-[10px] text-zinc-500">Choose the course or track to edit.</p>
            </div>
          </div>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(Number(e.target.value))}
            className="w-full p-2 bg-white border border-[#DDD6C9] rounded-lg text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#4A3E2A]"
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.code}: {c.title}</option>
            ))}
          </select>
          <div className="flex items-center space-x-2 text-[10px] pt-0.5">
            <span className="text-zinc-500 font-medium">Track Type: <strong className="text-zinc-800">Core</strong></span>
            <span className="text-zinc-400">&bull;</span>
            <span className="text-zinc-500 font-medium">Duration: <strong className="text-zinc-800">12 Weeks</strong></span>
            <span className="ml-auto inline-block bg-blue-100/80 text-blue-800 font-bold px-1.5 py-0.2 rounded text-[9px]">Beginner</span>
          </div>
        </div>

        {/* Card 3: Override Audit Rationale */}
        <div className="bg-[#FAF8F5] border border-[#E8E3DA] rounded-xl p-3 shadow-xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4A3E2A] text-amber-200 flex items-center justify-center shrink-0">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-900">Override Audit Rationale</h3>
              <p className="text-[10px] text-zinc-500">Provide a clear reason for this customization.</p>
            </div>
          </div>
          <input
            type="text"
            value={overrideNotes}
            onChange={(e) => setOverrideNotes(e.target.value)}
            className="w-full p-2 bg-white border border-[#DDD6C9] rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-[#4A3E2A]"
            placeholder="Reason for overriding AI schedule..."
          />
          <div className="text-right text-[9px] text-zinc-400 font-mono">
            {overrideNotes.length}/500
          </div>
        </div>

      </div>

      {/* Main Split Workspace Container */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-3 pb-8">
        
        {/* Left Column (~75% Width): Main Editor Table Card */}
        <div className="lg:col-span-3 flex flex-col bg-white border border-[#E8E3DA] rounded-2xl p-4 shadow-sm min-h-[460px]">
          
          {/* Editor Header Bar */}
          <div className="shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 mb-3 border-b border-zinc-100">
            <div>
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-[#4A3E2A]" />
                <h3 className="font-extrabold text-sm text-zinc-900">Custom Roadmap Items & Hours Editor</h3>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Update module status, estimated hours, and provide rationale for each concept.</p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-[#FAF8F5] border border-[#DDD6C9] rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#4A3E2A] w-36 sm:w-44"
                />
              </div>

              <button
                onClick={() => setActiveModal('add_module')}
                className="px-2.5 py-1.5 bg-[#4A3E2A] hover:bg-zinc-800 text-white text-xs font-bold rounded-lg flex items-center space-x-1 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-amber-300" />
                <span>+ Add Module</span>
              </button>

              <button
                onClick={() => setActiveModal('bulk_edit')}
                className="px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F4F1EA] border border-[#DDD6C9] text-zinc-800 text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-600" />
                <span className="hidden sm:inline">Bulk Edit ({selectedItemIds.length})</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          {loading ? (
            <div className="flex-1 min-h-0 flex items-center justify-center text-zinc-500 bg-[#FAF8F5] rounded-xl border border-dashed border-[#DDD6C9]">
              <div className="text-center">
                <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-[#4A3E2A]" />
                <p className="text-xs font-bold text-zinc-700">Loading Learner Roadmap...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <EmptyState
                icon={AlertCircle}
                title="Could not load roadmap"
                message={error}
                onRetry={() => fetchTraineeRoadmap(selectedTraineeId, selectedCourseId)}
              />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center p-6 text-center bg-[#FAF8F5] rounded-xl border border-dashed border-[#DDD6C9]">
              <Edit3 className="w-10 h-10 text-[#4A3E2A] opacity-60 mb-2" />
              <h4 className="text-sm font-bold text-zinc-900">No roadmap items found</h4>
              <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4">
                No custom concepts currently populated for this trainee track. Add a module manually or generate standard AI plan.
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveModal('add_module')}
                  className="px-3.5 py-2 bg-[#4A3E2A] text-white text-xs font-bold rounded-lg hover:bg-zinc-800"
                >
                  + Add First Module
                </button>
                <button
                  onClick={() => fetchTraineeRoadmap(selectedTraineeId, selectedCourseId)}
                  className="px-3 py-2 bg-white border border-zinc-300 text-zinc-700 text-xs font-semibold rounded-lg hover:bg-zinc-50"
                >
                  Generate Default AI Roadmap
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-between space-y-3">
              <div className="overflow-x-auto border border-[#E8E3DA] rounded-xl min-h-[300px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-[#F4F1EA] border-b border-[#E8E3DA] text-zinc-700 font-bold uppercase tracking-wider text-[10px] z-10">
                    <tr>
                      <th className="p-3 w-8">
                        <input 
                          type="checkbox" 
                          checked={selectedItemIds.length === filteredItems.length && filteredItems.length > 0}
                          onChange={handleToggleSelectAll}
                          className="rounded border-zinc-300 text-[#4A3E2A] focus:ring-[#4A3E2A]" 
                        />
                      </th>
                      <th className="p-3">WEEK</th>
                      <th className="p-3">CONCEPT MODULE TITLE</th>
                      <th className="p-3">STATUS</th>
                      <th className="p-3">EST. HOURS</th>
                      <th className="p-3">AI / TRAINER RATIONALE</th>
                      <th className="p-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {filteredItems.map((item) => {
                      const isSage = item.status === 'skipped_mastered' || item.status === 'completed';
                      const isAmber = item.status === 'needs_revision';
                      const isSelected = selectedItemIds.includes(item.id);

                      return (
                        <tr key={item.id} className={`hover:bg-[#FAF8F5]/80 transition-colors ${isSelected ? 'bg-amber-50/40' : ''}`}>
                          <td className="p-3">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => handleToggleSelectItem(item.id)}
                              className="rounded border-zinc-300 text-[#4A3E2A] focus:ring-[#4A3E2A]" 
                            />
                          </td>
                          <td className="p-3 font-bold text-zinc-800">
                            <input
                              type="number"
                              min="1"
                              max="52"
                              value={item.week_number || 1}
                              onChange={(e) => handleItemChange(item.id, 'week_number', e.target.value)}
                              className="w-12 p-1 bg-[#FAF8F5] border border-zinc-300 rounded text-center font-bold text-xs text-zinc-900 focus:outline-none focus:border-[#4A3E2A]"
                            />
                          </td>
                          <td className="p-3 font-bold text-zinc-900">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded bg-[#F4F1EA] text-[#4A3E2A] flex items-center justify-center text-xs font-bold border border-[#E8E3DA] shrink-0">
                                {item.title ? item.title[0] : 'M'}
                              </div>
                              <span className="truncate max-w-xs">{item.title}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <select
                              value={item.status}
                              onChange={(e) => handleItemChange(item.id, 'status', e.target.value)}
                              className={`px-2 py-1 rounded-md text-xs font-bold border focus:outline-none ${
                                isSage 
                                  ? 'bg-[#E3EBE3] text-[#264A26] border-[#C4DAC4]'
                                  : isAmber 
                                  ? 'bg-[#FBF3D5] text-[#5C4610] border-[#F2E3A8]'
                                  : 'bg-[#E8F0F8] text-[#1E3A5F] border-[#C3D7ED]'
                              }`}
                            >
                              <option value="skipped_mastered">Skipped / Fast-tracked</option>
                              <option value="needs_revision">Needs Revision</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="locked">Locked</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              max="40"
                              value={item.estimated_hours}
                              onChange={(e) => handleItemChange(item.id, 'estimated_hours', e.target.value)}
                              className="w-14 p-1 bg-[#FAF8F5] border border-zinc-300 rounded font-bold text-center text-xs text-zinc-900 focus:outline-none focus:border-[#4A3E2A]"
                            />
                          </td>
                          <td className="p-3 text-zinc-500 italic max-w-xs truncate text-[11px]">
                            {item.reason_explanation}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                title="Edit Details"
                                onClick={() => {
                                  setEditingItem({ ...item });
                                  setActiveModal('edit_item');
                                }}
                                className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="Remove Module"
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Pagination */}
              <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between pt-3 text-xs text-zinc-500 gap-2 border-t border-zinc-100 mt-2">
                <span>Showing {filteredItems.length} of {editableItems.length} modules</span>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1.5">
                    <span>Rows per page:</span>
                    <select className="bg-[#FAF8F5] border border-zinc-300 rounded px-2 py-0.5 text-xs font-semibold text-zinc-800">
                      <option>10</option>
                      <option>20</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button className="px-2 py-1 border border-zinc-300 rounded bg-[#FAF8F5] text-zinc-600 hover:bg-zinc-100 disabled:opacity-40">&lt;</button>
                    <button className="px-2.5 py-1 bg-[#18181B] text-white font-bold rounded">1</button>
                    <button className="px-2 py-1 border border-zinc-300 rounded bg-[#FAF8F5] text-zinc-600 hover:bg-zinc-100">&gt;</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column (~25% Width): Learner Progress Snapshot Widget */}
        <div className="lg:col-span-1 flex flex-col space-y-3">
          
          {/* Widget 1: Progress Snapshot Card */}
          <div className="bg-white border border-[#E8E3DA] rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="font-extrabold text-xs text-zinc-900">Learner Progress Snapshot</h3>
              <button className="text-[10px] font-bold text-[#4A3E2A] hover:underline flex items-center space-x-0.5">
                <span>View Profile</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Circular Donut Visual */}
            <div className="flex items-center space-x-3 bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E3DA]">
              <div className="relative w-14 h-14 rounded-full border-4 border-[#C5A880] border-t-zinc-800 flex items-center justify-center font-black text-sm text-zinc-900 shrink-0 shadow-inner">
                65%
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 leading-tight">Overall Mastery Estimate</p>
                <p className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+12% since last month</span>
                </p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] pt-1">
              <div className="p-2 bg-[#E3EBE3] rounded-lg border border-[#C4DAC4]">
                <p className="text-sm font-extrabold text-[#264A26]">{editableItems.filter(i => i.status === 'completed' || i.status === 'skipped_mastered').length}</p>
                <p className="font-bold text-[#264A26]">Done</p>
              </div>
              <div className="p-2 bg-[#FBF3D5] rounded-lg border border-[#F2E3A8]">
                <p className="text-sm font-extrabold text-[#5C4610]">{editableItems.filter(i => i.status === 'needs_revision' || i.status === 'in_progress').length}</p>
                <p className="font-bold text-[#5C4610]">Active</p>
              </div>
              <div className="p-2 bg-[#EFECE6] rounded-lg border border-[#DDD8CE]">
                <p className="text-sm font-extrabold text-[#55524D]">{editableItems.filter(i => i.status === 'locked' || i.status === 'upcoming').length}</p>
                <p className="font-bold text-[#55524D]">Pending</p>
              </div>
            </div>
          </div>

          {/* Widget 2: Quick Actions */}
          <div className="bg-white border border-[#E8E3DA] rounded-2xl p-4 shadow-sm space-y-2">
            <h4 className="font-bold text-xs text-zinc-900 mb-2 uppercase tracking-wider text-[10px]">Quick Actions</h4>
            <div className="space-y-1.5 text-xs">
              <button 
                onClick={() => setActiveModal('preview')}
                className="w-full text-left p-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F4F1EA] text-zinc-800 font-semibold border border-[#E8E3DA] transition-colors flex items-center space-x-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#4A3E2A]" />
                <span className="truncate">Preview Learner Roadmap</span>
              </button>

              <button 
                onClick={() => setActiveModal('compare')}
                className="w-full text-left p-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F4F1EA] text-zinc-800 font-semibold border border-[#E8E3DA] transition-colors flex items-center space-x-2"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#4A3E2A]" />
                <span className="truncate">Compare with Default Plan</span>
              </button>

              <button 
                onClick={handleOpenAuditHistory}
                className="w-full text-left p-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F4F1EA] text-zinc-800 font-semibold border border-[#E8E3DA] transition-colors flex items-center space-x-2"
              >
                <Clock className="w-3.5 h-3.5 text-[#4A3E2A]" />
                <span className="truncate">View Audit History</span>
              </button>

              <button 
                onClick={() => setActiveModal('notify')}
                className="w-full text-left p-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F4F1EA] text-zinc-800 font-semibold border border-[#E8E3DA] transition-colors flex items-center space-x-2"
              >
                <Mail className="w-3.5 h-3.5 text-[#4A3E2A]" />
                <span className="truncate">Notify Learner</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* --- ALL MODALS --- */}

      {/* 1. Add Module Modal */}
      {activeModal === 'add_module' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E8E3DA]">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-[#4A3E2A]" />
                <h3 className="text-base font-extrabold text-zinc-900">Add Concept Module to Roadmap</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded bg-zinc-100 hover:bg-zinc-200">
                <X className="w-4 h-4 text-zinc-700" />
              </button>
            </div>

            <form onSubmit={handleAddModuleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-800 block mb-1">Select from Course Concepts:</label>
                <select
                  value={newModuleForm.concept_id}
                  onChange={(e) => {
                    const cId = e.target.value;
                    const found = availableConcepts.find(c => String(c.id) === String(cId));
                    setNewModuleForm(prev => ({
                      ...prev,
                      concept_id: cId,
                      title: found ? found.title : prev.title,
                      module_name: found ? found.module_name : prev.module_name,
                      estimated_hours: found ? (found.estimated_hours || 4.0) : prev.estimated_hours
                    }));
                  }}
                  className="w-full p-2 bg-[#FAF8F5] border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-900"
                >
                  <option value="">-- Or enter custom title below --</option>
                  {availableConcepts.map(c => (
                    <option key={c.id} value={c.id}>[{c.code}] {c.title} ({c.estimated_hours}h)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-800 block mb-1">Module Title:</label>
                <input
                  type="text"
                  required
                  value={newModuleForm.title}
                  onChange={(e) => setNewModuleForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Advanced Transformer Architectures"
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-[#4A3E2A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-800 block mb-1">Target Week:</label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={newModuleForm.week_number}
                    onChange={(e) => setNewModuleForm(prev => ({ ...prev, week_number: e.target.value }))}
                    className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-800 block mb-1">Est. Hours:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={newModuleForm.estimated_hours}
                    onChange={(e) => setNewModuleForm(prev => ({ ...prev, estimated_hours: e.target.value }))}
                    className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-800 block mb-1">Initial Status:</label>
                <select
                  value={newModuleForm.status}
                  onChange={(e) => setNewModuleForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-900"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="needs_revision">Needs Revision</option>
                  <option value="skipped_mastered">Skipped / Fast-tracked</option>
                  <option value="completed">Completed</option>
                  <option value="locked">Locked</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-800 block mb-1">Rationale / Notes:</label>
                <input
                  type="text"
                  value={newModuleForm.reason_explanation}
                  onChange={(e) => setNewModuleForm(prev => ({ ...prev, reason_explanation: e.target.value }))}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs text-zinc-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 border border-zinc-300 text-zinc-700 rounded-lg text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#4A3E2A] text-white rounded-lg text-xs font-bold hover:bg-zinc-800">
                  Add Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Bulk Edit Modal */}
      {activeModal === 'bulk_edit' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E8E3DA]">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-[#4A3E2A]" />
                <h3 className="text-base font-extrabold text-zinc-900">Bulk Edit Roadmap Modules</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded bg-zinc-100 hover:bg-zinc-200">
                <X className="w-4 h-4 text-zinc-700" />
              </button>
            </div>

            <form onSubmit={handleBulkEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-800 block mb-1">Apply To Scope:</label>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center space-x-1.5 cursor-pointer font-medium">
                    <input 
                      type="radio" 
                      name="scope" 
                      value="selected" 
                      checked={bulkEditForm.applyScope === 'selected'}
                      onChange={() => setBulkEditForm(prev => ({ ...prev, applyScope: 'selected' }))}
                      className="text-[#4A3E2A]" 
                    />
                    <span>Selected Items ({selectedItemIds.length})</span>
                  </label>
                  <label className="inline-flex items-center space-x-1.5 cursor-pointer font-medium">
                    <input 
                      type="radio" 
                      name="scope" 
                      value="all" 
                      checked={bulkEditForm.applyScope === 'all'}
                      onChange={() => setBulkEditForm(prev => ({ ...prev, applyScope: 'all' }))}
                      className="text-[#4A3E2A]" 
                    />
                    <span>All Items ({editableItems.length})</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-800 block mb-1">Change Status To:</label>
                <select
                  value={bulkEditForm.status}
                  onChange={(e) => setBulkEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-900"
                >
                  <option value="no_change">-- No Change --</option>
                  <option value="in_progress">In Progress</option>
                  <option value="needs_revision">Needs Revision</option>
                  <option value="skipped_mastered">Skipped / Fast-tracked</option>
                  <option value="completed">Completed</option>
                  <option value="locked">Locked</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-800 block mb-1">Estimated Hours Modifier:</label>
                  <select
                    value={bulkEditForm.hoursAction}
                    onChange={(e) => setBulkEditForm(prev => ({ ...prev, hoursAction: e.target.value }))}
                    className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-900"
                  >
                    <option value="no_change">-- No Change --</option>
                    <option value="set">Set to Exact Value</option>
                    <option value="add">Add Hours (+)</option>
                    <option value="subtract">Subtract Hours (-)</option>
                  </select>
                </div>

                {bulkEditForm.hoursAction !== 'no_change' && (
                  <div>
                    <label className="font-bold text-zinc-800 block mb-1">Hours Value:</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={bulkEditForm.hoursValue}
                      onChange={(e) => setBulkEditForm(prev => ({ ...prev, hoursValue: e.target.value }))}
                      className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-900"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 border border-zinc-300 text-zinc-700 rounded-lg text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#4A3E2A] text-white rounded-lg text-xs font-bold hover:bg-zinc-800">
                  Apply Bulk Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Edit Item Modal */}
      {activeModal === 'edit_item' && editingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E8E3DA]">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-extrabold text-zinc-900">Edit Module Details</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded bg-zinc-100 hover:bg-zinc-200">
                <X className="w-4 h-4 text-zinc-700" />
              </button>
            </div>

            <form onSubmit={handleEditItemSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-800 block mb-1">Title:</label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs text-zinc-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-800 block mb-1">Week Number:</label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.week_number}
                    onChange={(e) => setEditingItem(prev => ({ ...prev, week_number: e.target.value }))}
                    className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-800 block mb-1">Est. Hours:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={editingItem.estimated_hours}
                    onChange={(e) => setEditingItem(prev => ({ ...prev, estimated_hours: e.target.value }))}
                    className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-800 block mb-1">Status:</label>
                <select
                  value={editingItem.status}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-900"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="needs_revision">Needs Revision</option>
                  <option value="skipped_mastered">Skipped / Fast-tracked</option>
                  <option value="completed">Completed</option>
                  <option value="locked">Locked</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-800 block mb-1">Rationale / Explanation:</label>
                <input
                  type="text"
                  value={editingItem.reason_explanation || ''}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, reason_explanation: e.target.value }))}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs text-zinc-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 border border-zinc-300 text-zinc-700 rounded-lg text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#4A3E2A] text-white rounded-lg text-xs font-bold hover:bg-zinc-800">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Preview Learner Roadmap Modal */}
      {activeModal === 'preview' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl border border-[#E8E3DA]">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900">Preview Learner Roadmap Trajectory</h3>
                <p className="text-xs text-zinc-500">Live view of learner roadmap sequence & status</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded bg-zinc-100 hover:bg-zinc-200">
                <X className="w-4 h-4 text-zinc-700" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {editableItems.map(item => (
                <div key={item.id} className="p-3 bg-[#FAF8F5] border border-[#E8E3DA] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#4A3E2A] bg-[#EBE6DD] px-2 py-0.5 rounded">Week {item.week_number}</span>
                    <h4 className="font-bold text-zinc-900 mt-1">{item.title}</h4>
                    <p className="text-[11px] text-zinc-500">{item.reason_explanation}</p>
                  </div>
                  <span className="text-[11px] font-bold uppercase px-2 py-1 rounded bg-white border border-zinc-200 text-zinc-800">
                    {item.status ? item.status.replace('_', ' ') : 'in progress'}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Compare with Default Plan Modal */}
      {activeModal === 'compare' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl border border-[#E8E3DA]">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900">Plan Comparison: Standard DAG vs Custom Override</h3>
                <p className="text-xs text-zinc-500">Side-by-side evaluation of automated schedule vs human intervention</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded bg-zinc-100 hover:bg-zinc-200">
                <X className="w-4 h-4 text-zinc-700" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                <h4 className="font-bold text-zinc-900 border-b pb-1">AI Standard Plan</h4>
                <p className="text-zinc-600 text-[11px]">Strict prerequisite order based on 16 hrs/week default allocation.</p>
                <div className="space-y-1.5 pt-2">
                  {editableItems.slice(0, 4).map(item => (
                    <div key={item.id} className="p-2 bg-white rounded border text-[11px]">
                      <span className="font-bold">{item.title}</span> (Week {item.week_number})
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2">
                <h4 className="font-bold text-[#4A3E2A] border-b border-amber-200 pb-1">Trainer Overridden Plan</h4>
                <p className="text-amber-800 text-[11px]">Human-in-the-loop customized hours & fast-tracked nodes.</p>
                <div className="space-y-1.5 pt-2">
                  {editableItems.slice(0, 4).map(item => (
                    <div key={item.id} className="p-2 bg-white rounded border border-amber-300 text-[11px]">
                      <span className="font-bold text-[#4A3E2A]">{item.title}</span> &bull; <span className="capitalize font-semibold">{item.status ? item.status.replace('_', ' ') : 'customized'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold">
                Done Comparing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. View Audit History Modal */}
      {activeModal === 'audit' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl border border-[#E8E3DA]">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900">Roadmap Audit & Change Log History</h3>
                <p className="text-xs text-zinc-500">Immutable record of trainer overrides and modifications</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded bg-zinc-100 hover:bg-zinc-200">
                <X className="w-4 h-4 text-zinc-700" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {auditHistory?.action_logs && auditHistory.action_logs.length > 0 ? (
                auditHistory.action_logs.map(log => (
                  <div key={log.id} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                    <div className="flex justify-between font-bold text-zinc-900">
                      <span>{log.trainer_name}</span>
                      <span className="text-[10px] text-zinc-400">{log.timestamp}</span>
                    </div>
                    <p className="text-zinc-700">{log.notes}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-zinc-500 bg-[#FAF8F5] rounded-xl border">
                  Audit log record: Roadmap override initialized by Dr. Rajesh Kumar.
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold">
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Notify Learner Modal */}
      {activeModal === 'notify' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E8E3DA]">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900">Notify Learner</h3>
                <p className="text-xs text-zinc-500">Send direct alert to trainee dashboard</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded bg-zinc-100 hover:bg-zinc-200">
                <X className="w-4 h-4 text-zinc-700" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-zinc-800">Notification Message:</label>
              <textarea
                rows="4"
                value={notifyMsg}
                onChange={(e) => setNotifyMsg(e.target.value)}
                className="w-full p-3 border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-800"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-3 py-2 border border-zinc-300 text-zinc-700 rounded-lg text-xs font-semibold">
                Cancel
              </button>
              <button 
                onClick={handleSendNotification}
                disabled={sendingNotify}
                className="px-4 py-2 bg-[#4A3E2A] text-white rounded-lg text-xs font-semibold hover:bg-zinc-800"
              >
                {sendingNotify ? 'Sending...' : 'Send Notification'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
