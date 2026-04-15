import React, { useMemo } from 'react';
import { Workout } from '../types';
import { Activity, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

interface MuscleRecoveryMapProps {
  workouts: Workout[];
}

type MuscleGroup = 'Chest' | 'Back' | 'Quads' | 'Hamstrings' | 'Shoulders' | 'Biceps' | 'Triceps' | 'Core';

export default function MuscleRecoveryMap({ workouts }: MuscleRecoveryMapProps) {
  const muscleStatus = useMemo(() => {
    const status: Record<MuscleGroup, number> = {
      'Chest': 100,
      'Back': 100,
      'Quads': 100,
      'Hamstrings': 100,
      'Shoulders': 100,
      'Biceps': 100,
      'Triceps': 100,
      'Core': 100
    };

    const now = new Date();
    
    // Simple mapping of common exercise names to muscle groups
    const mapping: Record<string, MuscleGroup[]> = {
      'Bench Press': ['Chest', 'Triceps', 'Shoulders'],
      'Push Ups': ['Chest', 'Triceps'],
      'Pull Ups': ['Back', 'Biceps'],
      'Rows': ['Back', 'Biceps'],
      'Squats': ['Quads', 'Hamstrings', 'Core'],
      'Deadlifts': ['Back', 'Hamstrings', 'Core'],
      'Overhead Press': ['Shoulders', 'Triceps'],
      'Curls': ['Biceps'],
      'Plank': ['Core'],
      'Leg Press': ['Quads'],
      'Lunges': ['Quads', 'Hamstrings']
    };

    workouts.forEach(w => {
      const workoutDate = new Date(w.date);
      const hoursSince = (now.getTime() - workoutDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSince > 72) return; // Ignore old workouts

      w.exercises.forEach(ex => {
        const muscles = mapping[ex.name] || [];
        muscles.forEach(m => {
          // Fatigue based on recency (0-48h is peak fatigue)
          const fatigue = Math.max(0, 80 * (1 - hoursSince / 48));
          status[m] = Math.max(0, status[m] - fatigue);
        });
      });
    });

    return status;
  }, [workouts]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="kinetic-card p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="text-accent" size={24} />
            <h2 className="text-xl font-black font-mono tracking-tighter uppercase">Muscle Recovery Map</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Recovering</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Fatigued</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            {(Object.entries(muscleStatus) as [MuscleGroup, number][]).map(([muscle, value]) => (
              <div key={muscle} className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold uppercase tracking-wider">{muscle}</span>
                  <span className={cn(
                    "text-[10px] font-mono font-bold",
                    value > 70 ? "text-green-400" : value > 40 ? "text-orange-400" : "text-red-400"
                  )}>{Math.round(value)}%</span>
                </div>
                <div className="h-2 bg-bg rounded-full overflow-hidden border border-border">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      value > 70 ? "bg-green-500" : value > 40 ? "bg-orange-500" : "bg-red-500"
                    )}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/5 rounded-xl p-6 border border-border space-y-4">
            <div className="flex items-center gap-2 text-accent">
              <ShieldAlert size={18} />
              <h3 className="text-sm font-bold uppercase tracking-widest">Training Advice</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Based on your last 72 hours of training, your 
              <span className="text-text-primary font-bold"> {Object.entries(muscleStatus).sort((a,b) => (a[1] as number) - (b[1] as number))[0][0]} </span> 
              is currently the most fatigued group.
            </p>
            <ul className="space-y-3 pt-2">
              <AdviceItem text="Prioritize sleep and protein intake for optimal repair." />
              <AdviceItem text="Consider active recovery or mobility work for fatigued areas." />
              <AdviceItem text="Avoid high-intensity training on groups below 40%." />
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdviceItem({ text }: { text: string }) {
  return (
    <li className="flex gap-3 text-xs text-text-secondary">
      <div className="w-1 h-1 rounded-full bg-accent mt-1.5 shrink-0" />
      {text}
    </li>
  );
}
