import React, { useState, useRef } from 'react';
import { Camera, Utensils, Dumbbell, Loader2, Sparkles, Upload, Check, AlertCircle, UserCheck, Flame } from 'lucide-react';
import { cn } from '../lib/utils';
import { estimateNutrition, identifyExercise, analyzePhysique, NutritionEstimate, ExerciseIdentification, PhysiqueAnalysis } from '../services/geminiService';

export default function AITools() {
  const [nutritionInput, setNutritionInput] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);
  const [nutritionResult, setNutritionResult] = useState<NutritionEstimate | null>(null);
  
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [exerciseResult, setExerciseResult] = useState<ExerciseIdentification | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [physiqueResult, setPhysiqueResult] = useState<PhysiqueAnalysis | null>(null);
  
  const nutritionFileRef = useRef<HTMLInputElement>(null);
  const exerciseFileRef = useRef<HTMLInputElement>(null);
  const physiqueFileRef = useRef<HTMLInputElement>(null);

  const handleNutritionTextSubmit = async () => {
    if (!nutritionInput.trim()) return;
    setIsEstimating(true);
    setNutritionResult(null);
    try {
      const result = await estimateNutrition(nutritionInput);
      setNutritionResult(result);
    } catch (error) {
      console.error('Nutrition estimation failed', error);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'nutrition' | 'exercise' | 'physique') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      const imageData = { data: base64Data, mimeType: file.type };

      if (type === 'nutrition') {
        setIsEstimating(true);
        setNutritionResult(null);
        try {
          const result = await estimateNutrition(imageData);
          setNutritionResult(result);
        } catch (error) {
          console.error('Nutrition estimation failed', error);
        } finally {
          setIsEstimating(false);
        }
      } else if (type === 'exercise') {
        setIsIdentifying(true);
        setExerciseResult(null);
        try {
          const result = await identifyExercise(imageData);
          setExerciseResult(result);
        } catch (error) {
          console.error('Exercise identification failed', error);
        } finally {
          setIsIdentifying(false);
        }
      } else if (type === 'physique') {
        setIsAnalyzing(true);
        setPhysiqueResult(null);
        try {
          const result = await analyzePhysique(imageData);
          setPhysiqueResult(result);
        } catch (error) {
          console.error('Physique analysis failed', error);
        } finally {
          setIsAnalyzing(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-3 mb-2">
        <Sparkles className="text-accent" size={24} />
        <h2 className="text-2xl font-black uppercase tracking-tighter">AI Lab</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Nutrition Estimator */}
        <div className="space-y-6">
          <div className="kinetic-card p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-accent/10 p-2 rounded-md text-accent">
                <Utensils size={20} />
              </div>
              <h3 className="kinetic-label">Nutrition Vision</h3>
            </div>
            
            <p className="text-xs text-text-secondary leading-relaxed">
              Describe your meal or upload a photo to get an instant nutritional breakdown.
            </p>

            <div className="space-y-3">
              <textarea 
                value={nutritionInput}
                onChange={(e) => setNutritionInput(e.target.value)}
                placeholder="e.g. A bowl of oatmeal with blueberries and a side of scrambled eggs..."
                className="w-full bg-bg border border-border rounded-md px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-accent outline-none transition-all min-h-[80px] resize-none"
              />
              
              <div className="flex gap-2">
                <button 
                  onClick={handleNutritionTextSubmit}
                  disabled={isEstimating || !nutritionInput.trim()}
                  className="flex-grow bg-accent text-bg py-2 rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-sky-300 disabled:opacity-30 transition-all"
                >
                  {isEstimating ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Analyze Text'}
                </button>
                <button 
                  onClick={() => nutritionFileRef.current?.click()}
                  disabled={isEstimating}
                  className="bg-surface border border-border px-4 py-2 rounded-md text-text-primary hover:border-accent transition-all"
                >
                  <Camera size={16} />
                </button>
                <input 
                  type="file" 
                  ref={nutritionFileRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload(e, 'nutrition')} 
                />
              </div>
            </div>
          </div>

          {nutritionResult && (
            <div className="kinetic-card p-6 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-accent">{nutritionResult.foodItem}</h4>
                <div className={cn(
                  "text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded",
                  nutritionResult.confidence === 'High' ? "bg-green-500/10 text-green-400" :
                  nutritionResult.confidence === 'Medium' ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"
                )}>
                  {nutritionResult.confidence} Confidence
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mb-6">
                <ResultStat label="Calories" value={nutritionResult.calories} unit="kcal" />
                <ResultStat label="Protein" value={nutritionResult.protein} unit="g" />
                <ResultStat label="Carbs" value={nutritionResult.carbs} unit="g" />
                <ResultStat label="Fat" value={nutritionResult.fat} unit="g" />
              </div>

              <div className="bg-white/5 p-3 rounded-md border border-border flex items-start gap-2">
                <AlertCircle size={14} className="text-text-secondary shrink-0 mt-0.5" />
                <p className="text-[10px] text-text-secondary italic">
                  AI estimates are approximate. Always consult professional nutrition labels when available.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Exercise Identifier */}
        <div className="space-y-6">
          <div className="kinetic-card p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-accent-alt/10 p-2 rounded-md text-accent-alt">
                <Dumbbell size={20} />
              </div>
              <h3 className="kinetic-label">Machine ID</h3>
            </div>
            
            <p className="text-xs text-text-secondary leading-relaxed">
              Not sure what a machine does? Snap a photo to identify it and see which muscles it targets.
            </p>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 hover:border-accent-alt transition-all cursor-pointer group"
                 onClick={() => exerciseFileRef.current?.click()}>
              <input 
                type="file" 
                ref={exerciseFileRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => handleImageUpload(e, 'exercise')} 
              />
              {isIdentifying ? (
                <Loader2 size={32} className="text-accent-alt animate-spin" />
              ) : (
                <>
                  <Upload size={32} className="text-text-secondary group-hover:text-accent-alt transition-colors mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Click to upload machine photo</p>
                </>
              )}
            </div>
          </div>

          {exerciseResult && (
            <div className="kinetic-card p-6 animate-in fade-in slide-in-from-top-4">
              <h4 className="font-bold text-accent-alt text-lg mb-2">{exerciseResult.exerciseName}</h4>
              
              <div className="mb-4">
                <div className="text-[9px] font-bold uppercase tracking-widest text-text-secondary mb-2">Primary Muscles</div>
                <div className="flex flex-wrap gap-2">
                  {exerciseResult.musclesWorked.map(muscle => (
                    <span key={muscle} className="bg-accent-alt/10 text-accent-alt text-[10px] font-bold px-2 py-1 rounded border border-accent-alt/20">
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">Instructions</div>
                <p className="text-xs text-text-secondary leading-relaxed bg-white/5 p-3 rounded-md border border-border">
                  {exerciseResult.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Physique Analyzer (Chad or Chud) */}
        <div className="space-y-6 lg:col-span-2">
          <div className="kinetic-card p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-orange-500/10 p-2 rounded-md text-orange-400">
                <UserCheck size={20} />
              </div>
              <h3 className="kinetic-label">Physique Architect (Chad or Chud?)</h3>
            </div>
            
            <p className="text-xs text-text-secondary leading-relaxed">
              Upload a photo of your physique. Our AI will determine if you've reached "Chad" status or if you're still in "Chud" territory. 
              Get humorous feedback and serious advice.
            </p>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-12 hover:border-orange-400 transition-all cursor-pointer group"
                 onClick={() => physiqueFileRef.current?.click()}>
              <input 
                type="file" 
                ref={physiqueFileRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => handleImageUpload(e, 'physique')} 
              />
              {isAnalyzing ? (
                <Loader2 size={48} className="text-orange-400 animate-spin" />
              ) : (
                <>
                  <Flame size={48} className="text-text-secondary group-hover:text-orange-400 transition-colors mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Upload Physique Photo for Analysis</p>
                </>
              )}
            </div>
          </div>

          {physiqueResult && (
            <div className="kinetic-card p-8 animate-in fade-in slide-in-from-top-4 border-orange-500/30">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="text-center space-y-2">
                  <div className={cn(
                    "text-6xl font-black uppercase tracking-tighter",
                    physiqueResult.rating === 'Chad' ? "text-orange-400" : "text-red-400"
                  )}>
                    {physiqueResult.rating}
                  </div>
                  <div className="text-2xl font-mono font-bold text-text-primary">
                    Score: {physiqueResult.score}/100
                  </div>
                </div>
                
                <div className="flex-grow space-y-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-2">AI Verdict</div>
                    <p className="text-sm text-text-primary font-medium italic leading-relaxed bg-white/5 p-4 rounded-md border border-border">
                      "{physiqueResult.feedback}"
                    </p>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-2">The Path Forward</div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {physiqueResult.advice}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultStat({ label, value, unit }: { label: string, value: number, unit: string }) {
  return (
    <div className="text-center p-2 bg-white/5 rounded-md border border-border">
      <div className="text-[8px] font-bold uppercase tracking-widest text-text-secondary mb-1">{label}</div>
      <div className="text-sm font-black font-mono tracking-tighter">
        {value}<span className="text-[8px] ml-0.5 opacity-50">{unit}</span>
      </div>
    </div>
  );
}
