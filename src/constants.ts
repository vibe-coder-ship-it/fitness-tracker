import { ExerciseCategory } from './types';

export const COMMON_EXERCISES: Record<ExerciseCategory, string[]> = {
  resistance: [
    'Bench Press',
    'Squat',
    'Deadlift',
    'Overhead Press',
    'Barbell Row',
    'Dumbbell Incline Press',
    'Lat Pulldown',
    'Leg Press',
    'Bicep Curl',
    'Tricep Extension',
    'Shoulder Fly',
    'Leg Extension',
    'Leg Curl'
  ],
  calisthenics: [
    'Pull Up',
    'Push Up',
    'Dip',
    'Muscle Up',
    'Chin Up',
    'Pike Push Up',
    'Bodyweight Squat',
    'Lunge',
    'Plank',
    'Burpee'
  ],
  isometrics: [
    'Plank',
    'Wall Sit',
    'L-Sit',
    'Hollow Body Hold',
    'Superman Hold',
    'Iron Cross Hold',
    'Planche Lean'
  ],
  cardio: [
    'Running',
    'Cycling',
    'Swimming',
    'Rowing',
    'Jump Rope',
    'HIIT Sprints',
    'Elliptical',
    'Stair Climber'
  ]
};

export const WORKOUT_PLANS = [
  {
    id: 'plan-1',
    name: 'The Hypertrophy Hybrid',
    description: 'A mix of heavy resistance and high-volume calisthenics for maximum muscle growth.',
    exercises: [
      { name: 'Bench Press', category: 'resistance', sets: 4, reps: '8-12', intensity: '75% 1RM' },
      { name: 'Pull Ups', category: 'calisthenics', sets: 4, reps: 'Max', intensity: 'Bodyweight' },
      { name: 'Barbell Squat', category: 'resistance', sets: 3, reps: '10', intensity: '70% 1RM' },
      { name: 'Plank', category: 'isometrics', sets: 3, reps: '60s', intensity: 'Hold' },
      { name: 'HIIT Sprints', category: 'cardio', sets: 5, reps: '30s on / 30s off', intensity: 'High' }
    ]
  },
  {
    id: 'plan-2',
    name: 'Power & Prowess',
    description: 'Focuses on compound movements and explosive power.',
    exercises: [
      { name: 'Deadlift', category: 'resistance', sets: 5, reps: '5', intensity: '85% 1RM' },
      { name: 'Dips', category: 'calisthenics', sets: 3, reps: '12-15', intensity: 'Weighted if possible' },
      { name: 'Overhead Press', category: 'resistance', sets: 4, reps: '8', intensity: '75% 1RM' },
      { name: 'Wall Sit', category: 'isometrics', sets: 3, reps: '45s', intensity: 'Hold' },
      { name: 'Rowing', category: 'cardio', sets: 1, reps: '2000m', intensity: 'Moderate' }
    ]
  },
  {
    id: 'plan-3',
    name: 'Calisthenics King',
    description: 'Advanced bodyweight movements paired with isolation resistance.',
    exercises: [
      { name: 'Muscle Ups', category: 'calisthenics', sets: 5, reps: '3-5', intensity: 'Explosive' },
      { name: 'Dumbbell Flys', category: 'resistance', sets: 3, reps: '15', intensity: 'Control' },
      { name: 'Pistol Squats', category: 'calisthenics', sets: 3, reps: '8 per leg', intensity: 'Bodyweight' },
      { name: 'L-Sit', category: 'isometrics', sets: 4, reps: '20s', intensity: 'Hold' },
      { name: 'Jump Rope', category: 'cardio', sets: 1, reps: '10 mins', intensity: 'Steady' }
    ]
  },
  {
    id: 'plan-4',
    name: 'The Aesthetic Engine',
    description: 'High volume and intensity to carve out muscle definition.',
    exercises: [
      { name: 'Incline DB Press', category: 'resistance', sets: 4, reps: '12', intensity: 'Slow eccentric' },
      { name: 'Lat Pulldowns', category: 'resistance', sets: 4, reps: '12', intensity: 'Squeeze' },
      { name: 'Push Ups', category: 'calisthenics', sets: 3, reps: '30', intensity: 'Short rest' },
      { name: 'Hollow Body Hold', category: 'isometrics', sets: 3, reps: '45s', intensity: 'Hold' },
      { name: 'Cycling', category: 'cardio', sets: 1, reps: '20 mins', intensity: 'Intervals' }
    ]
  },
  {
    id: 'plan-5',
    name: 'Iron & Air',
    description: 'Balanced approach for overall athleticism and muscle mass.',
    exercises: [
      { name: 'Barbell Row', category: 'resistance', sets: 4, reps: '10', intensity: 'Heavy' },
      { name: 'Chin Ups', category: 'calisthenics', sets: 3, reps: '10', intensity: 'Controlled' },
      { name: 'Leg Press', category: 'resistance', sets: 3, reps: '15', intensity: 'Moderate' },
      { name: 'Plank', category: 'isometrics', sets: 3, reps: '60s', intensity: 'Hold' },
      { name: 'Running', category: 'cardio', sets: 1, reps: '3 miles', intensity: 'Zone 2' }
    ]
  }
];
