/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History as HistoryIcon, 
  Dumbbell, 
  Timer, 
  Heart, 
  Zap,
  ChevronRight,
  Trash2,
  Calendar,
  Clock,
  Utensils,
  BookOpen,
  Sparkles,
  Sun,
  Moon,
  LogIn,
  LogOut,
  User as UserIcon,
  Download,
  Calculator,
  Map,
  X
} from 'lucide-react';
import { cn } from './lib/utils';
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
} from './types';
import Dashboard from './components/Dashboard';
import WorkoutLogger from './components/WorkoutLogger';
import WorkoutHistory from './components/WorkoutHistory';
import NutritionTracker from './components/NutritionTracker';
import WorkoutPlans from './components/WorkoutPlans';
import AITools from './components/AITools';
import PlateCalculator from './components/PlateCalculator';
import MuscleRecoveryMap from './components/MuscleRecoveryMap';

// Firebase imports
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  orderBy,
  getDocFromServer
} from 'firebase/firestore';

type Tab = 'dashboard' | 'logger' | 'history' | 'nutrition' | 'plans' | 'ai' | 'plates' | 'recovery';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [unit, setUnit] = useState<WeightUnit>('lbs');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const ALLOWED_EMAIL = 'alangoonbs893@gmail.com';
  const isAuthorized = useMemo(() => user?.email === ALLOWED_EMAIL, [user]);

  // Firestore Error Handler
  const handleFirestoreError = (error: unknown, operationType: string, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  // Test connection to Firestore
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser && currentUser.email === ALLOWED_EMAIL) {
        // Sync user profile
        setDoc(doc(db, 'users', currentUser.uid), {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          createdAt: new Date().toISOString()
        }, { merge: true });
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Workouts Listener
  useEffect(() => {
    if (!user) {
      setWorkouts([]);
      return;
    }

    const q = query(
      collection(db, 'workouts'), 
      where('uid', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const workoutData: Workout[] = [];
      snapshot.forEach((doc) => {
        workoutData.push({ id: doc.id, ...doc.data() } as Workout);
      });
      setWorkouts(workoutData);
    }, (error) => {
      console.error("Firestore Error (workouts):", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('kinetic-theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.add('light');
    }
  }, []);

  const handleLogin = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthError("Login cancelled. Please keep the popup window open to sign in.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        setAuthError("Only one login popup can be open at a time.");
      } else if (error.code === 'auth/popup-blocked') {
        setAuthError("Login popup was blocked by your browser. Please enable popups for this site.");
      } else {
        setAuthError("An error occurred during login. Please try again.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newVal = !prev;
      if (newVal) {
        document.documentElement.classList.remove('light');
        localStorage.setItem('kinetic-theme', 'dark');
      } else {
        document.documentElement.classList.add('light');
        localStorage.setItem('kinetic-theme', 'light');
      }
      return newVal;
    });
  };

  const addWorkout = async (workout: Workout) => {
    if (!user) return;
    const path = 'workouts';
    try {
      const { id, ...workoutData } = workout;
      await addDoc(collection(db, path), {
        ...workoutData,
        uid: user.uid
      });
      setActiveTab('history');
    } catch (error) {
      handleFirestoreError(error, 'create', path);
    }
  };

  const deleteWorkout = async (id: string) => {
    if (!user) return;
    const path = `workouts/${id}`;
    try {
      await deleteDoc(doc(db, 'workouts', id));
    } catch (error) {
      handleFirestoreError(error, 'delete', path);
    }
  };

  const exportToCSV = () => {
    if (workouts.length === 0) return;

    const headers = ['Date', 'Exercise', 'Category', 'Sets'];
    const rows = workouts.flatMap(w => 
      w.exercises.map(ex => [
        new Date(w.date).toLocaleDateString(),
        ex.name,
        ex.category,
        ex.sets.length
      ])
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kinetic_workouts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleUnit = () => {
    setUnit(prev => prev === 'lbs' ? 'kg' : 'lbs');
  };

  const totalVolume = useMemo(() => {
    return workouts.reduce((acc, w) => {
      return acc + w.exercises.reduce((exAcc, ex) => {
        if (ex.category === 'resistance') {
          return exAcc + ex.sets.reduce((sAcc, s) => {
            const set = s as ResistanceSet;
            let weight = set.weight;
            // Normalize to current unit for total volume display
            if (w.unit !== unit) {
              weight = w.unit === 'lbs' ? weight / 2.20462 : weight * 2.20462;
            }
            return sAcc + (weight * set.reps);
          }, 0);
        }
        return exAcc;
      }, 0);
    }, 0);
  }, [workouts, unit]);

  // Main Content Check
  const renderContent = () => {
    if (!isAuthReady) return null;
    
    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
          <div className="bg-surface p-12 rounded-2xl border border-border kinetic-card max-w-md w-full">
            <div className="bg-accent/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-accent">
              <Dumbbell size={40} />
            </div>
            <h1 className="text-2xl font-black mb-3 italic tracking-tight uppercase">System Restricted</h1>
            <p className="text-text-secondary text-sm mb-8 leading-relaxed">
              Kinetic Architecture is a private performance environment. Authentication required for access.
            </p>
            <button 
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-2 bg-accent text-bg px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-sky-300 transition-all shadow-xl shadow-accent/20"
            >
              <LogIn size={20} />
              Begin Protocol
            </button>
            {authError && (
              <p className="mt-4 text-[10px] text-red-400 font-bold uppercase tracking-widest animate-pulse">
                {authError}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (!isAuthorized) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
          <div className="bg-red-500/10 p-12 rounded-2xl border border-red-500/20 kinetic-card max-w-md w-full">
            <div className="bg-red-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-400">
              <X size={40} />
            </div>
            <h1 className="text-2xl font-black mb-3 italic tracking-tight uppercase text-red-400">Unauthorized Access</h1>
            <p className="text-text-secondary text-sm mb-8 leading-relaxed">
              This environment is strictly locked to specific administrative credentials. Access denied for <strong>{user.email}</strong>.
            </p>
            <button 
              onClick={handleLogout}
              className="w-full bg-surface border border-border text-text-secondary px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:border-red-400 hover:text-red-400 transition-all"
            >
              Terminate Session
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'dashboard' && <Dashboard workouts={workouts} unit={unit} />}
        {activeTab === 'logger' && <WorkoutLogger onSave={addWorkout} defaultUnit={unit} user={user} />}
        {activeTab === 'history' && <WorkoutHistory workouts={workouts} onDelete={deleteWorkout} unit={unit} />}
        {activeTab === 'nutrition' && <NutritionTracker user={user} />}
        {activeTab === 'plans' && <WorkoutPlans />}
        {activeTab === 'ai' && <AITools />}
        {activeTab === 'plates' && <PlateCalculator unit={unit} />}
        {activeTab === 'recovery' && <MuscleRecoveryMap workouts={workouts} />}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary font-sans flex flex-col">
      {/* Header */}
      <header className="h-[70px] kinetic-header flex items-center justify-between px-6 shrink-0 z-50">
        <div className="font-mono font-extrabold text-xl tracking-tighter flex items-center gap-2">
          KINETIC<span className="text-accent">ARCHITECTURE</span>
        </div>
        
        <div className="flex gap-4 md:gap-8 items-center">
          {authError && (
            <div className="hidden lg:block bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-3 py-1 rounded-md animate-in fade-in zoom-in">
              {authError}
            </div>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Logged in as</span>
                <span className="text-xs font-bold">{user.displayName || user.email}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-md hover:bg-white/5 transition-all text-text-secondary hover:text-red-400"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 bg-accent text-bg px-4 py-2 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-sky-300 transition-all"
            >
              <LogIn size={16} />
              Login
            </button>
          )}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-white/5 transition-all text-text-secondary hover:text-accent"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button 
            onClick={toggleUnit}
            className="bg-surface border border-border px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest hover:border-accent transition-all"
          >
            Unit: {unit}
          </button>
          <div className="text-right hidden sm:block">
            <div className="kinetic-label">Total Volume ({unit})</div>
            <div className="text-lg font-bold">{Math.round(totalVolume).toLocaleString()}</div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="kinetic-label">Sessions</div>
            <div className="text-lg font-bold">{workouts.length}</div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[240px] kinetic-sidebar hidden md:flex flex-col p-5 gap-8 shrink-0">
          <nav>
            <ul className="space-y-1">
              <SidebarItem 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')} 
                label="Dashboard" 
                icon={<LayoutDashboard size={16} />}
              />
              <SidebarItem 
                active={activeTab === 'logger'} 
                onClick={() => setActiveTab('logger')} 
                label="New Workout" 
                icon={<PlusCircle size={16} />}
              />
              <SidebarItem 
                active={activeTab === 'history'} 
                onClick={() => setActiveTab('history')} 
                label="History" 
                icon={<HistoryIcon size={16} />}
              />
              <SidebarItem 
                active={activeTab === 'nutrition'} 
                onClick={() => setActiveTab('nutrition')} 
                label="Nutrition" 
                icon={<Utensils size={16} />}
              />
              <SidebarItem 
                active={activeTab === 'plans'} 
                onClick={() => setActiveTab('plans')} 
                label="Workout Plans" 
                icon={<BookOpen size={16} />}
              />
              <SidebarItem 
                active={activeTab === 'ai'} 
                onClick={() => setActiveTab('ai')} 
                label="AI Lab" 
                icon={<Sparkles size={16} />}
              />
              <div className="h-px bg-border my-4" />
              <SidebarItem 
                active={activeTab === 'plates'} 
                onClick={() => setActiveTab('plates')} 
                label="Plate Calculator" 
                icon={<Calculator size={16} />}
              />
              <SidebarItem 
                active={activeTab === 'recovery'} 
                onClick={() => setActiveTab('recovery')} 
                label="Recovery Map" 
                icon={<Map size={16} />}
              />
              <button 
                onClick={exportToCSV}
                className="w-full mt-4 px-3 py-2 rounded-md text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all flex items-center gap-3"
              >
                <Download size={16} />
                Export CSV
              </button>
            </ul>
          </nav>

          <div>
            <div className="kinetic-label mb-3">Recent Sessions</div>
            <div className="space-y-2">
              {workouts.slice(0, 4).map(w => (
                <div key={w.id} className="flex justify-between text-xs border-b border-border pb-2 last:border-0">
                  <span className="text-text-secondary truncate pr-2">{new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span className="kinetic-accent-text">{w.exercises.length} Exercises</span>
                </div>
              ))}
              {workouts.length === 0 && <div className="text-xs text-text-secondary italic">No sessions yet</div>}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border px-4 py-3 flex justify-around items-center z-50">
        <NavButton 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')}
          icon={<LayoutDashboard size={20} />}
          label="Dash"
        />
        <NavButton 
          active={activeTab === 'logger'} 
          onClick={() => setActiveTab('logger')}
          icon={<PlusCircle size={20} />}
          label="Log"
        />
        <NavButton 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')}
          icon={<HistoryIcon size={20} />}
          label="Hist"
        />
        <NavButton 
          active={activeTab === 'nutrition'} 
          onClick={() => setActiveTab('nutrition')}
          icon={<Utensils size={20} />}
          label="Nutr"
        />
        <NavButton 
          active={activeTab === 'ai'} 
          onClick={() => setActiveTab('ai')}
          icon={<Sparkles size={20} />}
          label="AI"
        />
      </nav>
    </div>
  );
}

function SidebarItem({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <li 
      onClick={onClick}
      className={cn(
        "px-3 py-2 rounded-md text-sm cursor-pointer transition-all flex items-center gap-3",
        active ? "bg-accent/10 text-accent font-semibold" : "text-text-secondary hover:text-text-primary hover:bg-white/5"
      )}
    >
      {icon}
      {label}
    </li>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 transition-all duration-200",
        active ? "text-accent" : "text-text-secondary"
      )}
    >
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}


