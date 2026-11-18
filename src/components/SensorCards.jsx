import React from 'react';
import {
  Thermometer, Droplets, CloudRain, Weight, Wind, Timer, Gauge, Activity
} from 'lucide-react';

function SensorCard({ icon: Icon, label, value, unit, color, alert, small }) {
  return (
    <div className={`bg-slate-800/60 rounded-xl border p-4 ${
      alert ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-700/50'
    } ${small ? 'p-3' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={small ? 14 : 16} className={color} />
        <span className="text-xs text-slate-400 font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`font-bold ${small ? 'text-lg' : 'text-2xl'} text-white`}>{value}</span>
        <span className="text-xs text-slate-500">{unit}</span>
      </div>
      {alert && (
        <p className="text-xs text-amber-400 mt-1">⚠ {alert}</p>
      )}
    </div>
  );
}

export default function SensorCards({ state }) {
  const {
    temperatureC, humidityPercent, rainDetected, rodPositionPercent,
    laundryLoadKg, fanSpeed, dryingProgressPercent, remainingMinutes, motorStatus
  } = state;

  const FAN_LABELS = ['OFF', 'Low', 'Medium', 'High'];

  const formatTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      <SensorCard
        icon={Thermometer}
        label="Temperature"
        value={temperatureC.toFixed(1)}
        unit="°C"
        color="text-orange-400"
        alert={temperatureC > 40 ? 'High temperature' : null}
      />
      <SensorCard
        icon={Droplets}
        label="Humidity"
        value={humidityPercent.toFixed(0)}
        unit="%"
        color="text-cyan-400"
        alert={humidityPercent > 75 ? 'High humidity' : null}
      />
      <SensorCard
        icon={CloudRain}
        label="Rain"
        value={rainDetected ? 'Detected' : 'Dry'}
        unit=""
        color={rainDetected ? 'text-blue-400' : 'text-emerald-400'}
        alert={rainDetected ? 'Auto-retracting' : null}
      />
      <SensorCard
        icon={Gauge}
        label="Rod Extension"
        value={Math.round(rodPositionPercent)}
        unit="%"
        color="text-blue-400"
      />
      <SensorCard
        icon={Weight}
        label="Laundry Load"
        value={laundryLoadKg.toFixed(1)}
        unit="kg"
        color="text-purple-400"
        alert={laundryLoadKg > 5 ? 'Over limit!' : laundryLoadKg > 4 ? 'Near limit' : null}
      />
      <SensorCard
        icon={Wind}
        label="Fan Speed"
        value={FAN_LABELS[fanSpeed]}
        unit={fanSpeed > 0 ? `(${fanSpeed}/3)` : ''}
        color="text-sky-400"
      />
      <SensorCard
        icon={Activity}
        label="Drying Progress"
        value={dryingProgressPercent.toFixed(0)}
        unit="%"
        color="text-emerald-400"
      />
      <SensorCard
        icon={Timer}
        label="Timer"
        value={formatTime(remainingMinutes)}
        unit="remaining"
        color="text-amber-400"
      />
      <SensorCard
        icon={Activity}
        label="Motor"
        value={motorStatus}
        unit=""
        color={
          motorStatus === 'Moving' ? 'text-blue-400' :
          motorStatus === 'Stopped' || motorStatus === 'Fault' ? 'text-red-400' :
          'text-slate-400'
        }
      />
    </div>
  );
}
