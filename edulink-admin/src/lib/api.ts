const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const API = API_URL ? `${API_URL}/api` : '/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
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
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Request failed (${res.status})`);
  }
  return json.data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Admin
  getStats: () => request<any>('/admin/stats'),
  getUsers: (params?: string) => request<any>(`/admin/users${params ? `?${params}` : ''}`),
  getUser: (id: string) => request<any>(`/admin/users/${id}`),
  createUser: (data: any) => request<any>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) => request<any>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: string) => request<any>(`/admin/users/${id}`, { method: 'DELETE' }),

  getTutors: (params?: string) => request<any>(`/admin/tutors${params ? `?${params}` : ''}`),
  updateTutor: (id: string, data: any) => request<any>(`/admin/tutors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getSubscriptions: (params?: string) => request<any>(`/admin/subscriptions${params ? `?${params}` : ''}`),
  getSubscriptionsMaster: () => request<{ enabled: boolean }>('/admin/subscriptions-master'),
  toggleSubscriptionsMaster: (enabled: boolean) =>
    request<{ enabled: boolean }>('/admin/subscriptions-master', { method: 'PUT', body: JSON.stringify({ enabled }) }),
  createSubscription: (data: any) => request<any>('/admin/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
  updateSubscription: (id: string, data: any) => request<any>(`/admin/subscriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubscription: (id: string) => request<any>(`/admin/subscriptions/${id}`, { method: 'DELETE' }),

  getLessons: (params?: string) => request<any>(`/admin/lessons${params ? `?${params}` : ''}`),
  createLesson: (data: any) => request<any>('/admin/lessons', { method: 'POST', body: JSON.stringify(data) }),
  updateLesson: (id: string, data: any) => request<any>(`/admin/lessons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLesson: (id: string) => request<any>(`/admin/lessons/${id}`, { method: 'DELETE' }),

  getAppointments: (params?: string) => request<any>(`/admin/appointments${params ? `?${params}` : ''}`),
  getPayments: (params?: string) => request<any>(`/admin/payments${params ? `?${params}` : ''}`),
  getLegalPages: () => request<any[]>('/admin/legal'),
  updateLegalPage: (key: string, data: any) => request(`/admin/legal/${key}`, { method: 'PUT', body: JSON.stringify(data) }),
};
