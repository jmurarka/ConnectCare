import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Edit, Network, Video, FileText, Link, Code, RefreshCw, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import EmptyState from '../../shared/EmptyState';
import Toast from '../../shared/Toast';

export default function CurriculumStudioPanel() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(2); // AIML-02 default
  const [concepts, setConcepts] = useState([]);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [resources, setResources] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state
  const [conceptModalOpen, setConceptModalOpen] = useState(false);
  const [conceptForm, setConceptForm] = useState({ code: '', title: '', description: '', module_name: '', order_index: 1, estimated_hours: 4.0 });

  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [resourceForm, setResourceForm] = useState({ title: '', resource_type: 'video', content_url: '', description: '' });

  const [prereqModalOpen, setPrereqModalOpen] = useState(false);
  const [selectedPrereqId, setSelectedPrereqId] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchConcepts(selectedCourseId);
    }
  }, [selectedCourseId]);

  const fetchCourses = async () => {
    try {
      const data = await apiClient.get('/api/courses');
      setCourses(data);
      if (data.length > 0 && !data.find(c => c.id === selectedCourseId)) {
        setSelectedCourseId(data[0].id);
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchConcepts = async (courseId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(`/api/trainer/courses/${courseId}/concepts`);
      setConcepts(data);
      if (data.length > 0) {
        setSelectedConcept(data[0]);
        fetchResources(data[0].id);
      } else {
        setSelectedConcept(null);
        setResources([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load concepts.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async (conceptId) => {
    try {
      const data = await apiClient.get(`/api/trainer/concepts/${conceptId}/resources`);
      setResources(data);
    } catch (e) {
      setResources([]);
    }
  };

  const handleSelectConcept = (c) => {
    setSelectedConcept(c);
    fetchResources(c.id);
  };

  const handleAddConcept = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/api/trainer/courses/${selectedCourseId}/concepts`, conceptForm);
      setToastMessage('Concept module created successfully!');
      setConceptModalOpen(false);
      fetchConcepts(selectedCourseId);
    } catch (err) {
      setToastMessage(err.message || 'Failed to create concept.');
    }
  };

  const handleDeleteConcept = async (conceptId) => {
    if (!window.confirm('Are you sure you want to delete this concept module?')) return;
    try {
      await apiClient.delete(`/api/trainer/concepts/${conceptId}`);
      setToastMessage('Concept module deleted.');
      fetchConcepts(selectedCourseId);
    } catch (err) {
      setToastMessage(err.message || 'Failed to delete concept.');
    }
  };

  const handleAddPrerequisite = async () => {
    if (!selectedConcept || !selectedPrereqId) return;
    try {
      await apiClient.post(`/api/trainer/concepts/${selectedConcept.id}/prerequisites`, {
        prerequisite_concept_id: Number(selectedPrereqId)
      });
      setToastMessage('Prerequisite DAG edge added successfully!');
      setPrereqModalOpen(false);
      fetchConcepts(selectedCourseId);
    } catch (err) {
      setToastMessage(err.message || 'DAG Cycle Error');
    }
  };

  const handleRemovePrerequisite = async (prereqId) => {
    if (!selectedConcept) return;
    try {
      await apiClient.delete(`/api/trainer/concepts/${selectedConcept.id}/prerequisites/${prereqId}`);
      setToastMessage('Prerequisite edge removed.');
      fetchConcepts(selectedCourseId);
    } catch (err) {
      setToastMessage(err.message || 'Failed to remove prerequisite.');
    }
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!selectedConcept) return;
    try {
      await apiClient.post(`/api/trainer/concepts/${selectedConcept.id}/resources`, resourceForm);
      setToastMessage('Learning resource added to concept!');
      setResourceModalOpen(false);
      fetchResources(selectedConcept.id);
    } catch (err) {
      setToastMessage(err.message || 'Failed to add resource.');
    }
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      await apiClient.delete(`/api/trainer/resources/${resourceId}`);
      setToastMessage('Resource removed.');
      fetchResources(selectedConcept.id);
    } catch (err) {
      setToastMessage(err.message || 'Failed to remove resource.');
    }
  };

  return (
    <div className="h-full w-full min-h-0 flex flex-col overflow-hidden space-y-3">
      
      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Header Banner */}
      <div className="shrink-0 p-4 bg-white border border-[#E5E5E2] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-[#174A7E] mb-0.5">
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase bg-[#EAF2F8] px-2 py-0.5 rounded">Authoring Studio</span>
          </div>
          <h2 className="text-base font-bold text-gray-900">Curriculum & Prerequisites DAG Authoring Studio</h2>
          <p className="text-[11px] text-gray-500">Design course structures, edit concept modules, manage DAG prerequisite edges with cycle validation</p>
        </div>

        {/* Course Selector & Add Concept Button */}
        <div className="flex items-center space-x-3">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(Number(e.target.value))}
            className="p-1.5 bg-[#F7F7F5] border border-[#E5E5E2] text-xs font-semibold text-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#174A7E]"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.code}: {c.title}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setConceptForm({ code: `AIML-C${concepts.length + 1}`, title: '', description: '', module_name: 'Module 1', order_index: concepts.length + 1, estimated_hours: 4.0 });
              setConceptModalOpen(true);
            }}
            className="px-3 py-1.5 bg-[#174A7E] text-white font-semibold text-xs rounded-lg hover:bg-[#12395F] transition-colors flex items-center space-x-1 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Concept</span>
          </button>
        </div>
      </div>

      {/* Main Studio Split Layout */}
      {loading ? (
        <div className="flex-1 min-h-0 flex items-center justify-center text-gray-500 bg-white border border-[#E5E5E2] rounded-xl">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#174A7E]" />
            <p className="text-xs font-semibold text-gray-700">Loading Curriculum Tree...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 min-h-0">
          <EmptyState
            icon={AlertCircle}
            title="Could not load concepts"
            message={error}
            onRetry={() => fetchConcepts(selectedCourseId)}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-3 overflow-hidden">
          
          {/* Left Column: Concepts Tree Navigation */}
          <div className="lg:col-span-1 h-full min-h-0 flex flex-col bg-white border border-[#E5E5E2] rounded-xl p-3.5 shadow-sm overflow-hidden">
            <h3 className="shrink-0 font-bold text-xs uppercase tracking-wider text-gray-500 mb-2">Course Concepts Tree</h3>
            
            <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
              {concepts.map((c) => {
                const isSelected = selectedConcept?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectConcept(c)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#EAF2F8] border-[#174A7E] text-[#174A7E] font-bold shadow-sm'
                        : 'bg-[#F7F7F5] border-[#E5E5E2] text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono text-gray-500 block">{c.code}</span>
                      <p className="line-clamp-1">{c.title}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-[#174A7E]' : 'text-gray-400'}`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Concept Detail & Resource / Prerequisite Editor */}
          <div className="lg:col-span-2 h-full min-h-0 flex flex-col overflow-y-auto pr-1 space-y-4">
            {selectedConcept ? (
              <>
                {/* Concept Details Header Card */}
                <div className="inst-card bg-white border border-[#E5E5E2] rounded-xl p-5 shadow-sm space-y-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#174A7E] bg-[#EAF2F8] px-2 py-0.5 rounded">
                        {selectedConcept.code}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-1">{selectedConcept.title}</h3>
                      <p className="text-gray-500 font-medium">Module: {selectedConcept.module_name} &bull; Est: {selectedConcept.estimated_hours} Hours</p>
                    </div>
                    <button
                      onClick={() => handleDeleteConcept(selectedConcept.id)}
                      className="p-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete Concept"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-600 leading-relaxed bg-[#F7F7F5] p-3 rounded-lg border border-[#E5E5E2]">
                    {selectedConcept.description}
                  </p>
                </div>

                {/* DAG Prerequisite Dependencies Manager */}
                <div className="inst-card bg-white border border-[#E5E5E2] rounded-xl p-5 shadow-sm space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div className="flex items-center space-x-2 text-gray-900">
                      <Network className="w-4 h-4 text-[#174A7E]" />
                      <h4 className="font-bold text-sm">DAG Prerequisites (Cycle-Validated Edges)</h4>
                    </div>
                    <button
                      onClick={() => setPrereqModalOpen(true)}
                      className="px-2.5 py-1 bg-[#174A7E] text-white font-semibold rounded text-[11px] hover:bg-[#12395F] transition-colors flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Dependency Edge</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {selectedConcept.prerequisite_concept_ids?.length > 0 ? (
                      selectedConcept.prerequisite_concept_ids.map((pid) => {
                        const pConcept = concepts.find(c => c.id === pid);
                        return (
                          <div key={pid} className="p-2.5 bg-[#F7F7F5] border border-[#E5E5E2] rounded-lg flex justify-between items-center">
                            <div>
                              <span className="font-bold text-gray-900">{pConcept?.title || `Concept #${pid}`}</span>
                              <span className="text-[10px] text-gray-500 font-mono ml-2">({pConcept?.code})</span>
                            </div>
                            <button
                              onClick={() => handleRemovePrerequisite(pid)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 italic py-1">No prerequisite dependencies configured for this concept.</p>
                    )}
                  </div>
                </div>

                {/* Learning Resources Editor */}
                <div className="inst-card bg-white border border-[#E5E5E2] rounded-xl p-5 shadow-sm space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <h4 className="font-bold text-sm text-gray-900">Concept Resources (Videos, PDFs, Notebooks)</h4>
                    <button
                      onClick={() => setResourceModalOpen(true)}
                      className="px-2.5 py-1 bg-[#174A7E] text-white font-semibold rounded text-[11px] hover:bg-[#12395F] transition-colors flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Resource</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {resources.length > 0 ? (
                      resources.map((r) => (
                        <div key={r.id} className="p-3 bg-[#F7F7F5] border border-[#E5E5E2] rounded-lg flex justify-between items-center">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-gray-900">{r.title}</span>
                              <span className="text-[10px] uppercase font-bold bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                                {r.resource_type}
                              </span>
                            </div>
                            <p className="text-[11px] text-blue-700 underline truncate max-w-sm">{r.content_url}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteResource(r.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic py-1">No learning resources added yet.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No concept selected"
                message="Select a concept from the tree navigation or click Add Concept to create one."
              />
            )}
          </div>
        </div>
      )}

      {/* Add Concept Modal */}
      {conceptModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E5E5E2] max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-gray-900">Create New Concept Module</h3>
            
            <form onSubmit={handleAddConcept} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Concept Code:</label>
                <input
                  type="text"
                  value={conceptForm.code}
                  onChange={(e) => setConceptForm({ ...conceptForm, code: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Title:</label>
                <input
                  type="text"
                  value={conceptForm.title}
                  onChange={(e) => setConceptForm({ ...conceptForm, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Module Name:</label>
                <input
                  type="text"
                  value={conceptForm.module_name}
                  onChange={(e) => setConceptForm({ ...conceptForm, module_name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Description:</label>
                <textarea
                  value={conceptForm.description}
                  onChange={(e) => setConceptForm({ ...conceptForm, description: e.target.value })}
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Order Index:</label>
                  <input
                    type="number"
                    value={conceptForm.order_index}
                    onChange={(e) => setConceptForm({ ...conceptForm, order_index: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Est. Hours:</label>
                  <input
                    type="number"
                    step="0.5"
                    value={conceptForm.estimated_hours}
                    onChange={(e) => setConceptForm({ ...conceptForm, estimated_hours: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setConceptModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#174A7E] text-white rounded font-semibold hover:bg-[#12395F]"
                >
                  Create Concept
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Prerequisite Edge Modal */}
      {prereqModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E5E5E2] max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-gray-900">Add DAG Prerequisite Dependency Edge</h3>
            
            <p className="text-xs text-gray-600">
              Select which concept must be mastered before learning <span className="font-bold text-[#174A7E]">{selectedConcept?.title}</span>. Server automatically validates graph acyclicity.
            </p>

            <div className="text-xs space-y-2">
              <label className="font-bold text-gray-800 block">Prerequisite Concept:</label>
              <select
                value={selectedPrereqId}
                onChange={(e) => setSelectedPrereqId(e.target.value)}
                className="w-full p-2 bg-[#F7F7F5] border border-gray-300 rounded font-semibold"
              >
                <option value="">Select Prerequisite Concept...</option>
                {concepts
                  .filter(c => c.id !== selectedConcept?.id && !selectedConcept?.prerequisite_concept_ids?.includes(c.id))
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.code}: {c.title}</option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setPrereqModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold text-xs rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPrerequisite}
                className="px-4 py-2 bg-[#174A7E] text-white font-semibold text-xs rounded-lg hover:bg-[#12395F]"
              >
                Add Edge (Cycle Check)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {resourceModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E5E5E2] max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-gray-900">Add Learning Resource</h3>
            
            <form onSubmit={handleAddResource} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Resource Title:</label>
                <input
                  type="text"
                  value={resourceForm.title}
                  onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Type:</label>
                <select
                  value={resourceForm.resource_type}
                  onChange={(e) => setResourceForm({ ...resourceForm, resource_type: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="video">Video URL</option>
                  <option value="pdf">PDF Document</option>
                  <option value="notebook">Jupyter Notebook (Colab)</option>
                  <option value="github">GitHub Repository</option>
                  <option value="link">Web Article / Link</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Content URL:</label>
                <input
                  type="url"
                  value={resourceForm.content_url}
                  onChange={(e) => setResourceForm({ ...resourceForm, content_url: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded font-mono"
                  placeholder="https://..."
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Description:</label>
                <textarea
                  value={resourceForm.description}
                  onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setResourceModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#174A7E] text-white rounded font-semibold hover:bg-[#12395F]"
                >
                  Add Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
