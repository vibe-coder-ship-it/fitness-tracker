import React, { useState } from 'react';
import { WORKOUT_PLANS } from '../constants';
import { Dumbbell, Zap, Timer, Heart, ChevronRight, Sparkles, Loader2, Target, User, Briefcase, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { generateWorkoutPlan, GeneratedWorkoutPlan } from '../services/geminiService';

export default function WorkoutPlans() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPlan, setCustomPlan] = useState<GeneratedWorkoutPlan | null>(null);
  const [formData, setFormData] = useState({
    goals: '',
    bodyComposition: '',
    lifestyle: '',
    experience: 'Intermediate',
    daysPerWeek: 3
  });

  const handleGenerate = async () => {
    if (!formData.goals || !formData.lifestyle) return;
    setIsGenerating(true);
    try {
      const plan = await generateWorkoutPlan(formData);
      setCustomPlan(plan);
    } catch (error) {
      console.error('Failed to generate plan', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-20">
      {/* AI Generator Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <Sparkles className="text-accent" size={24} />
          <h2 className="text-2xl font-black uppercase tracking-tighter">AI Plan Architect</h2>
        </div>

        <div className="kinetic-card p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="kinetic-label flex items-center gap-2">
                  <Target size={14} /> Primary Goals
                </label>
                <textarea 
                  value={formData.goals}
                  onChange={(e) => setFormData({...formData, goals: e.target.value})}
                  placeholder="e.g. Build muscle, lose fat, increase endurance..."
                  className="w-full bg-bg border border-border rounded-md px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-accent outline-none transition-all min-h-[80px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="kinetic-label flex items-center gap-2">
                  <User size={14} /> Body Composition
                </label>
                <input 
                  type="text"
                  value={formData.bodyComposition}
                  onChange={(e) => setFormData({...formData, bodyComposition: e.target.value})}
                  placeholder="e.g. 180lbs, 20% body fat, athletic build..."
                  className="w-full bg-bg border border-border rounded-md px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-accent outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="kinetic-label flex items-center gap-2">
                  <Briefcase size={14} /> Lifestyle & Constraints
                </label>
                <textarea 
                  value={formData.lifestyle}
                  onChange={(e) => setFormData({...formData, lifestyle: e.target.value})}
                  placeholder="e.g. Sedentary office job, limited equipment at home, 45 mins per session..."
                  className="w-full bg-bg border border-border rounded-md px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-accent outline-none transition-all min-h-[80px] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="kinetic-label flex items-center gap-2">
                    <Calendar size={14} /> Days/Week
                  </label>
                  <select 
                    value={formData.daysPerWeek}
                    onChange={(e) => setFormData({...formData, daysPerWeek: parseInt(e.target.value)})}
                    className="w-full bg-bg border border-border rounded-md px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-accent outline-none transition-all"
                  >
                    {[1,2,3,4,5,6,7].map(d => <option key={d} value={d}>{d} Days</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="kinetic-label">Experience</label>
                  <select 
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    className="w-full bg-bg border border-border rounded-md px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-accent outline-none transition-all"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !formData.goals || !formData.lifestyle}
            className="w-full bg-accent text-bg py-3 rounded-md font-black text-xs uppercase tracking-[0.2em] hover:bg-sky-300 disabled:opacity-30 transition-all flex items-center justify-center gap-3"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Architecting Your Plan...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Custom AI Plan
              </>
            )}
          </button>
        </div>

        {customPlan && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="kinetic-card border-accent ring-1 ring-accent/20">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-text-primary">{customPlan.name}</h3>
                  <div className="bg-accent/10 text-accent px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border border-accent/20">
                    AI Generated
                  </div>
                </div>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                  {customPlan.description}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customPlan.exercises.map((ex, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-md border border-border">
                      <div className="text-accent">
                        {ex.category === 'resistance' && <Dumbbell size={14} />}
                        {ex.category === 'calisthenics' && <Zap size={14} />}
                        {ex.category === 'isometrics' && <Timer size={14} />}
                        {ex.category === 'cardio' && <Heart size={14} />}
                      </div>
                      <div className="flex-grow">
                        <div className="text-xs font-bold text-text-primary">{ex.name}</div>
                        <div className="text-[9px] text-text-secondary uppercase font-bold tracking-wider">
                          {ex.sets} sets • {ex.reps || ex.duration || '—'} {ex.intensity && `• ${ex.intensity}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Curated Plans Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <Dumbbell className="text-text-secondary" size={24} />
          <h2 className="text-2xl font-black uppercase tracking-tighter">Curated Blueprints</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {WORKOUT_PLANS.map((plan) => (
            <div key={plan.id} className="kinetic-card group hover:border-accent transition-all flex flex-col">
              <div className="p-6 flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-text-primary">{plan.name}</h3>
                  <div className="bg-accent/10 text-accent px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
                    Intermediate
                  </div>
                </div>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                  {plan.description}
                </p>
                
                <div className="space-y-3">
                  {plan.exercises.map((ex, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-md border border-border group-hover:bg-white/10 transition-all">
                      <div className="text-accent">
                        {ex.category === 'resistance' && <Dumbbell size={14} />}
                        {ex.category === 'calisthenics' && <Zap size={14} />}
                        {ex.category === 'isometrics' && <Timer size={14} />}
                        {ex.category === 'cardio' && <Heart size={14} />}
                      </div>
                      <div className="flex-grow">
                        <div className="text-xs font-bold text-text-primary">{ex.name}</div>
                        <div className="text-[9px] text-text-secondary uppercase font-bold tracking-wider">
                          {ex.sets} sets • {ex.reps} • {ex.intensity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-white/5 border-t border-border flex justify-end">
                <button className="text-accent text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                  Start Plan <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
