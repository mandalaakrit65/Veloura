/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sliders, RefreshCw, AudioLines, Sparkles } from 'lucide-react';
import { usePlayer, EQ_PRESETS } from '../context/PlayerContext';
import { synthPlayer } from '../utils/audioSynth';

export const EqualizerSettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    eqPreset,
    eqGains,
    setEqPreset,
    setEqGainValue
  } = usePlayer();

  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  if (!isSettingsOpen) return null;

  const bandLabels = [
    { name: 'Bass', freq: '60 Hz' },
    { name: 'Mid-Bass', freq: '230 Hz' },
    { name: 'Mids', freq: '910 Hz' },
    { name: 'Presence', freq: '4 kHz' },
    { name: 'Treble', freq: '14 kHz' }
  ];

  // Helper to generate a smooth SVG Bezier path connecting the five band levels
  const getSpectrumPath = () => {
    // Canvas dimensions: width=320, height=80
    // x values for the 5 points evenly distributed
    const xs = [35, 102, 170, 237, 305];
    // Map dB (-12 to +12) to y (65 to 15, where 0dB is 40)
    const ys = eqGains.map(gain => {
      if (!isEnabled) return 40; // Flat if EQ disabled
      const clamped = Math.max(-12, Math.min(12, gain));
      // -12dB is y=70, +12dB is y=10
      return 40 - (clamped / 12) * 30;
    });

    let d = `M 0,40 L ${xs[0]},${ys[0]}`;
    
    // Create smooth curved lines using Bezier controls
    for (let i = 0; i < xs.length - 1; i++) {
      const x1 = xs[i];
      const y1 = ys[i];
      const x2 = xs[i + 1];
      const y2 = ys[i + 1];
      const cpX1 = x1 + (x2 - x1) / 2;
      const cpY1 = y1;
      const cpX2 = x1 + (x2 - x1) / 2;
      const cpY2 = y2;
      d += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${x2},${y2}`;
    }
    
    d += ` L 340,40`;
    return d;
  };

  const handleReset = () => {
    setEqPreset('Flat');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" id="eq-modal-backdrop">
        {/* Click outside to close */}
        <div className="absolute inset-0" onClick={() => setIsSettingsOpen(false)} />

        {/* Modal Window Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-md bg-white/95 text-brand-dark rounded-t-[40px] px-6 pt-5 pb-8 shadow-2xl border-t border-white/60 backdrop-blur-xl z-50 flex flex-col gap-5 select-none"
          id="eq-modal-panel"
        >
          {/* Top Decorative drag handle pill */}
          <div className="w-12 h-1 bg-brand-medium/20 rounded-full mx-auto mb-1" />

          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
                <Sliders size={18} />
              </div>
              <div>
                <h2 className="text-base font-black text-brand-dark tracking-tight leading-none flex items-center gap-1">
                  Audio Equalizer
                  <Sparkles size={12} className="text-brand-primary fill-brand-primary animate-pulse" />
                </h2>
                <p className="text-[10px] text-brand-medium font-bold tracking-wider uppercase mt-1">VELOURA ACOUSTIC LAB</p>
              </div>
            </div>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="p-2 hover:bg-brand-secondary/40 rounded-full transition-colors text-brand-medium"
              id="btn-close-eq-modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Equalizer Spectrum Curve Card */}
          <div className="relative h-28 bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 shadow-inner flex flex-col justify-end p-2">
            {/* Grid Lines background */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-10">
              <div className="border-b border-white w-full h-0" />
              <div className="border-b border-white w-full h-0 border-dashed" />
              <div className="border-b border-white w-full h-0" />
            </div>

            {/* Dynamic Bezier Spline */}
            <svg viewBox="0 0 340 80" className="w-full h-20 absolute top-4 left-0 right-0 pointer-events-none overflow-visible">
              <defs>
                <linearGradient id="eq-glow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6EC7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#7F00FF" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Colored fill area under spline */}
              <path
                d={`${getSpectrumPath()} L 340,80 L 0,80 Z`}
                fill="url(#eq-glow)"
                transition="all 0.25s ease"
              />
              {/* Spline stroke */}
              <path
                d={getSpectrumPath()}
                fill="none"
                stroke="url(#eq-line-grad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="transition-all duration-300"
              />
              <linearGradient id="eq-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF6EC7" />
                <stop offset="50%" stopColor="#A154F2" />
                <stop offset="100%" stopColor="#7F00FF" />
              </linearGradient>

              {/* Band handle visual markers */}
              {eqGains.map((gain, i) => {
                const xs = [35, 102, 170, 237, 305];
                const clamped = Math.max(-12, Math.min(12, gain));
                const y = isEnabled ? 40 - (clamped / 12) * 30 : 40;
                return (
                  <circle
                    key={i}
                    cx={xs[i]}
                    cy={y}
                    r="4.5"
                    fill="#FFFFFF"
                    stroke="#A154F2"
                    strokeWidth="2"
                    className="transition-all duration-300 shadow-sm"
                  />
                );
              })}
            </svg>

            {/* Band frequency labels displayed on bottom inside screen */}
            <div className="flex justify-between px-3 text-[8px] font-bold text-stone-500 font-mono tracking-wider z-10 select-none">
              <span>60Hz</span>
              <span>230Hz</span>
              <span>910Hz</span>
              <span>4kHz</span>
              <span>14kHz</span>
            </div>
          </div>

          {/* Preset Pill Selector Carousel */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-brand-medium uppercase tracking-widest">Sound Profiles</span>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-[9px] font-extrabold text-brand-primary hover:text-brand-dark transition-colors"
                id="btn-reset-eq"
              >
                <RefreshCw size={10} />
                RESET TO FLAT
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x" id="eq-presets-carousel">
              {Object.keys(EQ_PRESETS).map(name => {
                const isActive = eqPreset === name;
                return (
                  <button
                    key={name}
                    onClick={() => setEqPreset(name)}
                    className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-[10px] font-extrabold tracking-wider uppercase transition-all duration-200 snap-start border ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-primary to-brand-primary/80 text-white shadow-md border-transparent scale-105'
                        : 'bg-white border-brand-secondary/40 hover:border-brand-primary/40 hover:bg-brand-secondary/10 text-brand-dark shadow-sm'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
              {eqPreset === 'Custom' && (
                <button
                  className="flex-shrink-0 px-3.5 py-2 rounded-xl text-[10px] font-extrabold tracking-wider uppercase transition-all duration-200 snap-start bg-gradient-to-r from-[#A154F2] to-[#7F00FF] text-white shadow-md border-transparent scale-105"
                >
                  Custom
                </button>
              )}
            </div>
          </div>

          {/* Equalizer Sliders Row */}
          <div className="flex justify-between items-stretch gap-2 bg-white/50 border border-brand-secondary/20 p-4 rounded-3xl shadow-sm h-52">
            {bandLabels.map((band, idx) => {
              const gain = eqGains[idx] ?? 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-between" id={`eq-band-control-${idx}`}>
                  {/* Slider Gain Text Value Label */}
                  <span className="text-[10px] font-black font-mono text-brand-primary">
                    {gain > 0 ? `+${gain}` : gain}dB
                  </span>

                  {/* Vertical Range Slider Input Container */}
                  <div className="relative h-28 w-6 flex items-center justify-center my-1.5">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={gain}
                      disabled={!isEnabled}
                      onChange={(e) => {
                        if (isEnabled) {
                          setEqGainValue(idx, parseInt(e.target.value, 10));
                        }
                      }}
                      style={{
                        writingMode: 'vertical-lr',
                        direction: 'rtl',
                        WebkitAppearance: 'slider-vertical',
                      }}
                      className="h-full w-2.5 rounded-lg accent-brand-primary cursor-ns-resize opacity-90 disabled:opacity-30 disabled:cursor-not-allowed bg-brand-secondary/40 transition-opacity"
                    />
                  </div>

                  {/* Frequency Labels */}
                  <div className="text-center">
                    <p className="text-[9px] font-black text-brand-dark leading-tight">{band.name}</p>
                    <p className="text-[8px] text-brand-medium font-bold font-mono">{band.freq}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* A/B Test Master Bypass Toggle Section */}
          <div className="flex items-center justify-between bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-3">
            <div className="flex items-center gap-2">
              <AudioLines size={15} className="text-brand-primary animate-pulse" />
              <div>
                <p className="text-[10px] font-black text-brand-dark uppercase tracking-tight">Master EQ Bypass</p>
                <p className="text-[8px] text-brand-medium font-medium mt-0.5">Toggle sound enhancement algorithm</p>
              </div>
            </div>
            
            {/* Toggle Switch */}
            <button
              onClick={() => {
                const nextVal = !isEnabled;
                setIsEnabled(nextVal);
                if (nextVal) {
                  synthPlayer.setEqGains(eqGains);
                } else {
                  synthPlayer.setEqGains([0, 0, 0, 0, 0]); // bypass: set flat
                }
              }}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ${
                isEnabled ? 'bg-brand-primary' : 'bg-brand-secondary'
              }`}
              id="btn-eq-master-toggle"
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${
                  isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
