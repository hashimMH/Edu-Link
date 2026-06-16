import { storage } from './storage';

import { Platform } from 'react-native';

// Production: use your deployed backend URL
// Development: Android emulator → 10.0.2.2:3003, iOS simulator → localhost:3003
const PROD_API = 'https://edu-link-9mwd.onrender.com';
const LOCAL_API = Platform.OS === 'android' ? 'http://10.0.2.2:3003' : 'http://localhost:3003';
export const API_HOST = __DEV__ ? LOCAL_API : PROD_API;
const BASE_URL = `${API_HOST}/api`;

// ---------------------------------------------------------------------------
// Types (ported from the original mock service + extended)
// ---------------------------------------------------------------------------

export interface Instructor {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface Appointment {
  id: string;
  date: string;
  time: string;
  instructor: Instructor;
  status?: string;
}

export interface SubscriptionItem {
  id: string;
  title: string;
  price: number;
  lessons: number;
  duration: string;
}

export interface Tutor {
  id: string;
  userId: string;
  name: string;
  rating: number;
  isPositive: boolean;
  accent: string;
  interests: string[];
  image: any;
  video: string;
  introVideoUrl?: string;
  videoUrl?: string;
  isAvailable: boolean;
  country: string;
  description: string;
  bio?: string;
  experienceYears?: number;
  avatarUrl?: string | null;
}

export interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LessonItem {
  id: string;
  title: string;
  duration: string;
  description: string;
  createdAt: string;
}

export interface Message {
  id: string;
  name: string;
  message: string;
  time: string;
  avatarPath: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  time: string;
  sender: string;
}

export interface Payment {
  id: string;
  type: string;
  amount: number;
  cardType: string;
  cardNumber: string;
  date: string;
  status: string;
}

export interface PaymentData {
  balance: number;
  income: number;
  pending: number;
  payments: Payment[];
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  time: string;
  isRead: boolean;
}

export interface ReviewItem {
  id: string;
  studentName?: string;
  student_name?: string;
  rating: number;
  date: string;
  time: string;
  comment: string | null;
}

export interface TeacherStats {
  currentStudents: number;
  bookedClasses: number;
  completedClasses: number;
  cancelledClasses: number;
  averageRating: number;
}

export interface TeacherClass {
  id: string;
  studentName: string;
  studentImage: string | null;
  date: string;
  time: string;
  duration: string;
  status: string;
}

export interface UpcomingClassData {
  id: string;
  studentName: string;
  studentImage: string | null;
  dateTime: string;
  duration: string;
}

export interface TeacherAvailability {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    interests: string[];
    avatarUrl: string | null;
  };
}

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------

// Auth expiry event emitter — any screen can listen to force logout
type AuthListener = () => void;
const authListeners: AuthListener[] = [];

export function onAuthExpired(listener: AuthListener) {
  authListeners.push(listener);
  return () => {
    const idx = authListeners.indexOf(listener);
    if (idx >= 0) authListeners.splice(idx, 1);
  };
}

