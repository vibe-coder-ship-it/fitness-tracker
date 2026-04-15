import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Utensils, PieChart, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { Meal, NutritionLog } from '../types';
import { User } from 'firebase/auth';
import { db, auth } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  updateDoc,
  getDocs
} from 'firebase/firestore';

interface NutritionTrackerProps {
  user: User | null;
}

export default function NutritionTracker({ user }: NutritionTrackerProps) {
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [newMeal, setNewMeal] = useState<Partial<Meal>>({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  // Firestore Error Handler
  const handleFirestoreError = (error: unknown, operationType: string, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  // Load logs from Firestore
  useEffect(() => {
    if (!user) {
      setLogs([]);
      return;
    }

    const q = query(collection(db, 'nutrition'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logData: NutritionLog[] = [];
      snapshot.forEach((doc) => {
        logData.push(doc.data() as NutritionLog);
      });
      setLogs(logData);
    }, (error) => {
      handleFirestoreError(error, 'list', 'nutrition');
    });

    return () => unsubscribe();
  }, [user]);

  const today = new Date().toISOString().split('T')[0];
  const todayLog = useMemo(() => logs.find(l => l.date === today) || { date: today, meals: [] }, [logs, today]);

  const totals = useMemo(() => {
    return todayLog.meals.reduce((acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [todayLog]);

  const addMeal = async () => {
    if (!user || !newMeal.name || !newMeal.calories) return;

    const meal: Meal = {
      id: Math.random().toString(36).substr(2, 9),
      name: newMeal.name,
      calories: Number(newMeal.calories),
      protein: Number(newMeal.protein || 0),
      carbs: Number(newMeal.carbs || 0),
      fat: Number(newMeal.fat || 0),
      timestamp: new Date().toISOString()
    };

    const path = 'nutrition';
    try {
      const existingLog = logs.find(l => l.date === today);
      if (existingLog) {
        // Update existing log
        const q = query(collection(db, 'nutrition'), where('uid', '==', user.uid), where('date', '==', today));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const logDoc = querySnapshot.docs[0];
          await updateDoc(doc(db, 'nutrition', logDoc.id), {
            meals: [...existingLog.meals, meal]
          });
        }
      } else {
        // Create new log
        await addDoc(collection(db, 'nutrition'), {
          uid: user.uid,
          date: today,
          meals: [meal]
        });
      }
    } catch (error) {
      handleFirestoreError(error, 'write', path);
    }

    setNewMeal({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 });
    setShowAddMeal(false);
  };

  const removeMeal = async (id: string) => {
    if (!user) return;
    const path = 'nutrition';
    try {
      const existingLog = logs.find(l => l.date === today);
      if (existingLog) {
        const q = query(collection(db, 'nutrition'), where('uid', '==', user.uid), where('date', '==', today));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const logDoc = querySnapshot.docs[0];
          await updateDoc(doc(db, 'nutrition', logDoc.id), {
            meals: existingLog.meals.filter(m => m.id !== id)
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, 'update', path);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Daily Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard label="Calories" value={totals.calories} unit="kcal" color="text-accent" />
        <SummaryCard label="Protein" value={totals.protein} unit="g" color="text-orange-400" />
        <SummaryCard label="Carbs" value={totals.carbs} unit="g" color="text-accent-alt" />
        <SummaryCard label="Fat" value={totals.fat} unit="g" color="text-red-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Meals List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="kinetic-label">Today's Meals</h3>
            <button 
              onClick={() => setShowAddMeal(true)}
              className="text-accent hover:text-sky-300 transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-widest"
            >
              <Plus size={14} /> Add Meal
            </button>
          </div>

          <div className="space-y-3">
            {todayLog.meals.map(meal => (
              <div key={meal.id} className="kinetic-card p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="bg-accent/10 p-2 rounded-md text-accent">
                    <Utensils size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm">{meal.name}</div>
                    <div className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                      {meal.calories} kcal • P: {meal.protein}g C: {meal.carbs}g F: {meal.fat}g
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => removeMeal(meal.id)}
                  className="text-text-secondary hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {todayLog.meals.length === 0 && (
              <div className="text-center py-12 kinetic-card border-dashed opacity-50">
                <Utensils className="mx-auto mb-3" size={32} />
                <p className="text-xs font-bold uppercase tracking-widest">No meals logged today</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Meal Form / Macro Balance */}
        <div className="space-y-6">
          {showAddMeal ? (
            <div className="kinetic-card p-5 space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center justify-between">
                <h3 className="kinetic-label">New Meal</h3>
                <button onClick={() => setShowAddMeal(false)} className="text-text-secondary hover:text-text-primary">
                  <Plus size={18} className="rotate-45" />
                </button>
              </div>
              <div className="space-y-3">
                <Input label="Food Item" value={newMeal.name} onChange={v => setNewMeal({...newMeal, name: v})} placeholder="e.g. Chicken Breast" />
                <Input label="Calories" value={newMeal.calories} onChange={v => setNewMeal({...newMeal, calories: Number(v)})} type="number" />
                <div className="grid grid-cols-3 gap-2">
                  <Input label="Protein" value={newMeal.protein} onChange={v => setNewMeal({...newMeal, protein: Number(v)})} type="number" suffix="g" />
                  <Input label="Carbs" value={newMeal.carbs} onChange={v => setNewMeal({...newMeal, carbs: Number(v)})} type="number" suffix="g" />
                  <Input label="Fat" value={newMeal.fat} onChange={v => setNewMeal({...newMeal, fat: Number(v)})} type="number" suffix="g" />
                </div>
                <button 
                  onClick={addMeal}
                  className="w-full bg-accent text-bg py-2 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-sky-300 transition-all mt-2"
                >
                  Log Meal
                </button>
              </div>
            </div>
          ) : (
            <div className="kinetic-card p-5 space-y-6">
              <h3 className="kinetic-label">Macro Balance</h3>
              <div className="space-y-4">
                <MacroBar label="Protein" value={totals.protein} total={totals.protein + totals.carbs + totals.fat} color="bg-orange-400" />
                <MacroBar label="Carbs" value={totals.carbs} total={totals.protein + totals.carbs + totals.fat} color="bg-accent-alt" />
                <MacroBar label="Fat" value={totals.fat} total={totals.protein + totals.carbs + totals.fat} color="bg-red-400" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, unit, color }: { label: string, value: number, unit: string, color: string }) {
  return (
    <div className="kinetic-card p-5">
      <div className="kinetic-label mb-1">{label}</div>
      <div className={cn("text-2xl font-black", color)}>
        {value}<span className="text-xs ml-1 opacity-50">{unit}</span>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder, suffix }: { label: string, value: any, onChange: (v: string) => void, type?: string, placeholder?: string, suffix?: string }) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest mb-1">{label}</label>
      <div className="relative">
        <input 
          type={type} 
          value={value === 0 && type === 'number' ? '' : value} 
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-bg border border-border rounded-md px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-accent outline-none transition-all"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-secondary">{suffix}</span>}
      </div>
    </div>
  );
}

function MacroBar({ label, value, total, color }: { label: string, value: number, total: number, color: string }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
        <span className="text-text-secondary">{label}</span>
        <span>{value}g ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="h-1.5 bg-bg rounded-full overflow-hidden">
        <div className={cn("h-full transition-all duration-500", color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
