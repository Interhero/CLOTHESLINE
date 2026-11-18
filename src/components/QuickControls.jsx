import React from 'react';
import { Power, Wind, ChevronRight, ChevronLeft, OctagonX } from 'lucide-react';

const FAN_LABELS = ['OFF', 'Low', 'Med', 'High'];

export default function QuickControls({
  state,
  togglePower,
  setFanSpeed,
  openRods,
  foldRods,
  setRodTarget,
  emergencyStopToggle,
}) {
  const { systemPower, fanSpeed, rodPositionPercent, emergencyStop } = state;

  return (
    <div className="bg-[#0d1322] rounded-2xl border border-slate-800/90 p-4 sm:p-5 shadow-xl space-y-4">
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
            Physical Hardware Control Panel
          </h3>
          <p className="text-[11px] text-slate-400">Directly maps to prototype push buttons</p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
          4 PUSH-BUTTONS
        </span>
      </div>

      {/* 4 PRIMARY BUTTONS (2x2 Tablet / Phone Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        
        {/* BUTTON 1: POWER */}
        <button
          onClick={togglePower}
          className={`min-h-[58px] sm:min-h-[64px] p-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
            systemPower
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
          }`}
        >
          <Power size={18} />
          <span>1. POWER ({systemPower ? 'ON' : 'OFF'})</span>
        </button>

        {/* BUTTON 2: FAN SPEED */}
        <button
          disabled={!systemPower}
          onClick={() => setFanSpeed((fanSpeed + 1) % 4)}
          className="min-h-[58px] sm:min-h-[64px] p-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all shadow-md active:scale-95 disabled:opacity-40"
        >
          <Wind size={18} className={fanSpeed > 0 ? 'animate-spin' : ''} style={{ animationDuration: fanSpeed === 1 ? '2s' : fanSpeed === 2 ? '0.9s' : '0.35s' }} />
          <span>2. FAN: {FAN_LABELS[fanSpeed]}</span>
        </button>

        {/* BUTTON 3: OPEN (EXTEND) */}
        <button
          disabled={!systemPower || emergencyStop}
          onClick={openRods}
          className="min-h-[58px] sm:min-h-[64px] p-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 transition-all shadow-md active:scale-95 disabled:opacity-40"
        >
          <ChevronRight size={18} />
          <span>3. OPEN (EXTEND)</span>
        </button>

        {/* BUTTON 4: FOLD (RETRACT) */}
        <button
          disabled={!systemPower || emergencyStop}
          onClick={foldRods}
          className="min-h-[58px] sm:min-h-[64px] p-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 transition-all shadow-md active:scale-95 disabled:opacity-40"
        >
          <ChevronLeft size={18} />
          <span>4. FOLD (RETRACT)</span>
        </button>

      </div>

      {/* Manual Slider & Quick Presets */}
      <div className="bg-slate-950/70 p-3 sm:p-4 rounded-xl border border-slate-800/80 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-300 font-medium">Fine Extension Control:</span>
          <span className="font-mono text-cyan-400 font-bold text-sm bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
            {Math.round(rodPositionPercent)}% ({(rodPositionPercent * 0.4).toFixed(1)} cm)
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={rodPositionPercent}
          onChange={(e) => setRodTarget(Number(e.target.value))}
          disabled={!systemPower || emergencyStop}
          className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg disabled:opacity-40"
        />

        {/* Quick Touch Preset Buttons */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <button
            onClick={() => setRodTarget(0)}
            disabled={!systemPower || emergencyStop}
            className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition disabled:opacity-40"
          >
            Fold 0%
          </button>
          <button
            onClick={() => setRodTarget(25)}
            disabled={!systemPower || emergencyStop}
            className="py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition disabled:opacity-40"
          >
            Shelter 25%
          </button>
          <button
            onClick={() => setRodTarget(50)}
            disabled={!systemPower || emergencyStop}
            className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition disabled:opacity-40"
          >
            Half 50%
          </button>
          <button
            onClick={() => setRodTarget(100)}
            disabled={!systemPower || emergencyStop}
            className="py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition disabled:opacity-40"
          >
            Full 100%
          </button>
        </div>
      </div>

    </div>
  );
}
