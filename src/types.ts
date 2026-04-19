export type ExerciseCategory = 'resistance' | 'calisthenics' | 'isometrics' | 'cardio';
export type WeightUnit = 'lbs' | 'kg';

export interface BaseExercise {
  id: string;
  name: string;
  category: ExerciseCategory;
}

export interface ResistanceSet {
  id: string;
  weight: number;
  reps: number;
}

export interface CalisthenicsSet {
  id: string;
  reps: number;
  addedWeight?: number;
}

export interface IsometricSet {
  id: string;
  timeUnderTension: number; // in seconds
  addedWeight?: number;
}

export interface CardioSet {
  id: string;
  totalTime: number; // in minutes
  intensityTime: number; // in minutes (time spent at high intensity)
}

export type SetData = ResistanceSet | CalisthenicsSet | IsometricSet | CardioSet;

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  category: ExerciseCategory;
  sets: SetData[];
  isCustom?: boolean;
}

export interface Workout {
  id: string;
  date: string; // ISO string
  duration: number; // in minutes
  exercises: WorkoutExercise[];
  unit: WeightUnit;
  notes?: string;
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
}

export interface NutritionLog {
  date: string; // YYYY-MM-DD
  meals: Meal[];
}
