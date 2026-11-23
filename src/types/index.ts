export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  isActive?: boolean;
  avatar?: string | null;
  createdAt?: string;
  totalMeals?: number;
  totalHealthChecks?: number;
  totalSymptoms?: number;
  totalSleep?: number;
  totalActivity?: number;
  totalRecords?: number;
}

export interface HealthExamination {
  id: number;
  userId: number;
  type: 'MENTAL' | 'PHYSICAL' | 'NUTRITION';
  title: string;
  date: string;
  time: string;
  score?: number | null;
  status: string;
  category: string;
  summary: string;
  answers: string; // JSON string
  results: string; // JSON string
  recommendations?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface HealthLog {
  id: number;
  userId: number;
  date: string;
  time: string;
  energy: number; // 1 - 10
  mood: string;
  bodyCondition: string;
  stomachCondition: string;
  stressLevel: number; // 1 - 10
  notes?: string;
  createdAt: string;
}

export interface Meal {
  id: number;
  userId: number;
  name: string;
  category: string;
  portion: string;
  date: string;
  time: string;
  imageUrl?: string;
  notes?: string;
  createdAt: string;
  preMeal?: PreMealLog | null;
  postMeal?: PostMealLog | null;
}

export interface PreMealLog {
  id: number;
  userId: number;
  mealId?: number | null;
  date: string;
  time: string;
  hungerLevel: number;
  energy: number;
  mood: string;
  stomachCondition: string;
  bodyCondition: string;
  notes?: string;
  createdAt: string;
}

export interface PostMealLog {
  id: number;
  userId: number;
  mealId?: number | null;
  date: string;
  time: string;
  energy: number;
  mood: string;
  fullnessLevel: number;
  stomachCondition: string;
  isSleepy: boolean;
  isNauseous: boolean;
  isBloated: boolean;
  discomfortLevel: number;
  notes?: string;
  createdAt: string;
}

export interface Symptom {
  id: number;
  userId: number;
  name: string;
  intensity: number; // 1 - 10
  date: string;
  time: string;
  duration: string;
  notes?: string;
  createdAt: string;
}

export interface SleepLog {
  id: number;
  userId: number;
  date: string;
  sleepTime: string;
  wakeTime: string;
  durationHours: number;
  quality: number; // 1 - 5
  notes?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  userId: number;
  activityName: string;
  durationMinutes: number;
  intensity: string;
  date: string;
  time: string;
  notes?: string;
  createdAt: string;
}

export interface HydrationLog {
  id: number;
  userId: number;
  amountMl: number;
  date: string;
  time: string;
  notes?: string;
  createdAt: string;
}

export interface FoodItem {
  id: number;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  standardPortion: string;
  description?: string;
  createdAt: string;
}

export interface EducationArticle {
  id: number;
  title: string;
  category: string;
  summary: string;
  content: string;
  author: string;
  readTime: string;
  isPublished: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  type: string;
  description?: string;
  createdAt: string;
}

export interface SystemNotification {
  id: number;
  title: string;
  message: string;
  targetRole: string;
  type: string;
  isActive: boolean;
  createdAt: string;
}

export interface ReportsSummaryResponse {
  period: {
    type: string;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalDaysRecorded: number;
    health: {
      totalChecks: number;
      avgEnergy: number;
      avgStress: number;
      dominantMood: string;
      symptomsCount: number;
    };
    meals: {
      totalMeals: number;
      breakfastCount: number;
      lunchCount: number;
      dinnerCount: number;
      snackCount: number;
      mostFrequentMeals: { name: string; count: number }[];
    };
    postMeal: {
      totalFollowUps: number;
      avgEnergy: number;
      avgFullness: number;
      bloatingCount: number;
      nauseaCount: number;
      sleepyCount: number;
    };
    sleep: {
      totalRecords: number;
      avgDuration: number;
      avgQuality: number;
    };
    activity: {
      totalActivities: number;
      totalDurationMinutes: number;
    };
    symptoms: {
      totalSymptoms: number;
      avgIntensity: number;
      mostFrequentSymptoms: { name: string; count: number }[];
    };
    hydration: {
      totalHydrationMl: number;
      avgDailyHydrationMl: number;
    };
  };
  charts: {
    energyTrend: { date: string; time: string; energy: number; stress: number }[];
    moodTrend: { date: string; time: string; moodScore: number; mood: string }[];
    sleepBarChart: { date: string; duration: number; quality: number }[];
    activityBarChart: { date: string; name: string; duration: number; intensity: string }[];
    postMealChart: { date: string; time: string; energy: number; fullness: number; discomfort: number }[];
    mealCategoryDistribution: { name: string; value: number }[];
  };
  rawLogs: {
    health: HealthLog[];
    meals: Meal[];
    preMeal: PreMealLog[];
    postMeal: PostMealLog[];
    symptoms: Symptom[];
    sleep: SleepLog[];
    activity: ActivityLog[];
    hydration: HydrationLog[];
  };
}
