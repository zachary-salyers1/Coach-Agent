
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, Task, TaskStatus, Resource, Milestone } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const TASK_GENERATION_MODEL = "gemini-2.5-flash";
const COACH_CHAT_MODEL = "gemini-2.5-flash";
const STRATEGY_MODEL = "gemini-2.5-flash";
const EXECUTION_MODEL = "gemini-2.5-flash";

/**
 * Generates a daily task list based on the user's profile and context.
 */
export const generateDailyTasks = async (profile: UserProfile): Promise<Task[]> => {
  const systemInstruction = `
    You are an elite business productivity coach. 
    Your goal is to generate 3-5 high-impact, specific tasks for the user to complete TODAY.
    The user runs a business in the "${profile.industry}" industry.
    Their main goal is: "${profile.mainGoal}".
    Their biggest challenge is: "${profile.biggestChallenge}".
    
    Tasks should be actionable, realistic for a single day, and directly contribute to the main goal.
    Prioritize tasks that move the needle (revenue generating or critical operations).
  `;

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Short, punchy task title (max 6 words)" },
        description: { type: Type.STRING, description: "Brief explanation of what to do and why." },
        priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
        estimatedTimeMin: { type: Type.INTEGER, description: "Estimated minutes to complete (15-90)" }
      },
      required: ["title", "description", "priority", "estimatedTimeMin"],
      propertyOrdering: ["title", "description", "priority", "estimatedTimeMin"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: TASK_GENERATION_MODEL,
      contents: "Generate today's high-impact task list.",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.7,
      }
    });

    const rawTasks = JSON.parse(response.text || "[]");
    
    // Map to internal Task interface
    return rawTasks.map((t: any) => ({
      id: crypto.randomUUID(),
      title: t.title,
      description: t.description,
      priority: t.priority,
      estimatedTimeMin: t.estimatedTimeMin,
      status: TaskStatus.PENDING,
      createdAt: new Date().toISOString()
    }));

  } catch (error) {
    console.error("Error generating tasks:", error);
    throw new Error("Failed to generate tasks. Please try again.");
  }
};

/**
 * Sends a message to the coach chat with context of current tasks.
 */
export const sendCoachMessage = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  message: string,
  profile: UserProfile,
  tasks: Task[] = []
) => {
  const taskContext = tasks.length > 0 
    ? `Current User Tasks:\n${tasks.map(t => `- [${t.status}] ${t.title} (${t.priority})`).join('\n')}`
    : "No tasks currently listed for today.";

  // Build Knowledge Context from saved snippets
  const knowledgeContext = (profile.knowledgeBase && profile.knowledgeBase.length > 0)
    ? `\nUSER SAVED KNOWLEDGE/CONTEXT (Reference this if relevant):\n${profile.knowledgeBase.map((k, i) => `[Item ${i+1}]: ${k}`).join('\n---\n')}`
    : "";

  const systemInstruction = `
    You are "FocusFlow", a dedicated, no-nonsense, but supportive business coach.
    User Context:
    - Business: ${profile.businessName} (${profile.industry})
    - Goal: ${profile.mainGoal}
    - Challenge: ${profile.biggestChallenge}
    
    ${taskContext}

    ${knowledgeContext}
    
    Style:
    - Keep answers concise (optimized for mobile reading).
    - Be action-oriented. Don't just give theory, give steps.
    - Hold the user accountable.
    - If they complain about being tired/lazy, remind them of their goal.
    - Use bullet points for readability.
    - If the user asks about their tasks, refer to the specific tasks in the context provided.
  `;

  try {
    const chat = ai.chats.create({
      model: COACH_CHAT_MODEL,
      history: history,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having trouble connecting right now. Let's focus on the tasks at hand.";
  }
};

/**
 * Generates a strategic breakdown of a goal into milestones, resources, and immediate tasks.
 */
export const generateGoalStrategy = async (goal: string, profile: UserProfile) => {
  const systemInstruction = `
    You are a strategic business advisor.
    The user has a main goal: "${goal}".
    Their business is in the "${profile.industry}" industry.
    
    Analyze this goal.
    1. Refine it into a specific SMART goal.
    2. Break it down into 4 weekly milestones.
    3. Suggest 3 relevant educational resources (Books, Podcasts, Tools, etc.).
    4. Create 3 immediate actionable tasks to start TODAY.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      smartGoal: { type: Type.STRING, description: "A specific, measurable, achievable, relevant, and time-bound version of the user's goal." },
      milestones: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            week: { type: Type.INTEGER },
            focus: { type: Type.STRING },
            action: { type: Type.STRING }
          },
          required: ["week", "focus", "action"]
        }
      },
      resources: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['Book', 'Podcast', 'Course', 'Tool', 'Article'] },
            description: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["title", "type", "description", "reason"]
        }
      },
      immediateTasks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
            estimatedTimeMin: { type: Type.INTEGER }
          },
          required: ["title", "description", "priority", "estimatedTimeMin"]
        }
      }
    },
    required: ["smartGoal", "milestones", "resources", "immediateTasks"]
  };

  const response = await ai.models.generateContent({
    model: STRATEGY_MODEL,
    contents: `Create a strategy for: ${goal}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
    }
  });

  const data = JSON.parse(response.text || "{}");

  // Post-process to add IDs
  const resources = (data.resources || []).map((r: any) => ({ ...r, id: crypto.randomUUID() }));
  const immediateTasks = (data.immediateTasks || []).map((t: any) => ({ 
    ...t, 
    id: crypto.randomUUID(), 
    status: TaskStatus.PENDING,
    createdAt: new Date().toISOString() 
  }));

  return {
    smartGoal: data.smartGoal,
    milestones: data.milestones,
    resources: resources,
    immediateTasks: immediateTasks
  };
};

/**
 * Executes a specific task using AI to generate content, research, or drafts.
 */
export const executeTask = async (task: Task, profile: UserProfile): Promise<string> => {
  const systemInstruction = `
    You are an AI Business Assistant. Your job is to EXECUTE the task provided by the user to the best of your ability.
    
    User Profile:
    - Business: ${profile.businessName}
    - Industry: ${profile.industry}
    
    Task Title: ${task.title}
    Task Description: ${task.description}
    
    Instructions:
    - If the task asks for an email, write the full email draft.
    - If the task asks for research, provide a summarized research report (use your internal knowledge).
    - If the task asks for a plan, write the detailed steps.
    - If the task asks for analysis, perform the analysis.
    - Output FORMAT: Markdown. Use bolding, lists, and clear headers.
    - Do not just say "Here is the task", just DO the task.
  `;

  try {
    const response = await ai.models.generateContent({
      model: EXECUTION_MODEL,
      contents: "Please complete this task for me.",
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "I tried to complete the task but couldn't generate a result. Please try again.";
  } catch (error) {
    console.error("Task Execution Error:", error);
    return "Error executing task. Please check your connection.";
  }
};
