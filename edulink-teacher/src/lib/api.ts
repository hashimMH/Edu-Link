const API = '/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('teacher_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const json = await res.json();
  if (!res.ok || json.success === false) throw new Error(json.message || `Error ${res.status}`);
  return json.data;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  getProfile: () => request<any>('/users/me'),
  updateProfile: (d: any) => request<any>('/users/me', { method: 'PUT', body: JSON.stringify(d) }),

  getStats: () => request<any>('/teacher/stats'),
  getClasses: (f?: any) => request<any[]>(`/teacher/classes${f ? `?${new URLSearchParams(f)}` : ''}`),
  getUpcoming: () => request<any>('/teacher/upcoming'),
  cancelClass: (id: string) => request<any>(`/teacher/classes/${id}`, { method: 'DELETE' }),

  getAvailability: () => request<any[]>('/teacher/availability'),
  setAvailability: (d: any) => request<any>('/teacher/availability', { method: 'POST', body: JSON.stringify(d) }),

  getConversations: () => request<any[]>('/messages'),
  getChatMessages: (chatId: string) => request<any[]>('/messages/' + chatId),
  sendMessage: (receiverId: string, text: string) => request<any>('/messages', { method: 'POST', body: JSON.stringify({ receiverId, text }) }),

  getTutors: () => request<any[]>('/users/tutors'),
  getTutorNames: () => request<any[]>('/users/tutors/names'),

  getReviews: () => request<any[]>('/reviews'),
  getPayments: () => request<any[]>('/payments'),
  getPaymentSummary: () => request<any>('/payments/summary'),

  updateTutorProfile: (d: any) => request<any>('/teacher/tutor-profile', { method: 'PUT', body: JSON.stringify(d) }),
  uploadVideo: (formData: FormData) => fetch('/api/teacher/upload-video', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + (typeof window !== 'undefined' ? localStorage.getItem('teacher_token') : '') },
    body: formData,
  }).then(r => r.json()),
  getCertificates: () => request<any[]>('/teacher/certificates'),
  uploadCertificate: (formData: FormData) => fetch('/api/teacher/upload-certificate', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + (typeof window !== 'undefined' ? localStorage.getItem('teacher_token') : '') },
    body: formData,
  }).then(r => r.json()),
  deleteCertificate: (id: string) => request<any>(`/teacher/certificates/${id}`, { method: 'DELETE' }),
};