function emitAuthExpired() {
  authListeners.forEach(fn => fn());
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) return false;

      const res = await fetch(`${BASE_URL.replace('/api', '')}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await res.json();
      if (!data.success) return false;

      await storage.setToken(data.data.token);
      await storage.setRefreshToken(data.data.refreshToken);
      if (data.data.user) await storage.setUser(data.data.user);
      return true;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await storage.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const doFetch = () => fetch(`${BASE_URL}${path}`, { ...options, headers });

  let res = await doFetch();

  // Auto-refresh on 401
  if (res.status === 401 && !path.includes('/auth/')) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newToken = await storage.getToken();
      if (newToken) headers['Authorization'] = `Bearer ${newToken}`;
      res = await doFetch();
    }
  }

  // Still expired after refresh — force logout (skip auth routes, they return 401 for bad credentials)
  if (res.status === 401 && !path.includes('/auth/')) {
    await storage.clear();
    emitAuthExpired();
    throw new Error('Session expired. Please login again.');
  }

  const json = await res.json();

  if (!res.ok || json.success === false) {
    const msg = json.message || `Request failed with status ${res.status}`;
    const err = new Error(msg) as any;
    err.status = res.status;
    err.errors = json.errors;
    throw err;
  }

  return json.data as T;
}

// ---------------------------------------------------------------------------
// API definitions
// ---------------------------------------------------------------------------

export const api = {
  // ── Auth ────────────────────────────────────────────────────────────
  login: (email: string, password: string): Promise<AuthResponse> =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
    interests?: string[];
  }): Promise<AuthResponse> =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  googleAuth: (data: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<AuthResponse> =>
    request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  forgotPassword: (email: string): Promise<{ message: string; resetToken?: string }> =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string): Promise<{ message: string }> =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  // ── Users ───────────────────────────────────────────────────────────
  getProfile: (): Promise<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    interests: string[];
    avatarUrl: string | null;
    country: string | null;
  }> => request('/users/me'),

  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    interests?: string[];
    country?: string;
  }) =>
    request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  uploadAvatar: async (imageUri: string): Promise<{ avatarUrl: string }> => {
    const token = await storage.getToken();
    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);
    const res = await fetch(`${BASE_URL}/users/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.message || 'Upload failed');
    }
    return json.data;
  },

  // ── Tutors ──────────────────────────────────────────────────────────
  getTutors: (filters?: {
    search?: string;
    country?: string;
    interest?: string;
    available?: boolean;
  }): Promise<Tutor[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.country) params.set('country', filters.country);
    if (filters?.interest) params.set('interest', filters.interest);
    if (filters?.available) params.set('available', 'true');
    const qs = params.toString();
    return request(`/users/tutors${qs ? `?${qs}` : ''}`);
  },

  getTutorById: (id: string) => request(`/users/tutors/${id}`),

  // ── Subscriptions ───────────────────────────────────────────────────
  getSubscriptions: (): Promise<SubscriptionItem[]> =>
    request('/subscriptions'),

  getSubscriptionStatus: (): Promise<{ enabled: boolean }> =>
    request('/subscriptions/status'),

  getMySubscriptions: () => request('/subscriptions/my'),

  // ── Appointments ────────────────────────────────────────────────────
  getAppointments: (): Promise<Appointment[]> =>
    request('/appointments'),

  createAppointment: (data: {
    tutorId: string;
    date: string;
    day: string;
    startTime: string;
    endTime: string;
  }) =>
    request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cancelAppointment: (id: string) =>
    request(`/appointments/${id}`, { method: 'DELETE' }),

  // ── Messages ────────────────────────────────────────────────────────
  getMessages: (): Promise<Message[]> =>
    request('/messages'),

  getChatMessages: (chatId: string): Promise<ChatMessage[]> =>
    request(`/messages/${chatId}`),

  sendMessage: (receiverId: string, text: string): Promise<ChatMessage> =>
    request('/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, text }),
    }),

  // ── Lessons ─────────────────────────────────────────────────────────
  getLessonHistory: (sort?: 'newest' | 'oldest'): Promise<LessonItem[]> =>
    request(`/lessons/history${sort ? `?sort=${sort}` : ''}`),

  // ── Payments ────────────────────────────────────────────────────────
  getPaymentData: (): Promise<PaymentData> =>
    request('/payments/summary'),

  getPayments: (): Promise<Payment[]> =>
    request('/payments'),

  // ── Recordings ──────────────────────────────────────────────────────
  getRecordings: (): Promise<any[]> =>
    request('/recordings'),

  getRecording: (id: string): Promise<any> =>
    request(`/recordings/${id}`),

  saveRecordingNotes: (id: string, notes: string) =>
    request(`/recordings/${id}/notes`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    }),

  deleteRecording: (id: string) =>
    request(`/recordings/${id}`, { method: 'DELETE' }),

  // ── Saved Tutors ─────────────────────────────────────────────────────
  getSavedTutors: (): Promise<any[]> =>
    request('/saved-tutors'),

  saveTutor: (tutorId: string) =>
    request(`/saved-tutors/${tutorId}`, { method: 'POST' }),

  unsaveTutor: (tutorId: string) =>
    request(`/saved-tutors/${tutorId}`, { method: 'DELETE' }),

  checkTutorSaved: (tutorId: string): Promise<{ saved: boolean }> =>
    request(`/saved-tutors/${tutorId}/status`),

  // ── Legal ───────────────────────────────────────────────────────────
  getLegalPage: (key: string): Promise<{ title: string; content: string; updated_at: string }> =>
    request(`/legal/${key}`),

  // ── Notifications ───────────────────────────────────────────────────
  getNotifications: (): Promise<NotificationItem[]> =>
    request('/notifications'),

  markNotificationRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: 'PUT' }),

  markAllNotificationsRead: () =>
    request('/notifications/read-all', { method: 'PUT' }),

  // ── Reviews ─────────────────────────────────────────────────────────
  getReviewsForTeacher: (teacherId: string): Promise<ReviewItem[]> =>
    request(`/reviews/${teacherId}`),

  getMyReviews: (): Promise<ReviewItem[]> =>
    request('/reviews'),

  // ── Teacher ─────────────────────────────────────────────────────────
  getTeacherStats: (): Promise<TeacherStats> =>
    request('/teacher/stats'),

  getTeacherClasses: (filters?: {
    status?: string;
    day?: string;
  }): Promise<TeacherClass[]> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'All')
      params.set('status', filters.status);
    if (filters?.day && filters.day !== 'All')
      params.set('day', filters.day);
    const qs = params.toString();
    return request(`/teacher/classes${qs ? `?${qs}` : ''}`);
  },

  getUpcomingClass: (): Promise<UpcomingClassData | null> =>
    request('/teacher/upcoming'),

  cancelClass: (id: string) =>
    request(`/teacher/classes/${id}`, { method: 'DELETE' }),

  setAvailability: (data: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    isRecurring?: boolean;
  }): Promise<TeacherAvailability> =>
    request('/teacher/availability', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAvailability: (): Promise<TeacherAvailability[]> =>
    request('/teacher/availability'),
};
