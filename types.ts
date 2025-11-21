export enum TaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'High' | 'Medium' | 'Low';
  estimatedTimeMin: number;
  createdAt: string; // ISO Date string
}

export interface UserProfile {
  businessName: string;
  industry: string;
  mainGoal: string;
  biggestChallenge: string;
  isSetup: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Resource {
  id: string;
  title: string;
  type: 'Book' | 'Podcast' | 'Course' | 'Tool' | 'Article';
  description: string;
  reason: string;
}

export interface Milestone {
  week: number;
  focus: string;
  action: string;
}

export interface StrategicPlan {
  originalGoal: string;
  smartGoal: string;
  milestones: Milestone[];
  resources: Resource[];
  generatedAt: number;
}

export enum ViewState {
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  STRATEGY = 'STRATEGY',
  COACH = 'COACH',
  SETTINGS = 'SETTINGS',
}