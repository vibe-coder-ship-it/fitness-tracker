import React, { useMemo } from 'react';
import { Calendar, Clock, Trash2, Dumbbell, Zap, Timer, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { Workout, WeightUnit, ResistanceSet, CalisthenicsSet, IsometricSet, CardioSet } from '../types';
import { formatDate, formatHMS } from '../lib/utils';

interface WorkoutHistoryProps {
  workouts: Workout[];
  onDelete: (id: string) => void;
  unit: WeightUnit;
}

export default function WorkoutHistory({ workouts, onDelete, unit }: WorkoutHistoryProps) {
  const [expandedWorkout, setExpandedWorkout] = React.useState<string | null>(null);

  const groupedWorkouts = useMemo(() => {
    const groups: Record<string, Workout[]> = {};
    workouts.forEach(w => {
      const dateKey = new Date(w.date).toISOString().split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(w);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [workouts]);

  if (workouts.length === 0) {
    return (
      <div className="text-center py-20 kinetic-card border-dashed">
        <Calendar className="mx-auto text-text-secondary mb-4 opacity-20" size={48} />
        <p className="text-text-secondary font-medium">No workout history yet. Time to hit the gym!</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      {groupedWorkouts.map(([date, dateWorkouts]) => (
        <div key={date} className="space-y-4">
          <div className="flex items-center gap-4 px-2">
            <div className="h-px flex-grow bg-border"></div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
              {formatDate(date)}
            </h2>
            <div className="h-px flex-grow bg-border"></div>
          </div>

          <div className="space-y-4">
            {dateWorkouts.map((workout) => (
              <div key={workout.id} className="kinetic-card group hover:border-accent transition-all">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-accent/10 text-accent p-3 rounded-md">
                        <Clock size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-text-primary">
                          {new Date(workout.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Session
                        </h3>
                        <div className="flex items-center gap-3 text-text-secondary text-xs font-medium">
                          <span className="flex items-center gap-1"><Dumbbell size={12} /> {workout.exercises.length} ex</span>
                          <span className="bg-white/5 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-tighter">{workout.unit}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => onDelete(workout.id)}
                      className="text-text-secondary hover:text-red-400 p-2 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {workout.notes && (
                    <p className="text-text-secondary text-xs italic mb-4 bg-white/5 p-3 rounded-md border-l-2 border-accent">
                      "{workout.notes}"
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {workout.exercises.map((exercise) => (
                      <div key={exercise.id} className="p-3 bg-white/5 rounded-md border border-border space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="text-text-secondary">
                            {exercise.category === 'resistance' && <Dumbbell size={14} />}
                            {exercise.category === 'calisthenics' && <Zap size={14} />}
                            {exercise.category === 'isometrics' && <Timer size={14} />}
                            {exercise.category === 'cardio' && <Heart size={14} />}
                          </div>
                          <div className="flex-grow">
                            <div className="text-xs font-bold text-text-primary">{exercise.name}</div>
                            <div className="text-[9px] text-text-secondary uppercase font-bold tracking-wider">
                              {exercise.sets.length} sets • {exercise.category}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 border-t border-white/5">
                          {exercise.sets.map((set, i) => (
                            <div key={set.id} className="text-[10px] text-text-secondary flex justify-between">
                              <span className="opacity-50 font-mono">{i + 1}.</span>
                              <span className="font-bold">
                                {exercise.category === 'resistance' && (
                                  `${(set as ResistanceSet).weight}${workout.unit} x ${(set as ResistanceSet).reps}`
                                )}
                                {exercise.category === 'calisthenics' && (
                                  `${(set as CalisthenicsSet).reps} reps${(set as CalisthenicsSet).addedWeight ? ` (+${(set as CalisthenicsSet).addedWeight}${workout.unit})` : ''}`
                                )}
                                {exercise.category === 'isometrics' && (
                                  `${formatHMS((set as IsometricSet).timeUnderTension)}${(set as IsometricSet).addedWeight ? ` (+${(set as IsometricSet).addedWeight}${workout.unit})` : ''}`
                                )}
                                {exercise.category === 'cardio' && (
                                  `${(set as CardioSet).totalTime}m (${(set as CardioSet).intensityTime}m intensity)`
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}


