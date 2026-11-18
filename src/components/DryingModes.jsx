import React from 'react';
import { Zap, Shirt, Package, Leaf, Moon, Check } from 'lucide-react';
import { MODES } from '../hooks/useSimulation';

const FAN_LABELS = ['OFF', 'Low', 'Medium', 'High'];

const MODE_ICONS = {
  'Quick Dry': Zap,
  'Delicate Fabrics': Shirt,
  'Heavy Laundry': Package,
  'Eco Air-Dry': Leaf,
  'Night Silent': Moon,
};

const MODE_COLORS = {
  'Quick Dry': 'from-orange-500/20 to-red-500/20 border-orange-500/30 text-orange-400',
  'Delicate Fabrics': 'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400',
  'Heavy Laundry': 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400',
  'Eco Air-Dry': 'from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-400',
  'Night Silent': 'from-violet-500/20 to-purple-500/20 border-violet-500/30 text-violet-400',
};

const MODE_DESCRIPTIONS = {
  'Quick Dry': 'Maximum airflow for fast drying.',
  'Delicate Fabrics': 'Gentle airflow for lighter fabrics.',
  'Heavy Laundry': 'Extended high-speed for thick items.',
  'Eco Air-Dry': 'Energy-saving low-speed drying.',
  'Night Silent': 'Quiet operation for nighttime use.',
};

export default function DryingModes({ selectedMode, onSelectMode, systemPower, remainingMinutes, timerRunning, toggleTimer, setTimer }) {
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Drying Modes</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(MODES).map(([name, cfg]) => {
          const Icon = MODE_ICONS[name];
          const isActive = selectedMode === name;
          const colorClass = MODE_COLORS[name];

          return (
            <button
              key={name}
              disabled={!systemPower}
              onClick={() => onSelectMode(name)}
              className={`relative text-left p-4 rounded-xl border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                isActive
                  ? `bg-gradient-to-br ${colorClass} ring-1 ring-current`
                  : 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              {isActive && (
                <div className="absolute top-3 right-3">
                  <Check size={16} className="text-current" />
                </div>
              )}
              <Icon size={24} className={isActive ? '' : 'text-slate-500'} />
              <h4 className={`mt-2 font-semibold text-sm ${isActive ? '' : 'text-slate-300'}`}>{name}</h4>
              <p className="text-xs text-slate-500 mt-1">{MODE_DESCRIPTIONS[name]}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                <span>Fan: {FAN_LABELS[cfg.fan]}</span>
                <span>•</span>
                <span>{cfg.timer} min</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Timer Control */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-5">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Timer Control</h4>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs text-slate-500 block mb-1">Duration (minutes)</label>
            <input
              type="range"
              min="0"
              max="240"
              step="5"
              value={remainingMinutes}
              onChange={(e) => setTimer(Number(e.target.value))}
              disabled={!systemPower}
              className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500 disabled:opacity-40"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>0 min</span>
              <span className="text-amber-400 font-mono">{Math.floor(remainingMinutes)} min</span>
              <span>240 min</span>
            </div>
          </div>
          <button
            onClick={toggleTimer}
            disabled={!systemPower || remainingMinutes <= 0}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              timerRunning
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            {timerRunning ? 'Pause' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  );
}
