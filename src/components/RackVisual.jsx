import React from 'react';

export default function RackVisual({ rodPercent, fanSpeed, motorStatus, rainDetected, laundryLoadKg, obstacleDetected, systemPower = true }) {
  const rodExtension = (rodPercent / 100) * 160;
  const hasClothes = laundryLoadKg > 0;
  const powerState = !systemPower
    ? 'Offline'
    : (fanSpeed > 0 || motorStatus === 'Moving')
    ? 'Online'
    : 'Standby';

  return (
    <div className="apple-squircle glass-tile-inactive p-4 sm:p-5 relative overflow-hidden">
      {/* Rain overlay */}
      {rainDetected && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="rain-drop absolute w-0.5 bg-blue-300/80 rounded-full"
              style={{
                left: `${5 + Math.random() * 90}%`,
                top: `-10px`,
                height: `${12 + Math.random() * 8}px`,
                animationDelay: `${Math.random() * 0.8}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Title / Header Bar */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${
            motorStatus === 'Moving' ? 'bg-[#007aff] animate-ping' :
            motorStatus === 'Fault' || motorStatus === 'Stopped' ? 'bg-[#ff3b30]' : 'bg-[#34c759]'
          }`}></span>
          <span className="font-semibold text-white/90">Motor: {motorStatus}</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs bg-black/40 px-2.5 py-0.5 rounded-full text-white/90 border border-white/10">
          <span>Extension:</span>
          <strong className="text-[#32ade6]">{Math.round(rodPercent)}%</strong>
        </div>
      </div>

      {/* SVG Rack Visualization */}
      <svg viewBox="0 0 400 220" className="w-full h-auto select-none rounded-2xl bg-black/40 border border-white/10" style={{ maxHeight: '240px' }}>
        {/* Roof / shelter zone */}
        <rect x="0" y="0" width="100" height="220" fill="rgba(0, 0, 0, 0.35)" />
        <rect x="0" y="0" width="100" height="220" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" strokeDasharray="4 4" />

        <text x="50" y="20" textAnchor="middle" fill="rgba(255, 255, 255, 0.6)" fontSize="8" fontWeight="700" letterSpacing="0.8">SHELTERED</text>

        {/* ─── MAIN UNIT WITH INTEGRATED FAN & SMART DRY LABELS ─── */}
        <g>
          {/* Main Wall Mount Unit Housing */}
          <rect x="10" y="38" width="34" height="142" rx="8" fill="#242c3d" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" />
          
          {/* "SMART" Label */}
          <rect x="14" y="44" width="26" height="11" rx="3" fill="#0f172a" />
          <text x="27" y="52" textAnchor="middle" fill="#5ac8fa" fontSize="6.5" fontWeight="800">SMART</text>

          {/* ─── HIGH-TECH SPINNING FAN TURBINE IN MAIN UNIT (BETWEEN SMART & DRY) ─── */}
          <g transform="translate(27, 74)">
            {/* Fan circular vent housing */}
            <circle r="13" fill="#0b1322" stroke="#00c7be" strokeWidth="1.5" />
            <circle r="10.5" fill="#141e33" stroke="rgba(255,255,255,0.15)" strokeWidth="0.7" />
            
            {/* Spinning Fan Impeller */}
            <g className={fanSpeed > 0 ? (fanSpeed === 1 ? 'fan-low' : fanSpeed === 2 ? 'fan-medium' : 'fan-high') : ''} style={{ transformOrigin: '0px 0px' }}>
              <circle cx="0" cy="0" r="2.2" fill="#ffffff" />
              <path d="M0,-2 V-8.5 a1.8,1.8 0 0 1 3.6,0 c0,2.6 -2,4.8 -3.6,4.8 z" fill="#5ac8fa" />
              <path d="M2,0 H8.5 a1.8,1.8 0 0 1 0,3.6 c-2.6,0 -4.8,-2 -4.8,-3.6 z" fill="#5ac8fa" />
              <path d="M0,2 V8.5 a1.8,1.8 0 0 1 -3.6,0 c0,-2.6 2,-4.8 3.6,-4.8 z" fill="#5ac8fa" />
              <path d="M-2,0 H-8.5 a1.8,1.8 0 0 1 0,-3.6 c2.6,0 4.8,2 4.8,3.6 z" fill="#5ac8fa" />
            </g>
            {/* Louver lines on right edge */}
            <line x1="11" y1="-5" x2="13" y2="-5" stroke="#00c7be" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="12" y1="0" x2="14" y2="0" stroke="#00c7be" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="11" y1="5" x2="13" y2="5" stroke="#00c7be" strokeWidth="1.2" strokeLinecap="round" />
          </g>

          {/* "DRY" Label */}
          <rect x="14" y="93" width="26" height="11" rx="3" fill="#0f172a" />
          <text x="27" y="101" textAnchor="middle" fill="#5ac8fa" fontSize="6.5" fontWeight="800">DRY</text>

          {/* Power Status LED (Dynamic: Standby / Online / Offline) */}
          <circle
            cx="27"
            cy="115"
            r="3.5"
            fill={powerState === 'Online' ? '#00c7be' : powerState === 'Standby' ? '#34c759' : '#64748b'}
          />
          <text x="27" y="126" fill="rgba(255,255,255,0.7)" fontSize="5" fontWeight="700" textAnchor="middle">
            {powerState.toUpperCase()}
          </text>

          {/* Motor Actuator Unit */}
          <g transform="translate(27, 148)">
            <circle r="9" fill="#0f172a" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <text x="0" y="2.5" fill="rgba(255,255,255,0.7)" fontSize="5" fontWeight="700" textAnchor="middle">MOTOR</text>
          </g>
        </g>

        {/* ─── 3 RETRACTABLE RODS & PRECISELY ANCHORED CLOTHES ─── */}
        {[0, 1, 2].map((i) => {
          const y = 80 + i * 36;
          const swayClass = fanSpeed === 0 ? 'sway-idle' : fanSpeed === 1 ? 'sway-low' : fanSpeed === 2 ? 'sway-med' : 'sway-high';

          return (
            <g key={i}>
              {/* Rod track */}
              <line x1="44" y1={y} x2="44" y2={y} stroke="#334155" strokeWidth="2" />
              {/* Rod */}
              <line
                x1="44"
                y1={y}
                x2={44 + rodExtension}
                y2={y}
                stroke={obstacleDetected ? '#ef4444' : '#60a5fa'}
                strokeWidth="3.5"
                strokeLinecap="round"
                className="rod-animate"
              />
              {/* Rod tip */}
              <circle
                cx={44 + rodExtension}
                cy={y}
                r="3.5"
                fill={obstacleDetected ? '#ef4444' : '#38bdf8'}
                stroke="#ffffff"
                strokeWidth="1"
                className="rod-animate"
              />

              {/* ─── REALISTIC HANGING LAUNDRY ON RODS ─── */}
              {hasClothes && rodPercent > 5 && (
                <g>
                  {/* TOP ROD: Cyan T-Shirt & Vibrant Orange Folded Towel */}
                  {i === 0 && (
                    <>
                      {/* Item A: Cyan T-Shirt on wire hanger */}
                      <g
                        transform={`translate(${44 + rodExtension * 0.38}, ${y})`}
                        style={{ opacity: Math.max(0, Math.min(0.95, (rodPercent - 10) / 20)), transition: 'opacity 0.3s ease-out' }}
                      >
                        <g className={swayClass} style={{ transformOrigin: '0px 0px' }}>
                          <path d="M0,0 Q-1.5,-3 0,-5 Q2,-7 4,-5 Q5,-2 1,-1" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                          <path d="M-10,2 L0,-1 L10,2" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" />
                          <path
                            d="M-10,2 L-14,7 L-10,9 L-8,5 L-8,20 L8,20 L8,5 L10,9 L14,7 L10,2 C6,4 -6,4 -10,2 Z"
                            fill="#00c7be"
                            stroke="#5ce5df"
                            strokeWidth="1"
                            opacity="0.95"
                          />
                        </g>
                      </g>

                      {/* Item B: Orange Towel with Fluid Wave */}
                      <g
                        transform={`translate(${44 + rodExtension * 0.74}, ${y})`}
                        style={{ opacity: Math.max(0, Math.min(0.95, (rodPercent - 18) / 24)), transition: 'opacity 0.35s ease-out' }}
                      >
                        <g className={`${swayClass} orange-fluid`} style={{ transformOrigin: '0px 0px', animationDelay: '0.2s' }}>
                          <rect x="-7" y="-2" width="14" height="4" rx="2" fill="#ffaa33" />
                          <rect x="-6" y="2" width="12" height="18" rx="1.5" fill="#ff9500" stroke="#ffaa33" strokeWidth="1" opacity="0.95" />
                          <line x1="-5" y1="15" x2="5" y2="15" stroke="#ffe082" strokeWidth="0.8" />
                          <line x1="-5" y1="17" x2="5" y2="17" stroke="#ffe082" strokeWidth="0.8" />
                        </g>
                      </g>
                    </>
                  )}

                  {/* MIDDLE ROD: Purple T-Shirt & Teal Washcloth */}
                  {i === 1 && (
                    <>
                      {/* Item C: Purple T-Shirt */}
                      <g
                        transform={`translate(${44 + rodExtension * 0.48}, ${y})`}
                        style={{ opacity: Math.max(0, Math.min(0.95, (rodPercent - 12) / 22)), transition: 'opacity 0.3s ease-out' }}
                      >
                        <g className={swayClass} style={{ transformOrigin: '0px 0px', animationDelay: '0.15s' }}>
                          <path d="M0,0 Q-1.5,-3 0,-5 Q2,-7 4,-5 Q5,-2 1,-1" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                          <path d="M-10,2 L0,-1 L10,2" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" />
                          <path
                            d="M-10,2 L-14,7 L-10,9 L-8,5 L-8,20 L8,20 L8,5 L10,9 L14,7 L10,2 C6,4 -6,4 -10,2 Z"
                            fill="#af52de"
                            stroke="#d084f7"
                            strokeWidth="1"
                            opacity="0.95"
                          />
                        </g>
                      </g>

                      {/* Item D: Teal Hand Towel */}
                      <g
                        transform={`translate(${44 + rodExtension * 0.82}, ${y})`}
                        style={{ opacity: Math.max(0, Math.min(0.95, (rodPercent - 22) / 25)), transition: 'opacity 0.3s ease-out' }}
                      >
                        <g className={swayClass} style={{ transformOrigin: '0px 0px', animationDelay: '0.25s' }}>
                          <rect x="-6" y="-2" width="12" height="4" rx="2" fill="#5ce5df" />
                          <rect x="-5" y="2" width="10" height="16" rx="1.5" fill="#00c7be" stroke="#5ce5df" strokeWidth="1" opacity="0.9" />
                        </g>
                      </g>
                    </>
                  )}

                  {/* BOTTOM ROD: Orange Drying Shorts & Purple Washcloth */}
                  {i === 2 && (
                    <>
                      {/* Item E: Orange Shorts with Pegs */}
                      <g
                        transform={`translate(${44 + rodExtension * 0.36}, ${y})`}
                        style={{ opacity: Math.max(0, Math.min(0.95, (rodPercent - 10) / 20)), transition: 'opacity 0.35s ease-out' }}
                      >
                        <g className={`${swayClass} orange-fluid`} style={{ transformOrigin: '0px 0px', animationDelay: '0.1s' }}>
                          <rect x="-5" y="-2.5" width="1.8" height="4" rx="0.5" fill="#f1f5f9" />
                          <rect x="3" y="-2.5" width="1.8" height="4" rx="0.5" fill="#f1f5f9" />
                          <path
                            d="M-6,1 L6,1 L5,14 L1,14 L0,7 L-1,14 L-5,14 Z"
                            fill="#ff9500"
                            stroke="#ffaa33"
                            strokeWidth="1"
                            opacity="0.95"
                          />
                        </g>
                      </g>

                      {/* Item F: Purple Washcloth */}
                      <g
                        transform={`translate(${44 + rodExtension * 0.70}, ${y})`}
                        style={{ opacity: Math.max(0, Math.min(0.95, (rodPercent - 16) / 22)), transition: 'opacity 0.3s ease-out' }}
                      >
                        <g className={swayClass} style={{ transformOrigin: '0px 0px', animationDelay: '0.3s' }}>
                          <rect x="-5" y="-2" width="10" height="4" rx="2" fill="#d084f7" />
                          <rect x="-4.5" y="2" width="9" height="14" rx="1.5" fill="#af52de" stroke="#d084f7" strokeWidth="1" opacity="0.9" />
                        </g>
                      </g>
                    </>
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* ─── STRAIGHT HORIZONTAL AIRFLOW STREAMS ACROSS THE RACK (UNBENT) ─── */}
        {fanSpeed > 0 && rodPercent > 5 && (
          <g opacity={fanSpeed === 1 ? 0.5 : fanSpeed === 2 ? 0.8 : 1.0}>
            {[
              { y: 74, delay: '0s', w: '1.2' },
              { y: 80, delay: '0.1s', w: '1.8' },
              { y: 98, delay: '0.05s', w: '1.2' },
              { y: 116, delay: '0.15s', w: '1.8' },
              { y: 134, delay: '0.08s', w: '1.2' },
              { y: 152, delay: '0.2s', w: '1.8' }
            ].map((line, idx) => (
              <line
                key={idx}
                x1="41"
                y1={line.y}
                x2={44 + rodExtension * 0.98}
                y2={line.y}
                stroke="#60a5fa"
                strokeWidth={line.w}
                strokeDasharray="8 5"
                strokeLinecap="round"
                className={fanSpeed === 3 ? "wind-streaming-fast" : "wind-streaming"}
                style={{ animationDelay: line.delay }}
              />
            ))}
          </g>
        )}

        {/* Sheltered position marker (Orange Rain-Safe indicator) */}
        <g>
          <line
            x1={44 + (25 / 100) * 160}
            y1="50"
            x2={44 + (25 / 100) * 160}
            y2="185"
            stroke="#ff9500"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            className={rainDetected ? 'rain-safe-flowing' : ''}
            opacity={rodPercent <= 25 ? '1' : '0.6'}
            style={{ transition: 'opacity 0.3s ease-out' }}
          />
          <text
            x={44 + (25 / 100) * 160}
            y="196"
            textAnchor="middle"
            fill="#ff9500"
            fontSize="8"
            fontWeight="800"
            opacity={rodPercent <= 25 ? '1' : '0.8'}
            style={{ transition: 'opacity 0.3s ease-out' }}
          >
            Rain-safe
          </text>
          {rodPercent <= 25 && (
            <circle
              cx={44 + (25 / 100) * 160}
              cy="50"
              r="2.5"
              fill="#ff9500"
              className="animate-ping"
              opacity="0.8"
            />
          )}
        </g>

        {/* Extension percentage label on top rod tip */}
        <text
          x={44 + rodExtension + 12}
          y="84"
          fill="#ffffff"
          fontSize="11"
          fontWeight="800"
          fontFamily="SF Pro Display, -apple-system, sans-serif"
          className="rod-animate select-none"
        >
          {Math.round(rodPercent)}%
        </text>

        {/* Obstacle warning */}
        {obstacleDetected && (
          <g>
            <rect x={34 + rodExtension} y="55" width="60" height="20" rx="4" fill="#991b1b" />
            <text x={64 + rodExtension} y="68" textAnchor="middle" fill="#fca5a5" fontSize="8" fontFamily="Inter">⚠ OBSTACLE</text>
          </g>
        )}
      </svg>
    </div>
  );
}
