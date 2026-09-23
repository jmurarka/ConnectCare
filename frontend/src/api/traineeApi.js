import { apiClient } from '../lib/apiClient';

export const traineeApi = {
  getDashboard: () => apiClient.get('/api/trainee/dashboard'),
  getProfile: () => apiClient.get('/api/trainee/profile'),
  updateProfile: (data) => apiClient.put('/api/trainee/profile', data),
  
  getCourses: () => apiClient.get('/api/courses'),
  getCourseDetail: (courseId) => apiClient.get(`/api/courses/${courseId}`),
  
  getDiagnostic: (courseId = 3) => apiClient.get(`/api/trainee/diagnostic?course_id=${courseId}`),
  submitDiagnostic: (answers, courseId = 3) => apiClient.post(`/api/trainee/diagnostic/submit?course_id=${courseId}`, { answers }),
  
  getAvailability: () => apiClient.get('/api/trainee/availability'),
  updateAvailability: (weeklyHours, courseId = 3) => apiClient.put(`/api/trainee/availability?course_id=${courseId}`, { weekly_hours: weeklyHours }),
  
  getRoadmap: (courseId = 3) => apiClient.get(`/api/trainee/roadmap/${courseId}`),
  getKnowledgeGraph: (courseId = 3) => apiClient.get(`/api/trainee/kg/${courseId}`),
  
  getAssignments: (courseId = null) => apiClient.get(courseId ? `/api/trainee/assignments?course_id=${courseId}` : '/api/trainee/assignments'),
  submitAssignment: (assignmentId, contentUrl) => apiClient.post(`/api/trainee/assignments/${assignmentId}/submit`, { assignment_id: assignmentId, content_url: contentUrl }),
  
  getCertificates: () => apiClient.get('/api/trainee/certificates'),
  verifyCertificate: (code) => apiClient.get(`/api/certificates/verify/${code}`),
  
  getDiscussions: (courseId = null) => apiClient.get(courseId ? `/api/trainee/discussions?course_id=${courseId}` : '/api/trainee/discussions'),
  createDiscussion: (data) => apiClient.post('/api/discussions', data),

  completeLesson: (conceptId, resourceId) => apiClient.post('/api/lessons/complete', { concept_id: conceptId, resource_id: resourceId })
};
