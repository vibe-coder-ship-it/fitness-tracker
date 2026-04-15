import React, { useState, useMemo } from 'react';
import { WeightUnit } from '../types';
import { Dumbbell, RotateCcw } from 'lucide-react';

interface PlateCalculatorProps {
  unit: WeightUnit;
}

export default function PlateCalculator({ unit }: PlateCalculatorProps) {
  const [targetWeight, setTargetWeight] = useState<number>(135);
  const [barWeight, setBarWeight] = useState<number>(45);

  const LBS_PLATES = [45, 35, 25, 10, 5, 2.5];
  const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

  const plates = unit === 'lbs' ? LBS_PLATES : KG_PLATES;

  const calculation = useMemo(() => {
    let remaining = (targetWeight - barWeight) / 2;
    if (remaining <= 0) return [];

    const result: number[] = [];
    plates.forEach(plate => {
      const count = Math.floor(remaining / plate);
      for (let i = 0; i < count; i++) {
        result.push(plate);
        remaining -= plate;
      }
    });

    return result;
  }, [targetWeight, barWeight, plates]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="kinetic-card p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Dumbbell className="text-accent" size={24} />
          <h2 className="text-xl font-black font-mono tracking-tighter uppercase">Plate Calculator</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="kinetic-label">Target Weight ({unit})</label>
            <input 
              type="number" 
              value={targetWeight} 
              onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
              className="w-full bg-bg border border-border rounded-md px-4 py-3 font-mono font-bold focus:ring-1 focus:ring-accent outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="kinetic-label">Bar Weight ({unit})</label>
            <input 
              type="number" 
              value={barWeight} 
              onChange={(e) => setBarWeight(parseFloat(e.target.value) || 0)}
              className="w-full bg-bg border border-border rounded-md px-4 py-3 font-mono font-bold focus:ring-1 focus:ring-accent outline-none"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-border">
          <div className="kinetic-label mb-4">Plates per side</div>
          {calculation.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {calculation.map((p, i) => (
                <div 
                  key={i} 
                  className="bg-accent text-bg font-black font-mono w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-accent/20 animate-in zoom-in duration-300"
                  style={{ transform: `scale(${0.7 + (p / Math.max(...plates)) * 0.3})` }}
                >
                  {p}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-text-secondary italic text-sm">No plates needed or target below bar weight.</div>
          )}
        </div>

        <button 
          onClick={() => { setTargetWeight(unit === 'lbs' ? 135 : 60); setBarWeight(unit === 'lbs' ? 45 : 20); }}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-accent transition-all"
        >
          <RotateCcw size={12} />
          Reset to Standard
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[135, 225, 315, 405].map(w => (
          <button 
            key={w}
            onClick={() => setTargetWeight(unit === 'lbs' ? w : Math.round(w / 2.20462))}
            className="kinetic-card p-4 hover:border-accent transition-all text-center"
          >
            <div className="text-xs font-bold text-text-secondary mb-1">{w === 135 ? '1 Plate' : w === 225 ? '2 Plates' : w === 315 ? '3 Plates' : '4 Plates'}</div>
            <div className="text-lg font-black font-mono">{unit === 'lbs' ? w : Math.round(w / 2.20462)} {unit}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
