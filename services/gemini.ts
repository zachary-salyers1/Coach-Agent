import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, Task, TaskStatus, Resource, Milestone } from "../types";

// Initialize Gemini
// NOTE: process.env.API_KEY is expected to be available in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const TASK_GENERATION_MODEL = "gemini-2.5-flash";
const COACH_CHAT_MODEL = "gemini-2.5-flash";
const STRATEGY_MODEL = "gemini-2.5-flash";

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
 * Sends a message to the coach chat.
 */
export const sendCoachMessage = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  message: string,
  profile: UserProfile
) => {
  const systemInstruction = `
    You are "FocusFlow", a dedicated, no-nonsense, but supportive business coach.
    User Context:
    - Business: ${profile.businessName} (${profile.industry})
    - Goal: ${profile.mainGoal}
    - Challenge: ${profile.biggestChallenge}
    
    Style:
    - Keep answers concise (optimized for mobile reading).
    - Be action-oriented. Don't just give theory, give steps.
    - Hold the user accountable.
    - If they complain about being tired/lazy, remind them of their goal.
    - Use bullet points for readability.
  `;

  try {
    const chat = ai.chats.create({
      model: COACH_CHAT_MODEL,
      history: history,
      config: {
        systemInstruction,
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Chat error:", error);
    return "I'm having trouble connecting to my strategy center right now. Please check your connection.";
  }
};

/**
 * Generates a strategic breakdown of a goal and suggested resources.
 */
export const generateGoalStrategy = async (
  goal: string, 
  profile: UserProfile
): Promise<{
  smartGoal: string;
  milestones: Milestone[];
  immediateTasks: Task[];
  resources: Resource[];
}> => {
  const systemInstruction = `
    You are an expert business strategist. 
    The user has a goal: "${goal}".
    Business: ${profile.businessName} (${profile.industry}).
    Challenge: ${profile.biggestChallenge}.

    1. Refine the goal into a specific SMART goal (Specific, Measurable, Achievable, Relevant, Time-bound).
    2. Break it down into 4 weekly milestones for a 1-month sprint.
    3. Create 3 IMMEDIATE, specific, daily tasks to start TODAY.
    4. Suggest 3 high-quality resources (Books, Podcasts, Tools, Articles) that specifically help with this goal or challenge.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      smartGoal: { type: Type.STRING, description: "The refined SMART version of the user's goal." },
      milestones: {
        type: Type.ARRAY,
        description: "4 weekly milestones",
        items: {
          type: Type.OBJECT,
          properties: {
            week: { type: Type.INTEGER },
            focus: { type: Type.STRING, description: "Main theme of the week" },
            action: { type: Type.STRING, description: "Key outcome for the week" }
          },
          required: ["week", "focus", "action"]
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
      },
      resources: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["Book", "Podcast", "Course", "Tool", "Article"] },
            description: { type: Type.STRING, description: "Brief summary of the resource" },
            reason: { type: Type.STRING, description: "Why this specific resource helps THIS goal." }
          },
          required: ["title", "type", "description", "reason"]
        }
      }
    },
    required: ["smartGoal", "milestones", "immediateTasks", "resources"]
  };

  try {
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

    const tasks: Task[] = (data.immediateTasks || []).map((t: any) => ({
      id: crypto.randomUUID(),
      title: t.title,
      description: t.description,
      priority: t.priority,
      estimatedTimeMin: t.estimatedTimeMin,
      status: TaskStatus.PENDING,
      createdAt: new Date().toISOString()
    }));

    const resources: Resource[] = (data.resources || []).map((r: any) => ({
      id: crypto.randomUUID(),
      title: r.title,
      type: r.type,
      description: r.description,
      reason: r.reason
    }));

    return {
      smartGoal: data.smartGoal || goal,
      milestones: data.milestones || [],
      immediateTasks: tasks,
      resources: resources
    };

  } catch (error) {
    console.error("Strategy generation error:", error);
    throw new Error("Failed to generate strategy.");
  }
};