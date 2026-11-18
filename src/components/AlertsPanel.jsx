import React from 'react';
import { AlertTriangle, AlertCircle, Info, X, Trash2 } from 'lucide-react';

const LEVEL_CONFIG = {
  critical: { icon: AlertTriangle, bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', badge: 'bg-red-500' },
  high:     { icon: AlertTriangle, bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500' },
  medium:   { icon: AlertCircle,   bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-400', badge: 'bg-yellow-500' },
  info:     { icon: Info,          bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500' },
};

export default function AlertsPanel({ alerts, dismissAlert, clearAlerts }) {
  if (alerts.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Alerts & History</h3>
        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-10 text-center">
          <Info size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No alerts yet. Use the demo controls to trigger events.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Alerts & History
          <span className="ml-2 text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{alerts.length}</span>
        </h3>
        <button
          onClick={clearAlerts}
          className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
        >
          <Trash2 size={12} /> Clear all
        </button>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {alerts.map((alert) => {
          const cfg = LEVEL_CONFIG[alert.level] || LEVEL_CONFIG.info;
          const Icon = cfg.icon;
          return (
            <div
              key={alert.id}
              className={`flex items-start gap-3 p-3 rounded-lg border alert-enter ${cfg.bg}`}
            >
              <Icon size={16} className={`${cfg.text} mt-0.5 shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${cfg.text}`}>{alert.message}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {alert.time.toLocaleTimeString()}
                </p>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded text-white font-medium shrink-0 ${cfg.badge}`}>
                {alert.level.toUpperCase()}
              </span>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-slate-600 hover:text-slate-400 shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
