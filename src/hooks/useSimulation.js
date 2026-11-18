import { useState, useEffect, useCallback, useRef } from 'react';

const MODES = {
  'Quick Dry':        { fan: 3, rod: 100, timer: 90, loadKg: 2.4 },
  'Delicate Fabrics': { fan: 1, rod: 100, timer: 120, loadKg: 1.5 },
  'Heavy Laundry':    { fan: 3, rod: 100, timer: 180, loadKg: 4.6 },
  'Eco Air-Dry':      { fan: 1, rod: 100, timer: 240, loadKg: 2.2 },
  'Night Silent':     { fan: 1, rod: 100, timer: 120, loadKg: 1.8 },
};

const INITIAL_STATE = {
  systemPower: true,
  fanSpeed: 2,
  rodPositionPercent: 75,
  rodTargetPercent: 75,
  rainDetected: false,
  autoRainProtection: true,
  shelteredPositionPercent: 25,
  temperatureC: 29,
  humidityPercent: 68,
  laundryLoadKg: 2.4,
  dryingProgressPercent: 42,
  remainingMinutes: 58,
  totalMinutes: 90,
  selectedMode: 'Quick Dry',
  motorStatus: 'Idle',        // Idle | Moving | Stopped | Fault
  obstacleDetected: false,
  emergencyStop: false,
  timerRunning: false,
};

const FAN_LABELS = ['OFF', 'Low', 'Medium', 'High'];

export { MODES, INITIAL_STATE, FAN_LABELS };

