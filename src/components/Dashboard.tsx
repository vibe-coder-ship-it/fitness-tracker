import React, { useMemo, useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  Award, 
  Target, 
  ChevronRight,
  Dumbbell,
  Utensils,
  Clock,
  Trophy,
  Flame,
  Zap
} from 'lucide-react';
import { Workout, ExerciseCategory, ResistanceSet, CalisthenicsSet, IsometricSet, CardioSet, WeightUnit, NutritionLog } from '../types';
import { cn, formatDate, formatHMS } from '../lib/utils';

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  category?: ExerciseCategory;
  unit: WeightUnit;
}

const CustomTooltip = ({ active, payload, label, category, unit }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border p-3 rounded-md shadow-2xl">
        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex flex-col mb-1 last:mb-0">
            <span className="text-[9px] font-bold text-text-secondary uppercase">{entry.name}</span>
            <span className="text-sm font-black text-text-primary">
              {category === 'isometrics' ? (
                formatHMS(entry.value)
              ) : (
                `${entry.value} ${entry.name.includes('Volume') ? unit : unit}`
              )}
              {category === 'calisthenics' && entry.name.includes('Best') && ' reps'}
              {category === 'cardio' && ' min'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface DashboardProps {
  workouts: Workout[];
  unit: WeightUnit;
}

export default function Dashboard({ workouts, unit }: DashboardProps) {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('iron-ledger-nutrition');
    if (saved) {
      try {
        setNutritionLogs(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Process data for the dashboard
  const stats = useMemo(() => {
    const totalWorkouts = workouts.length;
    const totalDuration = workouts.reduce((acc, w) => acc + w.duration, 0);
    const totalExercises = workouts.reduce((acc, w) => acc + w.exercises.length, 0);
    
    // Extract unique exercises and their history
    const exerciseHistory: Record<string, { name: string, category: ExerciseCategory, data: any[] }> = {};
    
    workouts.slice().reverse().forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (!exercise.name) return;
        
        if (!exerciseHistory[exercise.name]) {
          exerciseHistory[exercise.name] = { 
            name: exercise.name, 
            category: exercise.category, 
            data: [] 
          };
        }

        let bestValue = 0;
        let volume = 0;

        switch (exercise.category) {
          case 'resistance':
            exercise.sets.forEach(s => {
              const set = s as ResistanceSet;
              let weight = set.weight;
              if (workout.unit !== unit) {
                weight = workout.unit === 'lbs' ? weight / 2.20462 : weight * 2.20462;
              }
              bestValue = Math.max(bestValue, weight);
              volume += weight * set.reps;
            });
            break;
          case 'calisthenics':
            exercise.sets.forEach(s => {
              const set = s as CalisthenicsSet;
              bestValue = Math.max(bestValue, set.reps);
              volume += set.reps;
            });
            break;
          case 'isometrics':
            exercise.sets.forEach(s => {
              const set = s as IsometricSet;
              bestValue = Math.max(bestValue, set.timeUnderTension);
              volume += set.timeUnderTension;
            });
            break;
          case 'cardio':
            exercise.sets.forEach(s => {
              const set = s as CardioSet;
              bestValue = Math.max(bestValue, set.intensityTime);
              volume += set.totalTime;
            });
            break;
        }

        exerciseHistory[exercise.name].data.push({
          date: formatDate(workout.date),
          rawDate: workout.date,
          value: Math.round(bestValue * 10) / 10,
          volume: Math.round(volume)
        });
      });
    });

    return {
      totalWorkouts,
      totalDuration,
      totalExercises,
      exerciseHistory: Object.values(exerciseHistory)
    };
  }, [workouts, unit]);

  const activeExerciseData = useMemo(() => {
    if (!selectedExercise) return stats.exerciseHistory[0]?.data || [];
    return stats.exerciseHistory.find(e => e.name === selectedExercise)?.data || [];
  }, [selectedExercise, stats.exerciseHistory]);

  const activeExerciseInfo = useMemo(() => {
    if (!selectedExercise) return stats.exerciseHistory[0];
    return stats.exerciseHistory.find(e => e.name === selectedExercise);
  }, [selectedExercise, stats.exerciseHistory]);

  const progressionPrediction = useMemo(() => {
    if (!activeExerciseData || activeExerciseData.length < 3) return null;
    
    // Simple linear regression for volume
    const n = activeExerciseData.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = activeExerciseData.map(d => d.volume);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
    const sumXX = x.reduce((a, b) => a + b * b, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const nextVolume = y[n - 1] + slope;
    
    // Predict best set based on volume trend
    const valueY = activeExerciseData.map(d => d.value);
    const sumValueY = valueY.reduce((a, b) => a + b, 0);
    const sumValueXY = x.reduce((a, b, i) => a + b * valueY[i], 0);
    const valueSlope = (n * sumValueXY - sumX * sumValueY) / (n * sumXX - sumX * sumX);
    const nextValue = valueY[n - 1] + valueSlope;

    return {
      nextVolume: Math.round(nextVolume),
      nextValue: Math.round(nextValue * 10) / 10,
      trend: slope > 0 ? 'up' : 'down'
    };
  }, [activeExerciseData]);

  const today = new Date().toISOString().split('T')[0];
  const todayNutrition = nutritionLogs.find(l => l.date === today);
  const nutritionTotals = useMemo(() => {
    if (!todayNutrition) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return todayNutrition.meals.reduce((acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [todayNutrition]);

  const nutritionChartData = useMemo(() => {
    return nutritionLogs.slice(-7).map(log => {
      const totals = log.meals.reduce((acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      
      return {
        date: formatDate(log.date),
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat
      };
    });
  }, [nutritionLogs]);

  if (workouts.length === 0 && nutritionLogs.length === 0) {
    return (
      <div className="text-center py-20 kinetic-card border-dashed">
        <Activity className="mx-auto text-text-secondary mb-4 opacity-20" size={48} />
        <p className="text-text-secondary font-medium">Log your first workout or meal to see your dashboard!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Trophy size={18} className="text-accent" />} label="Workouts" value={stats.totalWorkouts} />
        <StatCard icon={<Clock size={18} className="text-accent-alt" />} label="Minutes" value={stats.totalDuration} />
        <StatCard icon={<Award size={18} className="text-orange-400" />} label="Exercises" value={stats.totalExercises} />
        <StatCard icon={<Target size={18} className="text-red-400" />} label="Avg/Session" value={(stats.totalExercises / (stats.totalWorkouts || 1)).toFixed(1)} />
      </div>

      {/* Nutrition Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Flame size={18} className="text-orange-500" />} label="Today's Calories" value={nutritionTotals.calories} unit="kcal" />
        <StatCard icon={<Zap size={18} className="text-blue-400" />} label="Today's Protein" value={nutritionTotals.protein} unit="g" />
        <StatCard icon={<Utensils size={18} className="text-purple-400" />} label="Today's Carbs" value={nutritionTotals.carbs} unit="g" />
        <StatCard icon={<Activity size={18} className="text-green-400" />} label="Today's Fat" value={nutritionTotals.fat} unit="g" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Chart */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="kinetic-label">Exercise Progress</h3>
              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                Showing: {activeExerciseInfo?.name || 'None'}
              </div>
            </div>

            <div className="kinetic-card p-6 h-[350px]">
              {activeExerciseData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeExerciseData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }}
                    />
                    <Tooltip 
                      content={<CustomTooltip category={activeExerciseInfo?.category} unit={unit} />}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="volume" 
                      stroke="#38BDF8" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      name={`Volume (${unit})`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#818CF8" 
                      strokeWidth={2}
                      fill="transparent"
                      name={`Best Set (${unit})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-text-secondary opacity-50">
                  <TrendingUp size={48} className="mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">More workout data needed</p>
                </div>
              )}
            </div>

            {progressionPrediction && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="kinetic-card p-4 border-accent/20 bg-accent/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="kinetic-label text-accent">Predicted Next Volume</div>
                    <TrendingUp size={14} className={cn(progressionPrediction.trend === 'up' ? "text-green-400" : "text-red-400")} />
                  </div>
                  <div className="text-2xl font-black font-mono">{progressionPrediction.nextVolume} <span className="text-xs opacity-50">{unit}</span></div>
                  <div className="text-[9px] text-text-secondary uppercase font-bold mt-1">Based on current trajectory</div>
                </div>
                <div className="kinetic-card p-4 border-accent-alt/20 bg-accent-alt/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="kinetic-label text-accent-alt">Predicted Best Set</div>
                    <Award size={14} className="text-accent-alt" />
                  </div>
                  <div className="text-2xl font-black font-mono">{progressionPrediction.nextValue} <span className="text-xs opacity-50">{unit}</span></div>
                  <div className="text-[9px] text-text-secondary uppercase font-bold mt-1">Target for next session</div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="kinetic-label">Nutrition Trends (Last 7 Days)</h3>
            </div>

            <div className="kinetic-card p-6 h-[350px]">
              {nutritionChartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={nutritionChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }}
                      dy={10}
                    />
                    <YAxis 
                      yAxisId="left"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }}
                    />
                    <Tooltip 
                      content={<CustomTooltip unit={unit} />}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="calories" 
                      stroke="#38BDF8" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#38BDF8' }}
                      name="Calories"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="protein" 
                      stroke="#F97316" 
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#F97316' }}
                      name="Protein (g)"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="carbs" 
                      stroke="#818CF8" 
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#818CF8' }}
                      name="Carbs (g)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-text-secondary opacity-50">
                  <Utensils size={48} className="mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">More nutrition data needed</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Nutrition Summary */}
          <div className="kinetic-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="kinetic-label">Today's Nutrition</h3>
              <Utensils size={16} className="text-accent" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Calories</div>
                <div className="text-xl font-black text-accent">{nutritionTotals.calories}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Protein</div>
                <div className="text-xl font-black text-orange-400">{nutritionTotals.protein}g</div>
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-text-secondary mb-1">
                <span>Macro Balance</span>
                <span>{nutritionTotals.carbs}C / {nutritionTotals.fat}F</span>
              </div>
              <div className="flex h-1.5 rounded-full overflow-hidden bg-bg">
                <div className="bg-orange-400 h-full" style={{ width: `${(nutritionTotals.protein / (nutritionTotals.protein + nutritionTotals.carbs + nutritionTotals.fat || 1)) * 100}%` }} />
                <div className="bg-accent-alt h-full" style={{ width: `${(nutritionTotals.carbs / (nutritionTotals.protein + nutritionTotals.carbs + nutritionTotals.fat || 1)) * 100}%` }} />
                <div className="bg-red-400 h-full" style={{ width: `${(nutritionTotals.fat / (nutritionTotals.protein + nutritionTotals.carbs + nutritionTotals.fat || 1)) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Exercise List */}
          <div className="space-y-4">
            <h3 className="kinetic-label px-2">Exercise Library</h3>
            <div className="kinetic-card max-h-[300px] overflow-y-auto">
              {stats.exerciseHistory.map((ex) => (
                <button
                  key={ex.name}
                  onClick={() => setSelectedExercise(ex.name)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 border-b border-border transition-all hover:bg-white/5 text-left",
                    (selectedExercise === ex.name || (!selectedExercise && stats.exerciseHistory[0]?.name === ex.name)) && "bg-accent/10 border-l-4 border-l-accent"
                  )}
                >
                  <div className="flex-grow">
                    <div className={cn(
                      "font-bold text-sm",
                      (selectedExercise === ex.name || (!selectedExercise && stats.exerciseHistory[0]?.name === ex.name)) ? "text-accent" : "text-text-primary"
                    )}>{ex.name}</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">
                      {ex.category} • {ex.data.length} sessions
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-text-secondary" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, unit }: { icon: React.ReactNode, label: string, value: string | number, unit?: string }) {
  return (
    <div className="kinetic-card p-5">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <div className="kinetic-label">{label}</div>
      </div>
      <div className="text-2xl font-black text-text-primary font-mono tracking-tighter">
        {value}
        {unit && <span className="text-xs ml-1 opacity-50">{unit}</span>}
      </div>
    </div>
  );
}

