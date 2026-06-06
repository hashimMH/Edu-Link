export interface TutorCourse {
  id: string;
  userId: string;
  name: string;
  rating: number;
  isPositive: boolean;
  accent: string;
  interests: string[];
  image: any;
  video?: string;
  videoUrl?: string;
  introVideoUrl?: string;
  isAvailable?: boolean;
  country: string;
  description?: string;
  bio?: string;
  experienceYears?: number;
  avatarUrl?: string | null;
}

export type RootStackParamList = {
	Tabs: undefined;
	TeacherTabs: undefined;
	LoginScreen: undefined; 
	ForgotPassword: undefined;
	RegistrationScreen: undefined;
	TutorInfoScreen: {
		tutor: TutorCourse;
	};
	AppointmentScreen: {
		tutor: TutorCourse;
	};
	MessagesScreen: undefined;
	ChatScreen: {
		userId: string;
		name: string;
		chatId: string;
	};
	AccountScreen: undefined;
	TeacherAccountScreen: undefined;
	LessonHistoryScreen: undefined;
	NotificationScreen: undefined;
	MyScheduleScreen: undefined;
	TeacherReviewsScreen: undefined;
	UpcomingClassScreen: undefined;
	TeacherEarningsScreen: undefined;
	AllPaymentsScreen: undefined;
	LiveClassScreen: {
		roomName: string;
		className?: string;
	};
	RecordingsScreen: undefined;
	RecordingDetailScreen: {
		recordingId: string;
	};
	SavedTutorsScreen: undefined;
	LegalScreen: {
		pageKey: 'privacy' | 'terms';
	};
};

export type TabParamList = {
	Home: undefined;
	Profile: undefined;
	Tutors: undefined;
	AIChat: undefined;
};

export type TeacherTabParamList = {
	Home: undefined;
	Scheduled: undefined;
	Messages: undefined;
	Profile: undefined;
};

export interface TeacherStats {
	currentStudents: number;
	bookedClasses: number;
	completedClasses: number;
	cancelledClasses: number;
}

export interface UpcomingClass {
	id: string;
	studentName: string;
	dateTime: string;
	duration: string;
	studentImage: any;
}

export interface ClassScheduleItem {
	id: string;
	status: 'completed' | 'canceled' | 'upcoming';
	date: string;
	time: string;
	studentName?: string;
	studentImage?: any;
}

export interface TeacherAvailability {
	id: string;
	dayOfWeek: string;
	startTime: string;
	endTime: string;
	isRecurring: boolean;
}