export default function useSimulation() {
  const [state, setState] = useState({ ...INITIAL_STATE });
  const [alerts, setAlerts] = useState([]);
  const alertIdRef = useRef(0);
  const rodAnimRef = useRef(null);

  // ─── helpers ────────────────────────────────────────
  const addAlert = useCallback((level, message) => {
    const id = ++alertIdRef.current;
    const alert = { id, level, message, time: new Date() };
    setAlerts(prev => [alert, ...prev].slice(0, 50));
    return alert;
  }, []);

  const dismissAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearAlerts = useCallback(() => setAlerts([]), []);

  // ─── rod animation ─────────────────────────────────
  const animateRod = useCallback((targetPercent) => {
    setState(prev => {
      if (!prev.systemPower || prev.emergencyStop) return prev;
      if (prev.laundryLoadKg > 5) {
        addAlert('critical', 'Laundry load exceeds the recommended simulation limit.');
        return { ...prev, motorStatus: 'Fault' };
      }
      return { ...prev, rodTargetPercent: targetPercent, motorStatus: 'Moving' };
    });
  }, [addAlert]);

  // Smooth rod movement tick & Auto Fan Shutoff when folded
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        if (prev.motorStatus !== 'Moving') {
          // If folded and fan is running, auto shut off
          if (prev.rodPositionPercent <= 5 && prev.fanSpeed > 0) {
            addAlert('info', 'Rack folded against wall: Fan automatically shut off.');
            return { ...prev, fanSpeed: 0 };
          }
          return prev;
        }
        if (prev.emergencyStop || prev.obstacleDetected) {
          return { ...prev, motorStatus: 'Stopped' };
        }
        const diff = prev.rodTargetPercent - prev.rodPositionPercent;
        if (Math.abs(diff) < 0.5) {
          const isFolded = prev.rodTargetPercent <= 5;
          if (isFolded && prev.fanSpeed > 0) {
            addAlert('info', 'Rack folded against wall: Fan automatically shut off.');
          }
          return {
            ...prev,
            rodPositionPercent: prev.rodTargetPercent,
            motorStatus: 'Idle',
            fanSpeed: isFolded ? 0 : prev.fanSpeed
          };
        }
        const step = Math.sign(diff) * Math.min(Math.abs(diff), 2);
        const nextPos = +(prev.rodPositionPercent + step).toFixed(1);
        const isFolded = nextPos <= 5;
        return {
          ...prev,
          rodPositionPercent: nextPos,
          fanSpeed: isFolded && prev.fanSpeed > 0 ? 0 : prev.fanSpeed
        };
      });
    }, 50);
    return () => clearInterval(interval);
  }, [addAlert]);

  // ─── controls ───────────────────────────────────────
  const togglePower = useCallback(() => {
    setState(prev => {
      const next = !prev.systemPower;
      addAlert('info', next ? 'Smart Rack online: Standby.' : 'Smart Rack offline.');
      if (!next) {
        return { ...prev, systemPower: false, fanSpeed: 0, motorStatus: 'Idle', timerRunning: false };
      }
      return { ...prev, systemPower: true };
    });
  }, [addAlert]);

  const setFanSpeed = useCallback((speed) => {
    setState(prev => {
      if (!prev.systemPower) return prev;
      if (prev.rodPositionPercent <= 5 && speed > 0) {
        addAlert('info', 'Rack is folded against wall. Extend rack before turning on fan.');
        return prev;
      }
      addAlert('info', `Fan speed set to ${FAN_LABELS[speed]}.`);
      return { ...prev, fanSpeed: speed };
    });
  }, [addAlert]);

  const openRods = useCallback(() => {
    addAlert('info', 'Opening drying rods.');
    animateRod(100);
  }, [addAlert, animateRod]);

  const foldRods = useCallback(() => {
    addAlert('info', 'Folding drying rods to wall. Fan automatically shut off.');
    setState(prev => ({ ...prev, fanSpeed: 0 }));
    animateRod(0);
  }, [addAlert, animateRod]);

  const setRodTarget = useCallback((pct) => {
    if (pct <= 5) {
      setState(prev => {
        if (prev.fanSpeed > 0) {
          addAlert('info', 'Rack folded against wall: Fan automatically shut off.');
          return { ...prev, fanSpeed: 0 };
        }
        return prev;
      });
    }
    animateRod(pct);
  }, [animateRod, addAlert]);

  const setPowerStateDemo = useCallback((targetState) => {
    if (targetState === 'Standby') {
      setState(prev => ({
        ...prev,
        systemPower: true,
        fanSpeed: 0,
        timerRunning: false,
        motorStatus: 'Idle'
      }));
      addAlert('info', 'Scene Demo: System is in STANDBY (Connected, ready).');
    } else if (targetState === 'Online') {
      setState(prev => {
        const nextPos = prev.rodPositionPercent <= 5 ? 75 : prev.rodPositionPercent;
        return {
          ...prev,
          systemPower: true,
          rodPositionPercent: nextPos,
          rodTargetPercent: nextPos,
          fanSpeed: 2,
          timerRunning: true,
          motorStatus: 'Idle'
        };
      });
      addAlert('info', 'Scene Demo: System is ONLINE (Active drying cycle).');
    } else if (targetState === 'Offline') {
      setState(prev => ({
        ...prev,
        systemPower: false,
        fanSpeed: 0,
        timerRunning: false,
        motorStatus: 'Idle'
      }));
      addAlert('info', 'Scene Demo: System is OFFLINE (Power disconnected).');
    }
  }, [addAlert]);

  const emergencyStopToggle = useCallback(() => {
    setState(prev => {
      const stopping = !prev.emergencyStop;
      if (stopping) {
        addAlert('critical', 'Emergency Stop activated. All movement halted.');
        return { ...prev, emergencyStop: true, motorStatus: 'Stopped', timerRunning: false };
      }
      addAlert('info', 'Emergency Stop released.');
      return { ...prev, emergencyStop: false, motorStatus: 'Idle' };
    });
  }, [addAlert]);

  const selectMode = useCallback((modeName) => {
    const mode = MODES[modeName];
    if (!mode) return;
    setState(prev => {
      if (!prev.systemPower) return prev;
      const targetLoad = mode.loadKg ?? prev.laundryLoadKg;
      if (modeName === 'Heavy Laundry') {
        addAlert('info', `Scene set: Heavy Laundry. Load sensor updated to ${targetLoad} kg (92% load).`);
      } else {
        addAlert('info', `Mode activated: ${modeName} (${targetLoad} kg load).`);
      }
      return {
        ...prev,
        selectedMode: modeName,
        fanSpeed: mode.fan,
        remainingMinutes: mode.timer,
        totalMinutes: mode.timer,
        dryingProgressPercent: 0,
        timerRunning: true,
        laundryLoadKg: targetLoad,
      };
    });
    animateRod(mode.rod);
  }, [addAlert, animateRod]);

  const setTimer = useCallback((minutes) => {
    setState(prev => ({
      ...prev,
      remainingMinutes: minutes,
      totalMinutes: minutes,
      dryingProgressPercent: 0,
    }));
  }, []);

  const toggleTimer = useCallback(() => {
    setState(prev => {
      if (!prev.systemPower) return prev;
      return { ...prev, timerRunning: !prev.timerRunning };
    });
  }, []);

  const toggleAutoRain = useCallback(() => {
    setState(prev => ({
      ...prev,
      autoRainProtection: !prev.autoRainProtection,
    }));
  }, []);

  // ─── simulation triggers (demo) ────────────────────
  const simulateRain = useCallback((on) => {
    setState(prev => {
      if (on && !prev.rainDetected) {
        addAlert('high', 'Rain detected. Retracting clothes under the roof.');
        const next = { ...prev, rainDetected: true };
        if (prev.autoRainProtection && prev.systemPower) {
          next.rodTargetPercent = prev.shelteredPositionPercent;
          next.motorStatus = 'Moving';
        }
        return next;
      }
      if (!on && prev.rainDetected) {
        addAlert('info', 'Rain stopped. Dry weather resumed.');
        return { ...prev, rainDetected: false };
      }
      return prev;
    });
  }, [addAlert]);

  const simulateObstacle = useCallback((on) => {
    setState(prev => {
      if (on) {
        addAlert('critical', 'Movement stopped. Please check the drying rack.');
        return { ...prev, obstacleDetected: true, motorStatus: 'Stopped' };
      }
      addAlert('info', 'Obstacle cleared.');
      return { ...prev, obstacleDetected: false, motorStatus: 'Idle' };
    });
  }, [addAlert]);

  const simulateOverload = useCallback((kg) => {
    setState(prev => {
      const next = { ...prev, laundryLoadKg: kg };
      if (kg > 4 && kg <= 5) {
        addAlert('medium', 'Laundry load approaching recommended limit.');
      } else if (kg > 5) {
        addAlert('critical', 'Laundry load exceeds the recommended simulation limit.');
        next.motorStatus = 'Fault';
      }
      return next;
    });
  }, [addAlert]);

  const setTemperature = useCallback((t) => {
    setState(prev => {
      if (t > 40) addAlert('medium', 'High ambient temperature detected.');
      return { ...prev, temperatureC: t };
    });
  }, [addAlert]);

  const setHumidity = useCallback((h) => {
    setState(prev => {
      if (h > 75) addAlert('medium', 'High humidity detected. Drying may take longer.');
      return { ...prev, humidityPercent: h };
    });
  }, [addAlert]);

  const resetDemo = useCallback(() => {
    setState({ ...INITIAL_STATE });
    setAlerts([]);
    addAlert('info', 'Demo reset to initial state.');
  }, [addAlert]);

  // ─── timer & telemetry tick (1s) ────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        if (!prev.systemPower) return prev;
        const next = { ...prev };

        // timer countdown
        if (prev.timerRunning && prev.remainingMinutes > 0) {
          next.remainingMinutes = +(prev.remainingMinutes - (1 / 60)).toFixed(4);
          if (next.remainingMinutes <= 0) {
            next.remainingMinutes = 0;
            next.timerRunning = false;
            next.fanSpeed = 0;
            addAlert('info', 'Drying timer completed.');
          }
          // drying progress
          if (prev.totalMinutes > 0) {
            const elapsed = prev.totalMinutes - next.remainingMinutes;
            const humidityFactor = 1 - (prev.humidityPercent - 50) / 200;
            const fanFactor = prev.fanSpeed === 0 ? 0.3 : prev.fanSpeed / 3;
            next.dryingProgressPercent = Math.min(
              100,
              +((elapsed / prev.totalMinutes) * 100 * humidityFactor * fanFactor).toFixed(1)
            );
          }
        }

        // gentle telemetry drift
        next.temperatureC = +(prev.temperatureC + (Math.random() - 0.5) * 0.3).toFixed(1);
        next.temperatureC = Math.max(15, Math.min(45, next.temperatureC));
        next.humidityPercent = +(prev.humidityPercent + (Math.random() - 0.5) * 0.5).toFixed(1);
        next.humidityPercent = Math.max(0, Math.min(100, next.humidityPercent));

        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [addAlert]);

  return {
    state,
    alerts,
    // controls
    togglePower,
    setFanSpeed,
    openRods,
    foldRods,
    setRodTarget,
    emergencyStopToggle,
    selectMode,
    setTimer,
    toggleTimer,
    toggleAutoRain,
    // demo
    setPowerStateDemo,
    simulateRain,
    simulateObstacle,
    simulateOverload,
    setTemperature,
    setHumidity,
    resetDemo,
    // alerts
    dismissAlert,
    clearAlerts,
  };
}
