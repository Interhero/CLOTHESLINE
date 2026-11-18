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

  // Active confirmation warning for rain safe-limit violations
  const [rainWarningNotice, setRainWarningNotice] = useState(null);

  const alertIdRef = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Track the timestamp of the last local user input on THIS specific device
  const lastLocalInputTimeRef = useRef(0);
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

  const dismissRainWarning = useCallback(() => {
    setRainWarningNotice(null);
  }, []);

  // ─── rod animation ─────────────────────────────────
  const animateRod = useCallback((targetPercent) => {
    setState(prev => {
      if (!prev.systemPower || prev.emergencyStop) return prev;
      if (prev.laundryLoadKg > 5) {
        addAlert('critical', 'Laundry load exceeds the recommended simulation limit.');
        return { ...prev, motorStatus: 'Fault' };
      }
      // If rain is active, hard-clamp rod target to shelteredPositionPercent (25%)
      let effectiveTarget = targetPercent;
      if (prev.rainDetected && targetPercent > prev.shelteredPositionPercent) {
        effectiveTarget = prev.shelteredPositionPercent;
      }
      return { ...prev, rodTargetPercent: effectiveTarget, motorStatus: 'Moving' };
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
      const nextState = {
        ...prev,
        systemPower: next,
        ...(next ? {} : { fanSpeed: 0, motorStatus: 'Idle', timerRunning: false })
      };
      if (!isRemote) {
        lastLocalInputTimeRef.current = Date.now();
        addAlert('info', next ? 'Smart Rack online: Standby.' : 'Smart Rack offline.');
        iotSyncRef.current?.publishAction('TOGGLE_POWER', { systemPower: next });
        iotSyncRef.current?.broadcastState(nextState);
      } else {
        addAlert('info', next ? '📱 Remote: Smart Rack powered ON.' : '📱 Remote: Smart Rack turned OFF.');
      }
      return nextState;
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
      const nextState = { ...prev, fanSpeed: speed };
      if (!isRemote) {
        lastLocalInputTimeRef.current = Date.now();
        addAlert('info', `Fan speed set to ${FAN_LABELS[speed]}.`);
        iotSyncRef.current?.publishAction('SET_FAN_SPEED', { speed });
        iotSyncRef.current?.broadcastState(nextState);
      } else {
        addAlert('info', `📱 Remote: Fan speed set to ${FAN_LABELS[speed]}.`);
      }
      return nextState;
    });
  }, [addAlert]);

  const execSetRodTarget = useCallback((pct, isRemote = false) => {
    let target = pct;

    // Rain Safety Lockout Check: Cannot extend past 25% sheltered position during rain
    if (stateRef.current.rainDetected && pct > stateRef.current.shelteredPositionPercent) {
      target = stateRef.current.shelteredPositionPercent;
      if (!isRemote) {
        addAlert('critical', '🌧 Rain Lockout: Cannot extend past 25% rain-safe limit while raining!');
        setRainWarningNotice({
          show: true,
          type: 'slider',
          requestedPercent: Math.round(pct),
          safeLimit: stateRef.current.shelteredPositionPercent,
          title: 'Rain Warning: Safe Limit Enforced',
          message: `Outdoor rain is currently detected! The rack cannot extend past the ${stateRef.current.shelteredPositionPercent}% rain-safe shelter zone (10 cm) to protect your clothes from getting wet.`
        });
      }
    }

    if (target <= 5) {
      setState(prev => {
        if (prev.fanSpeed > 0) {
          addAlert('info', 'Rack folded against wall: Fan automatically shut off.');
          return { ...prev, fanSpeed: 0 };
        }
        return prev;
      });
    }

    if (!isRemote) {
      lastLocalInputTimeRef.current = Date.now();
      iotSyncRef.current?.publishAction('SET_ROD_TARGET', { percent: target });
      iotSyncRef.current?.broadcastState({
        ...stateRef.current,
        rodTargetPercent: target,
        motorStatus: 'Moving'
      });
    } else {
      addAlert('info', `📱 Remote: Rack stroke adjusted to ${Math.round(target)}%.`);
    }
    animateRod(target);
  }, [animateRod, addAlert]);

  const execSetPowerStateDemo = useCallback((targetState, isRemote = false) => {
    if (!isRemote) {
      lastLocalInputTimeRef.current = Date.now();
      iotSyncRef.current?.publishAction('SET_POWER_STATE_DEMO', { targetState });
    }
    if (targetState === 'Standby') {
      setState(prev => {
        const next = {
          ...prev,
          systemPower: true,
          fanSpeed: 0,
          timerRunning: false,
          motorStatus: 'Idle'
        };
        if (!isRemote) {
          addAlert('info', 'Scene Demo: System is in STANDBY (Connected, ready).');
          iotSyncRef.current?.broadcastState(next);
        } else {
          addAlert('info', '📱 Remote: System switched to STANDBY.');
        }
        return next;
      });
    } else if (targetState === 'Online') {
      setState(prev => {
        const nextPos = prev.rodPositionPercent <= 5 ? 75 : prev.rodPositionPercent;
        const effectivePos = prev.rainDetected ? Math.min(prev.shelteredPositionPercent, nextPos) : nextPos;
        const next = {
          ...prev,
          systemPower: true,
          rodPositionPercent: effectivePos,
          rodTargetPercent: effectivePos,
          fanSpeed: 2,
          timerRunning: true,
          motorStatus: 'Idle'
        };
        if (!isRemote) {
          addAlert('info', 'Scene Demo: System is ONLINE (Active drying cycle).');
          iotSyncRef.current?.broadcastState(next);
        } else {
          addAlert('info', '📱 Remote: System switched to ONLINE.');
        }
        return next;
      });
    } else if (targetState === 'Offline') {
      setState(prev => {
        const next = {
          ...prev,
          systemPower: false,
          fanSpeed: 0,
          timerRunning: false,
          motorStatus: 'Idle'
        };
        if (!isRemote) {
          addAlert('info', 'Scene Demo: System is OFFLINE (Power disconnected).');
          iotSyncRef.current?.broadcastState(next);
        } else {
          addAlert('info', '📱 Remote: System switched to OFFLINE.');
        }
        return next;
      });
    }
  }, [addAlert]);

  const execEmergencyStopToggle = useCallback((isRemote = false) => {
    setState(prev => {
      const stopping = !prev.emergencyStop;
      const nextState = {
        ...prev,
        emergencyStop: stopping,
        motorStatus: stopping ? 'Stopped' : 'Idle',
        ...(stopping ? { timerRunning: false } : {})
      };
      if (stopping) {
        addAlert('critical', isRemote ? '🚨 Remote Action: Emergency Stop triggered!' : 'Emergency Stop activated. All movement halted.');
      } else {
        addAlert('info', isRemote ? '📱 Remote: Emergency Stop released.' : 'Emergency Stop released.');
      }
      if (!isRemote) {
        lastLocalInputTimeRef.current = Date.now();
        iotSyncRef.current?.publishAction('EMERGENCY_STOP', { emergencyStop: stopping });
        iotSyncRef.current?.broadcastState(nextState);
      }
      return nextState;
    });
  }, [addAlert]);

  const execSelectMode = useCallback((modeName, isRemote = false) => {
    const mode = MODES[modeName];
    if (!mode) return;
    setState(prev => {
      if (!prev.systemPower) return prev;
      const targetLoad = mode.loadKg ?? prev.laundryLoadKg;

      // Rain Safety Check: If it rains, drying modes must operate within 25% safe limit with confirmation warning!
      let targetStroke = mode.rod;
      if (prev.rainDetected && mode.rod > prev.shelteredPositionPercent) {
        targetStroke = prev.shelteredPositionPercent;
        if (!isRemote) {
          addAlert('high', `🌧 Rain Reminder: ${modeName} operating in sheltered position (25% rain-safe limit).`);
          setRainWarningNotice({
            show: true,
            type: 'mode',
            modeName,
            safeLimit: prev.shelteredPositionPercent,
            title: `Rain Reminder: ${modeName} in Safe Position`,
            message: `Outdoor rain is currently detected! The "${modeName}" cycle has automatically locked to the ${prev.shelteredPositionPercent}% rain-safe shelter position under the roof so your laundry stays completely dry.`
          });
        }
      } else {
        if (!isRemote) {
          if (modeName === 'Heavy Laundry') {
            addAlert('info', `Scene set: Heavy Laundry. Load sensor updated to ${targetLoad} kg (92% load).`);
          } else {
            addAlert('info', `Mode activated: ${modeName} (${targetLoad} kg load).`);
          }
        }
      }

      if (isRemote) {
        addAlert('info', `📱 Remote: Scene changed to ${modeName}.`);
      }

      const nextState = {
        ...prev,
        selectedMode: modeName,
        fanSpeed: mode.fan,
        remainingMinutes: mode.timer,
        totalMinutes: mode.timer,
        dryingProgressPercent: 0,
        timerRunning: true,
        laundryLoadKg: targetLoad,
        rodTargetPercent: targetStroke,
        motorStatus: 'Moving'
      };

      if (!isRemote) {
        lastLocalInputTimeRef.current = Date.now();
        iotSyncRef.current?.publishAction('SELECT_MODE', { modeName });
        iotSyncRef.current?.broadcastState(nextState);
      }
      return nextState;
    });
    animateRod(mode.rod);
  }, [addAlert, animateRod]);

  const execToggleAutoRain = useCallback((isRemote = false) => {
    setState(prev => {
      const next = !prev.autoRainProtection;
      const nextState = { ...prev, autoRainProtection: next };
      if (!isRemote) {
        lastLocalInputTimeRef.current = Date.now();
        iotSyncRef.current?.publishAction('TOGGLE_AUTO_RAIN', { autoRainProtection: next });
        iotSyncRef.current?.broadcastState(nextState);
      }
      return nextState;
    });
  }, []);

  const execSimulateRain = useCallback((on, isRemote = false) => {
    setState(prev => {
      if (on && !prev.rainDetected) {
        addAlert('high', isRemote ? '🌧 Remote: Rain detected! Retracting to shelter.' : 'Rain detected! Auto-retracting rack to 25% rain-safe shelter.');
        const next = { ...prev, rainDetected: true };
        if (prev.autoRainProtection && prev.systemPower) {
          next.rodTargetPercent = prev.shelteredPositionPercent;
          next.motorStatus = 'Moving';
        }
        if (!isRemote) {
          lastLocalInputTimeRef.current = Date.now();
          iotSyncRef.current?.publishAction('SIMULATE_RAIN', { on: true });
          iotSyncRef.current?.broadcastState(next);
        }
        return next;
      }
      if (!on && prev.rainDetected) {
        addAlert('info', isRemote ? '☀️ Remote: Rain cleared.' : 'Rain stopped. Dry outdoor weather resumed.');
        const next = { ...prev, rainDetected: false };
        if (!isRemote) {
          lastLocalInputTimeRef.current = Date.now();
          iotSyncRef.current?.publishAction('SIMULATE_RAIN', { on: false });
          iotSyncRef.current?.broadcastState(next);
        }
        return next;
      }
      return prev;
    });
  }, [addAlert]);

  const execSimulateObstacle = useCallback((on, isRemote = false) => {
    setState(prev => {
      if (on) {
        addAlert('critical', isRemote ? '⚠️ Remote: Obstacle sensor tripped!' : 'Movement stopped. Please check the drying rack.');
        const next = { ...prev, obstacleDetected: true, motorStatus: 'Stopped' };
        if (!isRemote) {
          lastLocalInputTimeRef.current = Date.now();
          iotSyncRef.current?.publishAction('SIMULATE_OBSTACLE', { on: true });
          iotSyncRef.current?.broadcastState(next);
        }
        return next;
      }
      addAlert('info', isRemote ? '✅ Remote: Obstacle cleared.' : 'Obstacle cleared.');
      const next = { ...prev, obstacleDetected: false, motorStatus: 'Idle' };
      if (!isRemote) {
        lastLocalInputTimeRef.current = Date.now();
        iotSyncRef.current?.publishAction('SIMULATE_OBSTACLE', { on: false });
        iotSyncRef.current?.broadcastState(next);
      }
      return next;
    });
  }, [addAlert]);

  const execResetDemo = useCallback((isRemote = false) => {
    setState({ ...INITIAL_STATE });
    setAlerts([]);
    setRainWarningNotice(null);
    if (!isRemote) {
      lastLocalInputTimeRef.current = Date.now();
      addAlert('info', 'Demo reset to initial state.');
      iotSyncRef.current?.publishAction('RESET_DEMO', {});
      iotSyncRef.current?.broadcastState({ ...INITIAL_STATE });
    } else {
      addAlert('info', '📱 Remote: Demo reset to initial defaults.');
    }
  }, [addAlert]);

  // ─── initialize cloud synchronization ───────────────
  useEffect(() => {
    const handleRemoteAction = (action) => {
      const { type, payload } = action;

      if (type === 'PEER_REQUESTED_STATE') {
        const timeSinceInput = Date.now() - lastLocalInputTimeRef.current;
        if (timeSinceInput < 120000) {
          iotSyncRef.current?.broadcastState(stateRef.current);
        }
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
      const timeSinceInput = Date.now() - lastLocalInputTimeRef.current;
      if (timeSinceInput < 2500) {
        return;
      }
      setState(prev => ({
        ...prev,
        ...incomingState,
      }));
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

  // ─── PERIODIC SYNC: ONLY BY THE DEVICE WITH USER INPUT FROM TIME TO TIME ───
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const timeSinceInput = Date.now() - lastLocalInputTimeRef.current;
      const isDeviceActiveWithInput = timeSinceInput < 45000;

      if (
        iotSyncRef.current &&
        syncStatus === 'connected' &&
        isDeviceActiveWithInput &&
        (stateRef.current.timerRunning || stateRef.current.motorStatus === 'Moving')
      ) {
        iotSyncRef.current.broadcastState(stateRef.current);
      }
    }, 4000);
    return () => clearInterval(syncInterval);
  }, [syncStatus]);

  return {
    state,
    alerts,
    // sync info
    homeId,
    setHomeId,
    syncStatus,
    // rain warning
    rainWarningNotice,
    dismissRainWarning,
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
