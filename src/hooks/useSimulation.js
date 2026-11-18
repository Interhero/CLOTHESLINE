import { useState, useEffect, useCallback, useRef } from 'react';
import { IoTCloudSync } from '../services/iotCloudSync';

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

const getInitialHomeId = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const h = params.get('home') || params.get('room');
    if (h && h.trim()) return h.trim().toLowerCase();
  }
  return 'ent600-home';
};

export { MODES, INITIAL_STATE, FAN_LABELS };

export default function useSimulation() {
  const [state, setState] = useState({ ...INITIAL_STATE });
  const [alerts, setAlerts] = useState([]);
  const [homeId, setHomeIdState] = useState(getInitialHomeId);
  const [syncStatus, setSyncStatus] = useState('connecting'); // connecting | connected | offline

  const alertIdRef = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const iotSyncRef = useRef(null);

  // ─── alerts helper ──────────────────────────────────
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

  // ─── core action executors (local vs remote) ───────
  const execTogglePower = useCallback((isRemote = false) => {
    setState(prev => {
      const next = !prev.systemPower;
      if (!isRemote) {
        addAlert('info', next ? 'Smart Rack online: Standby.' : 'Smart Rack offline.');
        iotSyncRef.current?.publishAction('TOGGLE_POWER', { systemPower: next });
      } else {
        addAlert('info', next ? '📱 Remote: Smart Rack powered ON.' : '📱 Remote: Smart Rack turned OFF.');
      }
      if (!next) {
        return { ...prev, systemPower: false, fanSpeed: 0, motorStatus: 'Idle', timerRunning: false };
      }
      return { ...prev, systemPower: true };
    });
  }, [addAlert]);

  const execSetFanSpeed = useCallback((speed, isRemote = false) => {
    setState(prev => {
      if (!prev.systemPower) return prev;
      if (prev.rodPositionPercent <= 5 && speed > 0) {
        if (!isRemote) {
          addAlert('info', 'Rack is folded against wall. Extend rack before turning on fan.');
        }
        return prev;
      }
      if (!isRemote) {
        addAlert('info', `Fan speed set to ${FAN_LABELS[speed]}.`);
        iotSyncRef.current?.publishAction('SET_FAN_SPEED', { speed });
      } else {
        addAlert('info', `📱 Remote: Fan speed set to ${FAN_LABELS[speed]}.`);
      }
      return { ...prev, fanSpeed: speed };
    });
  }, [addAlert]);

  const execSetRodTarget = useCallback((pct, isRemote = false) => {
    if (pct <= 5) {
      setState(prev => {
        if (prev.fanSpeed > 0) {
          addAlert('info', 'Rack folded against wall: Fan automatically shut off.');
          return { ...prev, fanSpeed: 0 };
        }
        return prev;
      });
    }
    if (!isRemote) {
      iotSyncRef.current?.publishAction('SET_ROD_TARGET', { percent: pct });
    } else {
      addAlert('info', `📱 Remote: Rack stroke adjusted to ${Math.round(pct)}%.`);
    }
    animateRod(pct);
  }, [animateRod, addAlert]);

  const execSetPowerStateDemo = useCallback((targetState, isRemote = false) => {
    if (targetState === 'Standby') {
      setState(prev => ({
        ...prev,
        systemPower: true,
        fanSpeed: 0,
        timerRunning: false,
        motorStatus: 'Idle'
      }));
      if (!isRemote) {
        addAlert('info', 'Scene Demo: System is in STANDBY (Connected, ready).');
        iotSyncRef.current?.publishAction('SET_POWER_STATE_DEMO', { targetState });
      } else {
        addAlert('info', '📱 Remote: System switched to STANDBY.');
      }
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
      if (!isRemote) {
        addAlert('info', 'Scene Demo: System is ONLINE (Active drying cycle).');
        iotSyncRef.current?.publishAction('SET_POWER_STATE_DEMO', { targetState });
      } else {
        addAlert('info', '📱 Remote: System switched to ONLINE.');
      }
    } else if (targetState === 'Offline') {
      setState(prev => ({
        ...prev,
        systemPower: false,
        fanSpeed: 0,
        timerRunning: false,
        motorStatus: 'Idle'
      }));
      if (!isRemote) {
        addAlert('info', 'Scene Demo: System is OFFLINE (Power disconnected).');
        iotSyncRef.current?.publishAction('SET_POWER_STATE_DEMO', { targetState });
      } else {
        addAlert('info', '📱 Remote: System switched to OFFLINE.');
      }
    }
  }, [addAlert]);

  const execEmergencyStopToggle = useCallback((isRemote = false) => {
    setState(prev => {
      const stopping = !prev.emergencyStop;
      if (stopping) {
        addAlert('critical', isRemote ? '🚨 Remote Action: Emergency Stop triggered!' : 'Emergency Stop activated. All movement halted.');
        if (!isRemote) iotSyncRef.current?.publishAction('EMERGENCY_STOP', { emergencyStop: true });
        return { ...prev, emergencyStop: true, motorStatus: 'Stopped', timerRunning: false };
      }
      addAlert('info', isRemote ? '📱 Remote: Emergency Stop released.' : 'Emergency Stop released.');
      if (!isRemote) iotSyncRef.current?.publishAction('EMERGENCY_STOP', { emergencyStop: false });
      return { ...prev, emergencyStop: false, motorStatus: 'Idle' };
    });
  }, [addAlert]);

  const execSelectMode = useCallback((modeName, isRemote = false) => {
    const mode = MODES[modeName];
    if (!mode) return;
    setState(prev => {
      if (!prev.systemPower) return prev;
      const targetLoad = mode.loadKg ?? prev.laundryLoadKg;
      if (!isRemote) {
        if (modeName === 'Heavy Laundry') {
          addAlert('info', `Scene set: Heavy Laundry. Load sensor updated to ${targetLoad} kg (92% load).`);
        } else {
          addAlert('info', `Mode activated: ${modeName} (${targetLoad} kg load).`);
        }
        iotSyncRef.current?.publishAction('SELECT_MODE', { modeName });
      } else {
        addAlert('info', `📱 Remote: Scene changed to ${modeName}.`);
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

  const execToggleAutoRain = useCallback((isRemote = false) => {
    setState(prev => {
      const next = !prev.autoRainProtection;
      if (!isRemote) iotSyncRef.current?.publishAction('TOGGLE_AUTO_RAIN', { autoRainProtection: next });
      return { ...prev, autoRainProtection: next };
    });
  }, []);

  const execSimulateRain = useCallback((on, isRemote = false) => {
    setState(prev => {
      if (on && !prev.rainDetected) {
        addAlert('high', isRemote ? '🌧 Remote: Rain detected! Retracting to shelter.' : 'Rain detected. Retracting clothes under the roof.');
        const next = { ...prev, rainDetected: true };
        if (prev.autoRainProtection && prev.systemPower) {
          next.rodTargetPercent = prev.shelteredPositionPercent;
          next.motorStatus = 'Moving';
        }
        if (!isRemote) iotSyncRef.current?.publishAction('SIMULATE_RAIN', { on: true });
        return next;
      }
      if (!on && prev.rainDetected) {
        addAlert('info', isRemote ? '☀️ Remote: Rain cleared.' : 'Rain stopped. Dry weather resumed.');
        if (!isRemote) iotSyncRef.current?.publishAction('SIMULATE_RAIN', { on: false });
        return { ...prev, rainDetected: false };
      }
      return prev;
    });
  }, [addAlert]);

  const execSimulateObstacle = useCallback((on, isRemote = false) => {
    setState(prev => {
      if (on) {
        addAlert('critical', isRemote ? '⚠️ Remote: Obstacle sensor tripped!' : 'Movement stopped. Please check the drying rack.');
        if (!isRemote) iotSyncRef.current?.publishAction('SIMULATE_OBSTACLE', { on: true });
        return { ...prev, obstacleDetected: true, motorStatus: 'Stopped' };
      }
      addAlert('info', isRemote ? '✅ Remote: Obstacle cleared.' : 'Obstacle cleared.');
      if (!isRemote) iotSyncRef.current?.publishAction('SIMULATE_OBSTACLE', { on: false });
      return { ...prev, obstacleDetected: false, motorStatus: 'Idle' };
    });
  }, [addAlert]);

  const execResetDemo = useCallback((isRemote = false) => {
    setState({ ...INITIAL_STATE });
    setAlerts([]);
    if (!isRemote) {
      addAlert('info', 'Demo reset to initial state.');
      iotSyncRef.current?.publishAction('RESET_DEMO', {});
    } else {
      addAlert('info', '📱 Remote: Demo reset to initial defaults.');
    }
  }, [addAlert]);

  // ─── initialize cloud synchronization ───────────────
  useEffect(() => {
    const handleRemoteAction = (action) => {
      const { type, payload } = action;

      if (type === 'PEER_REQUESTED_STATE') {
        // Broadcast current state so newly connected device catches up immediately
        iotSyncRef.current?.broadcastState(stateRef.current);
        return;
      }

      switch (type) {
        case 'TOGGLE_POWER':
          execTogglePower(true);
          break;
        case 'SET_FAN_SPEED':
          execSetFanSpeed(payload.speed, true);
          break;
        case 'SET_ROD_TARGET':
          execSetRodTarget(payload.percent, true);
          break;
        case 'SET_POWER_STATE_DEMO':
          execSetPowerStateDemo(payload.targetState, true);
          break;
        case 'EMERGENCY_STOP':
          execEmergencyStopToggle(true);
          break;
        case 'SELECT_MODE':
          execSelectMode(payload.modeName, true);
          break;
        case 'TOGGLE_AUTO_RAIN':
          execToggleAutoRain(true);
          break;
        case 'SIMULATE_RAIN':
          execSimulateRain(payload.on, true);
          break;
        case 'SIMULATE_OBSTACLE':
          execSimulateObstacle(payload.on, true);
          break;
        case 'RESET_DEMO':
          execResetDemo(true);
          break;
        default:
          break;
      }
    };

    const handleStateSnapshot = (incomingState) => {
      if (!incomingState) return;
      setState(prev => ({
        ...prev,
        ...incomingState,
      }));
      addAlert('info', '☁️ Synced live state from Home Cloud.');
    };

    const sync = new IoTCloudSync(
      homeId,
      handleRemoteAction,
      handleStateSnapshot,
      (status) => setSyncStatus(status)
    );
    iotSyncRef.current = sync;

    return () => {
      sync.destroy();
    };
  }, [
    homeId,
    execTogglePower,
    execSetFanSpeed,
    execSetRodTarget,
    execSetPowerStateDemo,
    execEmergencyStopToggle,
    execSelectMode,
    execToggleAutoRain,
    execSimulateRain,
    execSimulateObstacle,
    execResetDemo,
    addAlert
  ]);

  // Function to switch smart home room network
  const setHomeId = useCallback((newId) => {
    const cleanId = (newId || 'ent600-home').trim().toLowerCase();
    setHomeIdState(cleanId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('home', cleanId);
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

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

        // gentle ambient drift
        next.temperatureC = +(prev.temperatureC + (Math.random() - 0.5) * 0.3).toFixed(1);
        next.temperatureC = Math.max(15, Math.min(45, next.temperatureC));
        next.humidityPercent = +(prev.humidityPercent + (Math.random() - 0.5) * 0.5).toFixed(1);
        next.humidityPercent = Math.max(0, Math.min(100, next.humidityPercent));

        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [addAlert]);

  // Periodic state snapshot broadcast to broker (retained) so any fresh browser tab joins seamlessly
  useEffect(() => {
    const broadcastInterval = setInterval(() => {
      if (iotSyncRef.current && syncStatus === 'connected') {
        iotSyncRef.current.broadcastState(stateRef.current);
      }
    }, 4000);
    return () => clearInterval(broadcastInterval);
  }, [syncStatus]);

  return {
    state,
    alerts,
    // sync info
    homeId,
    setHomeId,
    syncStatus,
    // controls
    togglePower: () => execTogglePower(false),
    setFanSpeed: (s) => execSetFanSpeed(s, false),
    openRods: () => execSetRodTarget(100, false),
    foldRods: () => execSetRodTarget(0, false),
    setRodTarget: (pct) => execSetRodTarget(pct, false),
    emergencyStopToggle: () => execEmergencyStopToggle(false),
    selectMode: (m) => execSelectMode(m, false),
    toggleAutoRain: () => execToggleAutoRain(false),
    // demo
    setPowerStateDemo: (s) => execSetPowerStateDemo(s, false),
    simulateRain: (on) => execSimulateRain(on, false),
    simulateObstacle: (on) => execSimulateObstacle(on, false),
    resetDemo: () => execResetDemo(false),
    // alerts
    dismissAlert,
    clearAlerts,
  };
}
