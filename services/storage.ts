import { UserProfile, Task, ChatMessage, StrategicPlan } from "../types";

const PROFILE_KEY = "focusflow_profile";
const TASKS_KEY = "focusflow_tasks";
const CHAT_KEY = "focusflow_chat";
const PLAN_KEY = "focusflow_plan";

export const getProfile = (): UserProfile | null => {
  const data = localStorage.getItem(PROFILE_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveProfile = (profile: UserProfile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const getTasks = (): Task[] => {
  const data = localStorage.getItem(TASKS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

export const getChatHistory = (): ChatMessage[] => {
  const data = localStorage.getItem(CHAT_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveChatHistory = (history: ChatMessage[]) => {
  localStorage.setItem(CHAT_KEY, JSON.stringify(history));
};

export const getStrategicPlan = (): StrategicPlan | null => {
  const data = localStorage.getItem(PLAN_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveStrategicPlan = (plan: StrategicPlan) => {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
};

export const clearData = () => {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(TASKS_KEY);
  localStorage.removeItem(CHAT_KEY);
  localStorage.removeItem(PLAN_KEY);
};