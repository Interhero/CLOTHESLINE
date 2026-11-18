import React from 'react';
import {
  CloudRain, Sun, AlertTriangle, Weight, Thermometer, Droplets, RotateCcw, Beaker
} from 'lucide-react';

export default function DemoControls({
  state,
  simulateRain,
  simulateObstacle,
  simulateOverload,
  setTemperature,
  setHumidity,
  resetDemo,
  toggleAutoRain,
}) {
  const { rainDetected, obstacleDetected, laundryLoadKg, temperatureC, humidityPercent, autoRainProtection, shelteredPositionPercent } = state;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Beaker size={16} className="text-purple-400" />
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Demo / Simulation Controls</h3>
      </div>
      <p className="text-xs text-slate-600 -mt-3">Use these to trigger simulated events for demonstration purposes.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Rain Toggle */}
        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <CloudRain size={16} className="text-blue-400" />
            Rain Simulation
          </h4>
          <div className="flex gap-2">
            <button
              onClick={() => simulateRain(true)}
              disabled={rainDetected}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                rainDetected
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  : 'bg-slate-700 text-slate-400 hover:bg-blue-500/15 hover:text-blue-400 border border-transparent'
              } disabled:opacity-60`}
            >
              🌧 Rain
            </button>
            <button
              onClick={() => simulateRain(false)}
              disabled={!rainDetected}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                !rainDetected
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-700 text-slate-400 hover:bg-amber-500/15 hover:text-amber-400 border border-transparent'
              } disabled:opacity-60`}
            >
              ☀ Dry
            </button>
          </div>
          {/* Auto rain protection toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Auto Rain Protection</span>
            <button
              onClick={toggleAutoRain}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                autoRainProtection ? 'bg-blue-500' : 'bg-slate-600'
              }`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                autoRainProtection ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          <p className="text-[11px] text-slate-600">Sheltered position: {shelteredPositionPercent}%</p>
        </div>

        {/* Obstacle Toggle */}
        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400" />
            Obstacle Simulation
          </h4>
          <div className="flex gap-2">
            <button
              onClick={() => simulateObstacle(true)}
              disabled={obstacleDetected}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                obstacleDetected
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-slate-700 text-slate-400 hover:bg-red-500/15 hover:text-red-400 border border-transparent'
              } disabled:opacity-60`}
            >
              ⚠ Block
            </button>
            <button
              onClick={() => simulateObstacle(false)}
              disabled={!obstacleDetected}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                !obstacleDetected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-700 text-slate-400 hover:bg-emerald-500/15 hover:text-emerald-400 border border-transparent'
              } disabled:opacity-60`}
            >
              ✓ Clear
            </button>
          </div>
        </div>

        {/* Load slider */}
        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Weight size={16} className="text-purple-400" />
            Laundry Load
          </h4>
          <input
            type="range"
            min="0"
            max="6"
            step="0.1"
            value={laundryLoadKg}
            onChange={(e) => simulateOverload(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-purple-500"
          />
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">0 kg</span>
            <span className={`font-mono ${laundryLoadKg > 5 ? 'text-red-400' : laundryLoadKg > 4 ? 'text-amber-400' : 'text-purple-400'}`}>
              {laundryLoadKg.toFixed(1)} kg
            </span>
            <span className="text-slate-600">6 kg</span>
          </div>
          {laundryLoadKg > 5 && <p className="text-xs text-red-400">⚠ Over 5 kg limit!</p>}
        </div>

        {/* Environment sliders */}
        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 space-y-4">
          <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Thermometer size={16} className="text-orange-400" />
            Environment
          </h4>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500">Temperature</span>
              <span className={`font-mono ${temperatureC > 40 ? 'text-red-400' : 'text-orange-400'}`}>{temperatureC.toFixed(1)}°C</span>
            </div>
            <input
              type="range"
              min="15"
              max="45"
              step="0.5"
              value={temperatureC}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-orange-500"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500">Humidity</span>
              <span className={`font-mono ${humidityPercent > 75 ? 'text-amber-400' : 'text-cyan-400'}`}>{humidityPercent.toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={humidityPercent}
              onChange={(e) => setHumidity(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={resetDemo}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-all text-sm font-medium"
      >
        <RotateCcw size={16} />
        Reset Demo to Initial State
      </button>
    </div>
  );
}
