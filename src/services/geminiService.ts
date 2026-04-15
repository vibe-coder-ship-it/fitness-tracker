import { GoogleGenAI, Type } from "@google/genai";
import { ExerciseCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface NutritionEstimate {
  foodItem: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: string;
}

export interface ExerciseIdentification {
  exerciseName: string;
  musclesWorked: string[];
  description: string;
}

export const estimateNutrition = async (input: string | { data: string, mimeType: string }): Promise<NutritionEstimate> => {
  const prompt = "Estimate the nutritional content of this meal. Provide the food item name, approximate calories, and macronutrients (protein, carbs, fat in grams). Also provide a confidence level (High, Medium, Low).";
  
  const contents = typeof input === 'string' 
    ? { parts: [{ text: `${prompt}\n\nMeal description: ${input}` }] }
    : { parts: [{ text: prompt }, { inlineData: input }] };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          foodItem: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
          confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
        },
        required: ["foodItem", "calories", "protein", "carbs", "fat", "confidence"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const identifyExercise = async (imageData: { data: string, mimeType: string }): Promise<ExerciseIdentification> => {
  const prompt = "Identify the gym machine or exercise shown in this image. Provide the common exercise name, a list of primary muscles worked, and a brief description of how to use it safely.";

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ text: prompt }, { inlineData: imageData }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          exerciseName: { type: Type.STRING },
          musclesWorked: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          description: { type: Type.STRING }
        },
        required: ["exerciseName", "musclesWorked", "description"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export interface GeneratedWorkoutPlan {
  name: string;
  description: string;
  exercises: {
    name: string;
    category: ExerciseCategory;
    sets: number;
    reps?: number;
    weight?: number;
    duration?: number;
    intensity?: string;
  }[];
}

export const generateWorkoutPlan = async (userData: {
  goals: string;
  bodyComposition: string;
  lifestyle: string;
  experience: string;
  daysPerWeek: number;
}): Promise<GeneratedWorkoutPlan> => {
  const prompt = `Generate a personalized workout plan based on the following user profile:
  Goals: ${userData.goals}
  Body Composition: ${userData.bodyComposition}
  Lifestyle: ${userData.lifestyle}
  Fitness Experience: ${userData.experience}
  Availability: ${userData.daysPerWeek} days per week

  The plan should be professional, effective, and safe. Provide a plan name, a brief description of the strategy, and a list of exercises. 
  Each exercise must fall into one of these categories: resistance, calisthenics, isometrics, or cardio.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          exercises: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING, enum: ["resistance", "calisthenics", "isometrics", "cardio"] },
                sets: { type: Type.NUMBER },
                reps: { type: Type.NUMBER },
                weight: { type: Type.NUMBER },
                duration: { type: Type.NUMBER },
                intensity: { type: Type.STRING }
              },
              required: ["name", "category", "sets"]
            }
          }
        },
        required: ["name", "description", "exercises"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export interface PhysiqueAnalysis {
  rating: 'Chad' | 'Chud' | 'Stacy' | 'Becky';
  score: number;
  feedback: string;
  advice: string;
}

export const analyzePhysique = async (imageData: { data: string, mimeType: string }): Promise<PhysiqueAnalysis> => {
  const prompt = `Analyze the physique in this image. 
  For males: Determine if they are a "Chad" (fit, muscular, good posture) or a "Chud" (unfit, poor posture).
  For females: Determine if they are a "Stacy" (fit, toned, athletic) or a "Becky" (unfit, lacking tone).
  Provide a score from 0-100, a brief humorous but constructive feedback, and some fitness advice.
  Be playful and use gym culture terminology, but remain respectful of health and safety.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ text: prompt }, { inlineData: imageData }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          rating: { type: Type.STRING, enum: ["Chad", "Chud", "Stacy", "Becky"] },
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
          advice: { type: Type.STRING }
        },
        required: ["rating", "score", "feedback", "advice"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};
