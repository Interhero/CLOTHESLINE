import React, { useState, useEffect } from 'react';
import {
  Shield, CloudRain, Power, Wind,
  ChevronRight, ChevronLeft, AlertTriangle, RotateCcw,
  Play, Pause, Star
} from 'lucide-react';
import useSimulation, { MODES, FAN_LABELS } from './hooks/useSimulation';
import RackVisual from './components/RackVisual';

export default function App() {
  const sim = useSimulation();
  const { state, alerts } = sim;
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [roomInput, setRoomInput] = useState(sim.homeId);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?home=${sim.homeId}`
    : '';

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleRoomSubmit = (e) => {
    e.preventDefault();
    if (roomInput && roomInput.trim()) {
      sim.setHomeId(roomInput.trim());
      setShowSyncModal(false);
    }
  };

  const powerState = !state.systemPower
    ? 'Offline'
    : (state.fanSpeed > 0 || state.timerRunning || state.motorStatus === 'Moving')
    ? 'Online'
    : 'Standby';

  useEffect(() => {
    const t = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative min-h-screen text-white antialiased overflow-x-hidden">
      {/* Static GPU-Accelerated Background Underlay for Tablet & Mobile (Zero Scroll Gaps) */}
      <div className="apple-home-bg-underlay" aria-hidden="true" />
      <div className="relative z-10 max-w-[1400px] mx-auto px-3 sm:px-8 py-4 sm:py-6 space-y-6">
        
        {/* ═══════════ APPLE HOME TOP BAR ═══════════ */}
        <header className="flex items-center justify-between pt-1 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                My Home
              </span>
              <svg className="w-5 h-5 text-white/70" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs sm:text-sm text-white/80 font-medium">Balcony • Smart Drying Rack</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Real-Time Multi-Device Cloud Sync Pill */}
            <button
              onClick={() => {
                setRoomInput(sim.homeId);
                setShowSyncModal(true);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-black/25 backdrop-blur-xl border border-white/15 text-xs text-white/90 font-medium hover:bg-black/35 active:scale-95 transition"
              title="Click to view Multi-Device Cloud Sync settings & link"
            >
              <span className={`w-2 h-2 rounded-full ${
                sim.syncStatus === 'connected'
                  ? 'bg-[#34c759] animate-pulse'
                  : sim.syncStatus === 'connecting'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-red-400'
              }`}></span>
              <span className="hidden md:inline">
                {sim.syncStatus === 'connected' ? 'Cloud Sync' : sim.syncStatus === 'connecting' ? 'Connecting...' : 'Sync Offline'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono">
                {sim.homeId}
              </span>
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/25 backdrop-blur-xl border border-white/15 text-xs text-white/90 font-medium">
              <span className={`w-2 h-2 rounded-full ${
                powerState === 'Online'
                  ? 'bg-[#00c7be] animate-pulse'
                  : powerState === 'Standby'
                  ? 'bg-[#34c759] animate-pulse'
                  : 'bg-[#64748b]'
              }`}></span>
              <span>{powerState}</span>
              <span className="text-white/30">•</span>
              <span>{currentTime}</span>
            </div>

            {state.rainDetected && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#007aff]/30 backdrop-blur-xl border border-[#007aff]/40 text-xs text-white font-semibold animate-pulse">
                <span>🌧 Rain</span>
              </div>
            )}

            <button
              onClick={sim.emergencyStopToggle}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 ${
                state.emergencyStop
                  ? 'bg-[#ff3b30] text-white shadow-red-500/50 animate-pulse'
                  : 'bg-black/30 backdrop-blur-xl text-white/90 border border-white/20 hover:bg-black/45'
              }`}
            >
              {state.emergencyStop ? 'E-STOPPED' : 'E-STOP'}
            </button>
          </div>
        </header>

        {/* ═══════════ MULTI-DEVICE CLOUD SYNC MODAL ═══════════ */}
        {showSyncModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
            <div className="apple-squircle bg-slate-900/90 border border-white/20 p-5 sm:p-6 max-w-md w-full shadow-2xl text-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#007aff]/20 text-[#007aff] flex items-center justify-center border border-[#007aff]/30">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v9m-4-4 4 4 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">Smart Home Cloud Sync</h3>
                    <p className="text-xs text-white/60">Live multi-device real-time control</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Hub Connection:</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    sim.syncStatus === 'connected' ? 'bg-green-500/20 text-green-300 border border-green-500/40' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {sim.syncStatus === 'connected' ? '● ONLINE (MQTT WSS)' : 'CONNECTING...'}
                  </span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Open this dashboard on multiple devices (phone, laptop, tablet, or examiner's device).
                  Any button clicked or slider moved on one device will <strong>instantly take action on all other screens</strong>.
                </p>
              </div>

              {/* QR Code for Phone Scanning */}
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <span className="text-[11px] font-semibold text-white/80">Scan with your Phone Camera:</span>
                <div className="p-2 bg-white rounded-xl shadow-md">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`}
                    alt="Scan to open on phone"
                    className="w-32 h-32"
                  />
                </div>
              </div>

              {/* Share / Copy Link Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/80">Shareable Room Link:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white/90 font-mono focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-xl bg-[#007aff] hover:bg-[#007aff]/80 font-bold text-xs text-white shrink-0 active:scale-95 transition"
                  >
                    {copiedLink ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Change Home ID form */}
              <form onSubmit={handleRoomSubmit} className="pt-1 border-t border-white/10 space-y-2">
                <label className="text-xs font-semibold text-white/80">Change Home Network Code:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                    placeholder="e.g. ent600-home"
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#007aff]"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 font-semibold text-xs text-white shrink-0 active:scale-95 transition"
                  >
                    Switch
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Emergency Stop Alert Banner */}
        {state.emergencyStop && (
          <div className="apple-squircle p-4 bg-[#ff3b30]/90 backdrop-blur-2xl text-white flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3">
              <Shield size={24} className="text-white" />
              <div>
                <h3 className="font-bold text-sm">Emergency Stop Triggered</h3>
                <p className="text-xs text-white/80">Motor cut off and rack safely locked in position.</p>
              </div>
            </div>
            <button
              onClick={sim.emergencyStopToggle}
              className="px-4 py-2 rounded-full bg-white text-[#ff3b30] font-bold text-xs shadow-md active:scale-95 transition"
            >
              Release
            </button>
          </div>
        )}

        {/* ═══════════ RAIN SAFETY CONFIRMATION WARNING MODAL ═══════════ */}
        {sim.rainWarningNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
            <div className="apple-squircle bg-slate-900/95 border border-[#ff9500]/50 p-5 sm:p-6 max-w-md w-full shadow-2xl text-white space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#ff9500]/20 text-[#ff9500] flex items-center justify-center border border-[#ff9500]/40 shrink-0">
                  <CloudRain size={26} className="text-[#ff9500] animate-bounce" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{sim.rainWarningNotice.title}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff9500]/20 text-[#ffaa33] border border-[#ff9500]/30">
                    25% SAFE CANOPY LIMIT
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/80 space-y-2">
                <p className="text-xs text-white/90 leading-relaxed">
                  {sim.rainWarningNotice.message}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px] text-white/60">
                  <span>Shelter Zone: 0% – 25% (Under Roof)</span>
                  <span className="text-red-400 font-semibold">26% – 100% Rain Lockout</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={sim.dismissRainWarning}
                  className="w-full py-2.5 rounded-xl bg-[#ff9500] hover:bg-[#ffaa33] text-slate-950 font-bold text-xs shadow-lg shadow-[#ff9500]/25 active:scale-95 transition"
                >
                  Understood & Maintain 25% Rain-Safe Limit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ MAIN 2-COLUMN APPLE HOME GRID ═══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          {/* ────────────────── LEFT COLUMN: HERO ACCESSORY & CONTROLS (7 COLS) ────────────────── */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* HERO RACK ACCESSORY PREVIEW */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5 text-white/95 font-bold text-base sm:text-lg">
                  <span>Laundry Balcony</span>
                  <svg className="w-4 h-4 text-white/60" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-white/80 bg-black/25 backdrop-blur-xl px-2.5 py-1 rounded-full border border-white/10">
                  Live Accessory
                </span>
              </div>

              <RackVisual
                rodPercent={state.rodPositionPercent}
                fanSpeed={state.fanSpeed}
                motorStatus={state.motorStatus}
                rainDetected={state.rainDetected}
                laundryLoadKg={state.laundryLoadKg}
                obstacleDetected={state.obstacleDetected}
                systemPower={state.systemPower}
              />
            </div>

            {/* ACCESSORY CONTROLS (APPLE HOME TILES) */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5 text-white/95 font-bold text-base sm:text-lg">
                  <span>Accessory Controls</span>
                  <svg className="w-4 h-4 text-white/60" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs text-white/70">Physical Controls</span>
              </div>

              {/* Apple Home 2 Primary Tiles Grid (Power & Smart Fan) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                
                {/* TILE 1: POWER STATUS (READ-ONLY STATUS, TURNS WHITE WHEN ON) */}
                <div
                  className={`apple-squircle p-4 flex items-center justify-between gap-3 select-none cursor-default transition-all duration-300 ${
                    state.systemPower ? 'glass-tile-active' : 'glass-tile-inactive'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      !state.systemPower
                        ? 'bg-white/10 text-white/50 border border-white/10'
                        : powerState === 'Online'
                        ? 'bg-[#00c7be] text-white shadow-md'
                        : 'bg-[#34c759] text-white shadow-md'
                    }`}>
                      <Power size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className={`font-bold text-sm tracking-tight truncate ${state.systemPower ? 'text-slate-900' : 'text-white'}`}>
                        Power Status
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-2 h-2 rounded-full ${
                          !state.systemPower
                            ? 'bg-slate-400'
                            : powerState === 'Online'
                            ? 'bg-[#00c7be] animate-ping'
                            : 'bg-[#34c759] animate-pulse'
                        }`}></span>
                        <p className={`text-xs font-medium truncate ${state.systemPower ? 'text-slate-600' : 'text-white/70'}`}>
                          {powerState === 'Online' ? 'Online (Active)' : powerState === 'Standby' ? 'Standby (Ready)' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 transition-colors ${
                    !state.systemPower
                      ? 'bg-white/10 text-white/50 border border-white/10'
                      : powerState === 'Online'
                      ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                      : 'bg-green-100 text-green-800 border border-green-200'
                  }`}>
                    {powerState.toUpperCase()}
                  </span>
                </div>

                {/* TILE 2: OVERHEAD FAN */}
                <div
                  onClick={() => {
                    if (!state.systemPower) return;
                    sim.setFanSpeed((state.fanSpeed + 1) % 4);
                  }}
                  className={`apple-squircle p-4 cursor-pointer transition-all duration-300 flex items-center gap-3.5 select-none active:scale-[0.97] ${
                    state.systemPower && state.fanSpeed > 0 ? 'glass-tile-active' : 'glass-tile-inactive'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    state.systemPower && state.fanSpeed > 0 ? 'bg-[#00c7be] text-white shadow-md' : 'bg-white/15 text-white/70'
                  }`}>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={state.fanSpeed > 0 ? (state.fanSpeed === 1 ? 'fan-low' : state.fanSpeed === 2 ? 'fan-medium' : 'fan-high') : ''}
                    >
                      <circle cx="12" cy="12" r="2.8" fill="currentColor" />
                      <path d="M12 9.2V2.5a2.5 2.5 0 0 1 5 0c0 3.7-2.8 6.7-5 6.7z" fill="currentColor" opacity="0.92" />
                      <path d="M14.8 12H21.5a2.5 2.5 0 0 1 0 5c-3.7 0-6.7-2.8-6.7-5z" fill="currentColor" opacity="0.92" />
                      <path d="M12 14.8V21.5a2.5 2.5 0 0 1-5 0c0-3.7 2.8-6.7 5-6.7z" fill="currentColor" opacity="0.92" />
                      <path d="M9.2 12H2.5a2.5 2.5 0 0 1 0-5c3.7 0 6.7 2.8 6.7 5z" fill="currentColor" opacity="0.92" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h4 className={`font-bold text-sm tracking-tight truncate ${state.systemPower && state.fanSpeed > 0 ? 'text-slate-900' : 'text-white'}`}>
                      Smart Fan
                    </h4>
                    <p className={`text-xs font-medium truncate ${state.systemPower && state.fanSpeed > 0 ? 'text-slate-500' : 'text-white/60'}`}>
                      {state.fanSpeed > 0 ? FAN_LABELS[state.fanSpeed] : 'Off'}
                    </p>
                  </div>
                </div>

              </div>

              {/* Clean Apple Home Rack Extension Slider Card */}
              <div className="apple-squircle glass-tile-inactive p-4 sm:p-5 mt-3 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8L22 12L18 16" />
                        <path d="M6 8L2 12L6 16" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-semibold text-white/95 text-sm">Rack Extension</span>
                      <p className="text-[11px] text-white/60">
                        {state.rodPositionPercent <= 5 ? 'Folded to Wall' : state.rodPositionPercent <= 25 ? 'Rain-Safe Sheltered' : state.rodPositionPercent >= 95 ? 'Fully Extended' : 'Custom Stroke'}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-white text-xs bg-white/15 px-3 py-1 rounded-full border border-white/10 shadow-sm">
                    {Math.round(state.rodPositionPercent)}% • {(state.rodPositionPercent * 0.4).toFixed(1)} cm
                  </span>
                </div>

                {/* Rain Lockout Banner if raining */}
                {state.rainDetected && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#ff9500]/15 border border-[#ff9500]/30 text-[#ffaa33]">
                    <span className="text-sm">🌧</span>
                    <span className="font-semibold text-[11px] leading-tight">
                      Rain Active: Extension capped at 25% safe shelter limit (10.0 cm).
                    </span>
                  </div>
                )}

                <div className="py-1">
                  <input
                    type="range"
                    min="0"
                    max={state.rainDetected ? 25 : 100}
                    value={state.rodPositionPercent}
                    onChange={(e) => sim.setRodTarget(Number(e.target.value))}
                    disabled={!state.systemPower || state.emergencyStop}
                    className="w-full accent-white cursor-pointer h-2.5 bg-white/20 rounded-full appearance-none disabled:opacity-40 transition-all hover:bg-white/25"
                  />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Fold 0%', val: 0 },
                    { label: 'Shelter 25%', val: 25, isShelter: true },
                    { label: 'Half 50%', val: 50 },
                    { label: 'Full 100%', val: 100 }
                  ].map((btn) => {
                    const isActive = Math.abs(state.rodPositionPercent - btn.val) <= 2;
                    const isExceedingRainSafe = state.rainDetected && btn.val > 25;
                    return (
                      <button
                        key={btn.val}
                        onClick={() => sim.setRodTarget(btn.val)}
                        disabled={!state.systemPower || state.emergencyStop}
                        title={isExceedingRainSafe ? 'Rain lockout: Cannot extend past 25%' : ''}
                        className={`py-2 px-1 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 disabled:opacity-40 border ${
                          isExceedingRainSafe
                            ? 'bg-red-500/10 text-red-300 border-red-500/25 opacity-60'
                            : isActive
                            ? btn.isShelter
                              ? 'bg-[#ff9500] text-slate-950 border-[#ff9500] shadow-md shadow-[#ff9500]/25'
                              : 'bg-white text-slate-950 border-white shadow-md'
                            : btn.isShelter
                            ? 'bg-[#ff9500]/15 hover:bg-[#ff9500]/25 text-[#ffaa33] border-[#ff9500]/30'
                            : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/10'
                        }`}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drying Progress Bar (Apple Fitness Style) */}
              <div className="apple-squircle glass-tile-inactive p-4 sm:p-5 mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-white/95">Drying Estimation</h4>
                    <p className="text-[11px] text-white/60">Airflow: {FAN_LABELS[state.fanSpeed]} • Ambient: {state.humidityPercent.toFixed(0)}% Humidity</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-base text-white">{Math.round(state.dryingProgressPercent)}%</span>
                    <span className="block text-[10px] text-white/60">{Math.ceil(state.remainingMinutes)} mins left</span>
                  </div>
                </div>
                <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="bg-gradient-to-r from-[#00c7be] via-[#007aff] to-[#34c759] h-full rounded-full transition-all duration-700"
                    style={{ width: `${state.dryingProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>

          </div>


          {/* ────────────────── RIGHT COLUMN: CLIMATE TILES & SCENES (5 COLS) ────────────────── */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* CLIMATE & SENSORS (EXACT APPLE HOME TILES AS IN UPLOADED IMAGE) */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5 text-white/95 font-bold text-base sm:text-lg">
                  <span>Climate & Sensors</span>
                  <svg className="w-4 h-4 text-white/60" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs text-white/70">Telemetry</span>
              </div>

              {/* 2x2 Grid with Thermostat & Weather Display Tiles (Display Only Telemetry) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                
                {/* TILE 1: WEATHER & THERMOSTAT (DISPLAY ONLY) */}
                <div className="apple-squircle glass-tile-active p-4 flex flex-col justify-between min-h-[120px] select-none cursor-default">
                  <div className="flex items-start justify-between">
                    <div className="text-3xl sm:text-4xl font-extrabold text-[#ff9500] tracking-tight">
                      {Math.round((state.temperatureC * 9) / 5 + 32)}°
                    </div>
                    {/* Live Weather Indication Badge */}
                    {state.rainDetected ? (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 text-[10px] sm:text-[11px] font-bold">
                        <svg className="w-3.5 h-3.5 text-blue-600 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
                          <path d="M8 19v2M12 21v2M16 19v2" />
                        </svg>
                        <span>Rain Showers</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 text-[10px] sm:text-[11px] font-bold">
                        <svg className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '10s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="4" />
                          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                        </svg>
                        <span>Partly Cloudy</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 tracking-tight">Thermostat & Weather</h4>
                    <p className="text-xs font-medium text-slate-600">
                      {state.temperatureC.toFixed(1)}°C • {state.rainDetected ? 'Precipitation' : 'Dry & Sunny'}
                    </p>
                  </div>
                </div>

                {/* TILE 2: HUMIDITY (DISPLAY ONLY) */}
                <div className="apple-squircle glass-tile-inactive p-4 flex flex-col justify-between min-h-[120px] select-none cursor-default">
                  <div className="flex items-start justify-between">
                    <div className="text-3xl sm:text-4xl font-extrabold text-[#5ac8fa] tracking-tight">
                      {state.humidityPercent.toFixed(0)}%
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 text-[10px] font-bold tracking-wide uppercase">
                      {state.humidityPercent > 75 ? 'Damp Air' : 'Optimal'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white tracking-tight">Relative Humidity</h4>
                    <p className="text-xs font-medium text-white/60">
                      {state.humidityPercent > 75 ? 'High Moisture (Slow)' : 'Ideal for Air-Drying'}
                    </p>
                  </div>
                </div>

                {/* TILE 3: RAIN SENSOR TELEMETRY (DISPLAY ONLY) */}
                <div className="apple-squircle glass-tile-inactive p-3.5 flex items-center justify-between gap-3 select-none cursor-default">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      state.rainDetected ? 'bg-[#007aff] text-white shadow-md' : 'bg-white/15 text-white/70'
                    }`}>
                      <CloudRain size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white tracking-tight truncate">Rain Sensor</h4>
                      <p className="text-xs font-medium text-white/60 truncate">
                        {state.rainDetected ? 'Rain Detected' : 'Dry Outdoor'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    state.rainDetected ? 'bg-blue-500/30 text-blue-300 border border-blue-400/40' : 'bg-green-500/20 text-green-300 border border-green-500/30'
                  }`}>
                    {state.rainDetected ? 'WET' : 'DRY'}
                  </span>
                </div>

                {/* TILE 4: LAUNDRY LOAD CELL TELEMETRY (DISPLAY ONLY) */}
                <div className="apple-squircle glass-tile-inactive p-3.5 flex items-center justify-between gap-3 select-none cursor-default">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      state.laundryLoadKg > 5.0
                        ? 'bg-[#ff3b30] text-white shadow-md'
                        : state.laundryLoadKg >= 4.5
                        ? 'bg-[#ff9500] text-white shadow-md'
                        : 'bg-white/15 text-white/70'
                    }`}>
                      <span className="font-extrabold text-xs">kg</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white tracking-tight truncate">Laundry Load</h4>
                      <p className="text-xs font-medium text-white/60 truncate">
                        {state.laundryLoadKg.toFixed(1)} kg • Max 5kg
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 border transition-colors ${
                    state.laundryLoadKg > 5.0
                      ? 'bg-red-500/20 text-red-300 border-red-500/30 font-bold'
                      : state.laundryLoadKg >= 4.5
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                      : 'text-white/60 bg-white/10 border-white/10'
                  }`}>
                    {Math.round((state.laundryLoadKg / 5.0) * 100)}%
                  </span>
                </div>

              </div>
            </div>

            {/* SCENES & DRYING MODES */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5 text-white/95 font-bold text-base sm:text-lg">
                  <span>Scenes & Modes</span>
                  <svg className="w-4 h-4 text-white/60" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs text-white/70">5 Presets</span>
              </div>

              <div className="space-y-2">
                {Object.entries(MODES).map(([name, cfg]) => {
                  const isSelected = state.selectedMode === name;
                  return (
                    <div
                      key={name}
                      onClick={() => sim.selectMode(name)}
                      className={`apple-squircle p-3.5 cursor-pointer transition-all duration-300 flex items-center justify-between select-none active:scale-[0.98] ${
                        isSelected ? 'glass-tile-active' : 'glass-tile-inactive'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#ff9500] text-white shadow-md' : 'bg-white/15 text-white'
                        }`}>
                          <Star size={14} className="fill-current" />
                        </div>
                        <div className="min-w-0">
                          <h4 className={`font-bold text-sm truncate ${isSelected ? 'text-slate-900' : 'text-white'}`}>
                            {name}
                          </h4>
                          <p className={`text-[11px] truncate ${isSelected ? 'text-slate-500' : 'text-white/60'}`}>
                            Fan: {FAN_LABELS[cfg.fan]} • {cfg.timer} mins cycle
                          </p>
                        </div>
                      </div>

                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        isSelected ? 'bg-slate-100 text-slate-800' : 'bg-white/10 text-white/80'
                      }`}>
                        {cfg.timer}m
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AUTOMATIONS & TESTING */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5 text-white/95 font-bold text-base sm:text-lg">
                  <span>Automations & Safety</span>
                  <svg className="w-4 h-4 text-white/60" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs text-white/70">ENT600 Demo</span>
              </div>

              {/* SCENE DEMO: 3-TIER POWER & SYSTEM STATE DEMO SWITCHER */}
              <div className="mb-2.5 p-3 rounded-2xl bg-black/25 backdrop-blur-xl border border-white/15">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white/95">⚡ Scene Demo: Power State</span>
                  <span className="text-[10px] font-mono font-bold text-[#5ac8fa]">Active: {powerState}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => sim.setPowerStateDemo('Standby')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition active:scale-95 border flex items-center justify-center gap-1.5 ${
                      powerState === 'Standby'
                        ? 'bg-[#34c759] text-slate-950 border-[#34c759] shadow-md font-bold'
                        : 'bg-white/10 hover:bg-white/20 text-white/80 border-white/10'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${powerState === 'Standby' ? 'bg-slate-950' : 'bg-[#34c759]'}`}></span>
                    <span>Standby</span>
                  </button>
                  <button
                    onClick={() => sim.setPowerStateDemo('Online')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition active:scale-95 border flex items-center justify-center gap-1.5 ${
                      powerState === 'Online'
                        ? 'bg-[#00c7be] text-slate-950 border-[#00c7be] shadow-md font-bold'
                        : 'bg-white/10 hover:bg-white/20 text-white/80 border-white/10'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${powerState === 'Online' ? 'bg-slate-950' : 'bg-[#00c7be]'}`}></span>
                    <span>Online</span>
                  </button>
                  <button
                    onClick={() => sim.setPowerStateDemo('Offline')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition active:scale-95 border flex items-center justify-center gap-1.5 ${
                      powerState === 'Offline'
                        ? 'bg-slate-400 text-slate-950 border-slate-400 shadow-md font-bold'
                        : 'bg-white/10 hover:bg-white/20 text-white/80 border-white/10'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${powerState === 'Offline' ? 'bg-slate-950' : 'bg-slate-500'}`}></span>
                    <span>Offline</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => sim.simulateRain(!state.rainDetected)}
                  className="apple-squircle p-3 bg-black/25 backdrop-blur-xl border border-white/15 hover:bg-black/35 text-left transition active:scale-95"
                >
                  <div className="text-xs font-bold text-white">🌧 Test Rain Sensor</div>
                  <div className="text-[11px] text-white/60">{state.rainDetected ? 'Clear Weather' : 'Simulate Rain (25%)'}</div>
                </button>

                <button
                  onClick={() => sim.simulateObstacle(!state.obstacleDetected)}
                  className="apple-squircle p-3 bg-black/25 backdrop-blur-xl border border-white/15 hover:bg-black/35 text-left transition active:scale-95"
                >
                  <div className="text-xs font-bold text-white">⚠ Test Obstacle Lock</div>
                  <div className="text-[11px] text-white/60">{state.obstacleDetected ? 'Clear Obstacle' : 'Trigger Obstacle'}</div>
                </button>

                <button
                  onClick={sim.toggleAutoRain}
                  className="apple-squircle p-3 bg-black/25 backdrop-blur-xl border border-white/15 hover:bg-black/35 text-left transition active:scale-95"
                >
                  <div className="text-xs font-bold text-white">☂ Auto Rain Guard</div>
                  <div className="text-[11px] text-white/60">{state.autoRainProtection ? 'Enabled (25% Safe)' : 'Disabled'}</div>
                </button>

                <button
                  onClick={sim.resetDemo}
                  className="apple-squircle p-3 bg-black/25 backdrop-blur-xl border border-white/15 hover:bg-black/35 text-left transition active:scale-95"
                >
                  <div className="text-xs font-bold text-white">↺ Reset All States</div>
                  <div className="text-[11px] text-white/60">Restore Defaults</div>
                </button>
              </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5 text-white/95 font-bold text-base sm:text-lg">
                  <span>Recent Activity</span>
                  <svg className="w-4 h-4 text-white/60" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </div>
                {alerts.length > 0 && (
                  <button onClick={sim.clearAlerts} className="text-xs text-white/70 hover:text-white underline">
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {alerts.map(a => (
                  <div
                    key={a.id}
                    className="apple-squircle-sm px-3.5 py-2 bg-black/30 backdrop-blur-xl border border-white/10 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        a.level === 'critical' ? 'bg-[#ff3b30]' :
                        a.level === 'high' ? 'bg-[#007aff]' : 'bg-[#34c759]'
                      }`}></span>
                      <span className="text-white/90 truncate">{a.message || a.text}</span>
                    </div>
                    <span className="text-[10px] text-white/50 shrink-0 font-mono">
                      {typeof a.time === 'object' && a.time.toLocaleTimeString ? a.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (a.time || '')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* FOOTER */}
        <footer className="text-center text-xs text-white/60 pt-4 pb-2">
          <p>CLOTHESLINE — SMART DRY • Designed with Apple HomeKit Human Interface Guidelines</p>
        </footer>

      </div>
    </div>
  );
}
