import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, X, Dumbbell, Timer, Heart, Zap, ChevronDown, Ghost, Play, RotateCcw, Loader2, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  Workout, 
  ExerciseCategory, 
  WorkoutExercise, 
  SetData,
  ResistanceSet,
  CalisthenicsSet,
  IsometricSet,
  CardioSet,
  WeightUnit
} from '../types';
import { COMMON_EXERCISES } from '../constants';
import { collection, doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';

interface WorkoutLoggerProps {
  onSave: (workout: Workout) => void;
  defaultUnit: WeightUnit;
  user: User | null;
}

export default function WorkoutLogger({ onSave, defaultUnit, user }: WorkoutLoggerProps) {
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [notes, setNotes] = useState('');
  const [unit, setUnit] = useState<WeightUnit>(defaultUnit);
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [checkedSets, setCheckedSets] = useState<Record<string, boolean>>({});
  const startTime = useRef<number>(Date.now());

  // Load Draft
  useEffect(() => {
    async function loadDraft() {
      if (!user) {
        const saved = localStorage.getItem('kinetic-workout-draft');
        if (saved) {
          try {
            const draft = JSON.parse(saved);
            setExercises(draft.exercises);
            setNotes(draft.notes);
            setUnit(draft.unit);
            if (draft.startTime) startTime.current = draft.startTime;
          } catch (e) {}
        }
        return;
      }

      try {
        const draftRef = doc(db, 'drafts', user.uid);
        const draftSnap = await getDoc(draftRef);
        if (draftSnap.exists()) {
          const draft = draftSnap.data();
          setExercises(draft.exercises || []);
          setNotes(draft.notes || '');
          setUnit(draft.unit || defaultUnit);
          setCheckedSets(draft.checkedSets || {});
          if (draft.startTime) startTime.current = draft.startTime;
          setLastSaved(new Date());
        }
      } catch (error) {
        console.error("Error loading draft:", error);
      }
    }
    loadDraft();
  }, [user, defaultUnit]);

  // Auto-Save Draft
  useEffect(() => {
    const draftData = {
      exercises,
      notes,
      unit,
      checkedSets,
      startTime: startTime.current,
      updatedAt: serverTimestamp()
    };

    // Fast local save
    localStorage.setItem('kinetic-workout-draft', JSON.stringify({
      ...draftData,
      updatedAt: new Date().toISOString()
    }));

    if (!user) return;

    const timeoutId = setTimeout(async () => {
      setIsSyncing(true);
      try {
        await setDoc(doc(db, 'drafts', user.uid), draftData);
        setLastSaved(new Date());
      } catch (error) {
        console.error("Error saving draft:", error);
      } finally {
        setIsSyncing(false);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [exercises, notes, unit, checkedSets, user]);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (isResting && restTime > 0) {
      interval = setInterval(() => {
        setRestTime(prev => prev - 1);
      }, 1000);
    } else if (restTime === 0) {
      setIsResting(false);
    }
    return () => clearInterval(interval);
  }, [isResting, restTime]);

  const startRest = (intensity: number) => {
    // Adaptive rest: Higher intensity = longer rest
    // Base 60s + (intensity factor)
    const baseRest = 60;
    const adaptiveRest = Math.min(180, baseRest + (intensity * 5)); 
    setRestTime(Math.round(adaptiveRest));
    setIsResting(true);
  };

  const addExercise = (category: ExerciseCategory) => {
    const newExercise: WorkoutExercise = {
      id: Math.random().toString(36).substr(2, 9),
      exerciseId: '', 
      name: '',
      category,
      sets: []
    };
    setExercises([...exercises, newExercise]);
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id));
  };

  const updateExercise = (id: string, updates: Partial<WorkoutExercise>) => {
    setExercises(exercises.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const addSet = (exerciseId: string) => {
    setExercises(exercises.map(e => {
      if (e.id === exerciseId) {
        let newSet: SetData;
        switch (e.category) {
          case 'resistance':
            newSet = { id: Math.random().toString(36).substr(2, 9), weight: 0, reps: 0 };
            break;
          case 'calisthenics':
            newSet = { id: Math.random().toString(36).substr(2, 9), reps: 0, addedWeight: 0 };
            break;
          case 'isometrics':
            newSet = { id: Math.random().toString(36).substr(2, 9), timeUnderTension: 0, addedWeight: 0 };
            break;
          case 'cardio':
            newSet = { id: Math.random().toString(36).substr(2, 9), totalTime: 0, intensityTime: 0 };
            break;
        }
        return { ...e, sets: [...e.sets, newSet] };
      }
      return e;
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(exercises.map(e => {
      if (e.id === exerciseId) {
        return { ...e, sets: e.sets.filter(s => s.id !== setId) };
      }
      return e;
    }));
  };

  const updateSet = (exerciseId: string, setId: string, updates: Partial<SetData>) => {
    setExercises(exercises.map(e => {
      if (e.id === exerciseId) {
        return {
          ...e,
          sets: e.sets.map(s => s.id === setId ? { ...s, ...updates } : s)
        };
      }
      return e;
    }));
  };

  const handleSave = async () => {
    if (exercises.length === 0) return;
    
    // Calculate duration automatically
    const endTime = Date.now();
    const durationMinutes = Math.round((endTime - startTime.current) / 60000);

    const workout: Workout = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      duration: durationMinutes,
      exercises,
      unit,
      notes
    };

    // Submit actual session
    onSave(workout);

    // Clear draft
    localStorage.removeItem('kinetic-workout-draft');
    if (user) {
      try {
        await deleteDoc(doc(db, 'drafts', user.uid));
      } catch (e) {}
    }
  };

  const toggleSetCheck = (setId: string) => {
    setCheckedSets(prev => ({ ...prev, [setId]: !prev[setId] }));
  };

  return (
    <div className={cn("space-y-6 max-w-4xl mx-auto transition-all duration-500", isGhostMode && "opacity-40 grayscale blur-[1px] pointer-events-none select-none")}>
      {/* Rest Timer Overlay */}
      {isResting && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-[110] flex items-center justify-center animate-in fade-in duration-300 pointer-events-auto">
          <div className="kinetic-card p-10 text-center space-y-6 max-w-sm w-full mx-4 border-accent shadow-2xl shadow-accent/20">
            <div className="kinetic-label">Adaptive Rest Period</div>
            <div className="text-8xl font-black font-mono text-accent tracking-tighter">
              {Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsResting(false)}
                className="flex-1 bg-surface border border-border py-3 rounded-md font-bold text-xs uppercase tracking-widest hover:border-accent transition-all"
              >
                Skip
              </button>
              <button 
                onClick={() => setRestTime(prev => prev + 30)}
                className="flex-1 bg-accent text-bg py-3 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-sky-300 transition-all"
              >
                +30s
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Controls */}
      <div className="kinetic-card p-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4 flex-grow">
            <div className="flex flex-col">
              <label className="kinetic-label mb-1">Unit</label>
              <select 
                value={unit} 
                onChange={(e) => setUnit(e.target.value as WeightUnit)}
                className="bg-bg border border-border rounded-md px-3 py-2 w-24 focus:ring-1 focus:ring-accent outline-none transition-all text-sm font-bold"
              >
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
              </select>
            </div>
            <div className="flex flex-col flex-grow">
              <label className="kinetic-label mb-1">Session Notes</label>
              <input 
                type="text" 
                placeholder="Log your thoughts..."
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                className="bg-bg border border-border rounded-md px-3 py-2 focus:ring-1 focus:ring-accent outline-none transition-all text-sm"
              />
            </div>
            {lastSaved && (
              <div className="flex flex-col items-center justify-center px-4 border-l border-border">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {isSyncing ? (
                    <Loader2 size={12} className="text-accent animate-spin" />
                  ) : (
                    <CloudCheck size={12} className="text-accent" />
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Auto-Saved</span>
                </div>
                <span className="text-[8px] text-text-secondary font-mono">
                  {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            )}

            {/* Ghost Mode Toggle (Integrated into header) */}
            <div className="flex items-center pl-4 border-l border-border pointer-events-auto">
              <button 
                onClick={() => setIsGhostMode(!isGhostMode)}
                className={cn(
                  "p-2 rounded-lg transition-all flex items-center gap-2",
                  isGhostMode ? "bg-accent text-bg" : "bg-bg text-text-secondary hover:text-accent border border-border"
                )}
                title="Toggle Ghost Mode"
              >
                <Ghost size={16} className={cn(isGhostMode && "animate-pulse")} />
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none hidden sm:block">
                  {isGhostMode ? "Ghost Active" : "Ghost"}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <AddExerciseBtn onClick={() => addExercise('resistance')} icon={<Dumbbell size={16} />} label="Resistance" />
          <AddExerciseBtn onClick={() => addExercise('calisthenics')} icon={<Zap size={16} />} label="Calisthenics" />
          <AddExerciseBtn onClick={() => addExercise('isometrics')} icon={<Timer size={16} />} label="Isometrics" />
          <AddExerciseBtn onClick={() => addExercise('cardio')} icon={<Heart size={16} />} label="Cardio" />
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-4">
        {exercises.map((exercise) => (
          <div key={exercise.id} className="kinetic-card animate-in slide-in-from-top-2 duration-300">
            <div className="p-4 border-b border-border flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3 flex-grow">
                <div className={cn(
                  "p-2 rounded-md",
                  exercise.category === 'resistance' && "text-accent",
                  exercise.category === 'calisthenics' && "text-orange-400",
                  exercise.category === 'isometrics' && "text-accent-alt",
                  exercise.category === 'cardio' && "text-red-400"
                )}>
                  {exercise.category === 'resistance' && <Dumbbell size={18} />}
                  {exercise.category === 'calisthenics' && <Zap size={18} />}
                  {exercise.category === 'isometrics' && <Timer size={18} />}
                  {exercise.category === 'cardio' && <Heart size={18} />}
                </div>
                
                <div className="relative flex-grow max-w-md">
                  <select
                    value={exercise.isCustom ? 'custom' : exercise.name}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        updateExercise(exercise.id, { isCustom: true, name: '' });
                      } else {
                        updateExercise(exercise.id, { isCustom: false, name: e.target.value });
                      }
                    }}
                    className="w-full bg-surface text-sm font-bold outline-none border-b border-border focus:border-accent transition-all appearance-none cursor-pointer pr-8 py-1"
                  >
                    <option value="" disabled className="bg-surface">Select Exercise</option>
                    {COMMON_EXERCISES[exercise.category].map(name => (
                      <option key={name} value={name} className="bg-surface">{name}</option>
                    ))}
                    <option value="custom" className="bg-surface">Custom...</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                </div>

                {exercise.isCustom && (
                  <input 
                    type="text" 
                    placeholder="Enter exercise name"
                    value={exercise.name}
                    onChange={(e) => updateExercise(exercise.id, { name: e.target.value })}
                    className="bg-transparent text-sm font-bold outline-none border-b border-accent transition-all w-full max-w-xs"
                    autoFocus
                  />
                )}
              </div>
              <button 
                onClick={() => removeExercise(exercise.id)}
                className="text-text-secondary hover:text-red-400 p-2 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="p-4">
              <div className="space-y-3">
                {exercise.sets.map((set, index) => (
                  <div key={set.id} className="flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-200">
                    <span className="text-[10px] font-mono font-bold text-text-secondary w-6">0{index + 1}</span>
                    
                    {exercise.category === 'resistance' && (
                      <>
                        <SetInput label="Weight" value={(set as ResistanceSet).weight} onChange={(v) => updateSet(exercise.id, set.id, { weight: v })} suffix={unit} />
                        <SetInput label="Reps" value={(set as ResistanceSet).reps} onChange={(v) => updateSet(exercise.id, set.id, { reps: v })} />
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => toggleSetCheck(set.id)}
                            className={cn(
                              "p-2 transition-colors rounded-full",
                              checkedSets[set.id] ? "text-accent bg-accent/10" : "text-text-secondary hover:text-accent hover:bg-white/5"
                            )}
                            title="Complete Set"
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            onClick={() => startRest((set as ResistanceSet).weight * (set as ResistanceSet).reps / 10)}
                            className="p-2 text-text-secondary hover:text-accent-alt transition-colors rounded-full hover:bg-white/5"
                            title="Start Adaptive Rest"
                          >
                            <Clock size={14} />
                          </button>
                        </div>
                      </>
                    )}

                    {exercise.category === 'calisthenics' && (
                      <>
                        <SetInput label="Reps" value={(set as CalisthenicsSet).reps} onChange={(v) => updateSet(exercise.id, set.id, { reps: v })} />
                        <SetInput label="Added" value={(set as CalisthenicsSet).addedWeight || 0} onChange={(v) => updateSet(exercise.id, set.id, { addedWeight: v })} suffix={unit} />
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => toggleSetCheck(set.id)}
                            className={cn(
                              "p-2 transition-colors rounded-full",
                              checkedSets[set.id] ? "text-accent bg-accent/10" : "text-text-secondary hover:text-accent hover:bg-white/5"
                            )}
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            onClick={() => startRest((set as CalisthenicsSet).reps)}
                            className="p-2 text-text-secondary hover:text-accent-alt transition-colors rounded-full hover:bg-white/5"
                            title="Start Adaptive Rest"
                          >
                            <Clock size={14} />
                          </button>
                        </div>
                      </>
                    )}

                    {exercise.category === 'isometrics' && (
                      <>
                        <div className="flex items-center gap-1 group/hms">
                          <label className="text-[9px] font-bold uppercase text-text-secondary tracking-tighter mb-0.5 block">Time</label>
                          <div className="flex items-center gap-1">
                            <HMSInput 
                              value={Math.floor((set as IsometricSet).timeUnderTension / 3600)} 
                              onChange={(v) => {
                                const { minutes, seconds } = secondsToHMS((set as IsometricSet).timeUnderTension);
                                updateSet(exercise.id, set.id, { timeUnderTension: hmsToSeconds(v, minutes, seconds) });
                              }} 
                              label="H"
                            />
                            <span className="text-text-secondary font-bold text-[10px] self-end mb-2">:</span>
                            <HMSInput 
                              value={Math.floor(((set as IsometricSet).timeUnderTension % 3600) / 60)} 
                              onChange={(v) => {
                                const { hours, seconds } = secondsToHMS((set as IsometricSet).timeUnderTension);
                                updateSet(exercise.id, set.id, { timeUnderTension: hmsToSeconds(hours, v, seconds) });
                              }} 
                              label="M"
                              max={59}
                            />
                            <span className="text-text-secondary font-bold text-[10px] self-end mb-2">:</span>
                            <HMSInput 
                              value={(set as IsometricSet).timeUnderTension % 60} 
                              onChange={(v) => {
                                const { hours, minutes } = secondsToHMS((set as IsometricSet).timeUnderTension);
                                updateSet(exercise.id, set.id, { timeUnderTension: hmsToSeconds(hours, minutes, v) });
                              }} 
                              label="S"
                              max={59}
                            />
                          </div>
                        </div>
                        <SetInput label="Added" value={(set as IsometricSet).addedWeight || 0} onChange={(v) => updateSet(exercise.id, set.id, { addedWeight: v })} suffix={unit} />
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => toggleSetCheck(set.id)}
                            className={cn(
                              "p-2 transition-colors rounded-full",
                              checkedSets[set.id] ? "text-accent bg-accent/10" : "text-text-secondary hover:text-accent hover:bg-white/5"
                            )}
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            onClick={() => startRest((set as IsometricSet).timeUnderTension / 2)}
                            className="p-2 text-text-secondary hover:text-accent-alt transition-colors rounded-full hover:bg-white/5"
                            title="Start Adaptive Rest"
                          >
                            <Clock size={14} />
                          </button>
                        </div>
                      </>
                    )}

                    {exercise.category === 'cardio' && (
                      <>
                        <SetInput label="Total" value={(set as CardioSet).totalTime} onChange={(v) => updateSet(exercise.id, set.id, { totalTime: v })} suffix="m" />
                        <SetInput label="Intensity" value={(set as CardioSet).intensityTime} onChange={(v) => updateSet(exercise.id, set.id, { intensityTime: v })} suffix="m" />
                      </>
                    )}

                    <button 
                      onClick={() => removeSet(exercise.id, set.id)}
                      className="text-text-secondary hover:text-red-400 p-1 ml-auto"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => addSet(exercise.id)}
                className="mt-4 w-full py-2 border border-dashed border-border rounded-md text-text-secondary font-bold text-[10px] uppercase tracking-widest hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} />
                Add Set
              </button>
            </div>
          </div>
        ))}

        {exercises.length === 0 && (
          <div className="text-center py-20 kinetic-card border-dashed">
            <Dumbbell className="mx-auto text-text-secondary mb-4 opacity-20" size={48} />
            <p className="text-text-secondary font-medium text-sm">Select a module to start building your session</p>
          </div>
        )}

        {exercises.length > 0 && (
          <div className="pt-8 border-t border-border flex justify-center">
            <button 
              onClick={handleSave}
              className="group relative flex items-center justify-center gap-4 bg-accent text-bg px-12 py-5 rounded-full font-black text-sm uppercase tracking-[0.2em] hover:bg-sky-300 transition-all shadow-2xl shadow-accent/20 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <Save size={20} className="relative z-10" />
              <span className="relative z-10">Finish Workout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Check({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CloudCheck({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  );
}

function AddExerciseBtn({ onClick, icon, label }: { onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center justify-center gap-2 py-2 px-4 rounded-md border border-border bg-white/5 font-bold text-[10px] uppercase tracking-widest text-text-secondary hover:border-accent hover:text-accent transition-all"
    >
      {icon}
      {label}
    </button>
  );
}

function SetInput({ label, value, onChange, suffix }: { label: string, value: number, onChange: (v: number) => void, suffix?: string }) {
  return (
    <div className="flex flex-col">
      <label className="text-[9px] font-bold uppercase text-text-secondary tracking-tighter mb-0.5">{label}</label>
      <div className="relative">
        <input 
          type="number" 
          value={value === 0 ? '' : value} 
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="bg-bg border border-border rounded-md px-2 py-1 w-20 text-xs font-mono font-bold focus:ring-1 focus:ring-accent outline-none transition-all"
        />
        {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-text-secondary pointer-events-none">{suffix}</span>}
      </div>
    </div>
  );
}

function HMSInput({ value, onChange, label, max }: { value: number, onChange: (v: number) => void, label: string, max?: number }) {
  return (
    <div className="flex flex-col items-center">
      <input 
        type="number" 
        value={value === 0 ? '0' : value} 
        onChange={(e) => {
          let v = parseInt(e.target.value) || 0;
          if (max !== undefined) v = Math.min(max, v);
          onChange(v);
        }}
        className="bg-bg border border-border rounded-md px-1 py-1 w-12 text-center text-xs font-mono font-bold focus:ring-1 focus:ring-accent outline-none transition-all"
      />
      <span className="text-[8px] font-bold text-text-secondary mt-0.5">{label}</span>
    </div>
  );
}

function secondsToHMS(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}

function hmsToSeconds(h: number, m: number, s: number) {
  return (h * 3600) + (m * 60) + s;
}

