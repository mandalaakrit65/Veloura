/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Bluetooth, ChevronDown, Volume2, Play, Pause, SkipForward, SkipBack, Settings } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const AndroidFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentSong, isPlaying, togglePlay, nextTrack, prevTrack, progress, duration, setIsSettingsOpen } = usePlayer();
  const [time, setTime] = useState<string>('12:00');
  const [batteryLevel, setBatteryLevel] = useState<number>(88);
  const [isShadeOpen, setIsShadeOpen] = useState<boolean>(false);

  // Keep clock updated
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const mins = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setTime(`${hours}:${mins} ${ampm}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 30000); // 30s
    return () => clearInterval(interval);
  }, []);

  // Format seconds to string
  const formatSeconds = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[9/19] bg-stone-900 rounded-[48px] p-3.5 shadow-2xl border-4 border-stone-800 flex flex-col select-none overflow-hidden" id="android-device-frame">
      {/* Front camera notch */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50 flex items-center justify-center">
        <div className="w-3.5 h-3.5 bg-zinc-900 rounded-full border border-zinc-800 ml-auto mr-4" />
      </div>

      {/* Screen Container */}
      <div className="relative flex-1 bg-gradient-to-br from-[#FFD6F3]/50 via-[#FAF7F9]/90 to-[#F5E6FF]/60 backdrop-blur-xl rounded-[38px] overflow-hidden flex flex-col pt-9 pb-4 border border-white/40 shadow-neumorphic-large">
        
        {/* Android Status Bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-9 px-6 flex items-center justify-between z-40 bg-white/20 text-brand-dark text-xs font-semibold cursor-pointer select-none hover:bg-white/40 transition-all border-b border-white/30 backdrop-blur-sm"
          onClick={() => setIsShadeOpen(true)}
          title="Pull down notification shade"
          id="android-status-bar"
        >
          <span>{time.split(' ')[0]}</span>
          
          <div className="flex items-center gap-2">
            <Bluetooth size={13} className="text-brand-medium" />
            <Wifi size={13} className="text-brand-medium" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-brand-medium">{batteryLevel}%</span>
              <Battery size={14} className="text-brand-medium rotate-90 origin-center" />
            </div>
          </div>
        </div>

        {/* Swipe Down Notification Shade */}
        {isShadeOpen && (
          <div className="absolute inset-0 bg-[#4A4458]/40 backdrop-blur-md z-50 flex flex-col justify-start animate-fade-in" id="notification-shade">
            <div className="w-full bg-white/80 text-brand-dark rounded-b-[32px] p-6 pt-12 shadow-neumorphic-large border-b border-white/50 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold tracking-wider text-brand-medium">VELOURA SYSTEM SHADE</span>
                <button 
                  onClick={() => setIsShadeOpen(false)}
                  className="p-1 hover:bg-brand-secondary/40 rounded-full transition-colors"
                  id="btn-close-shade"
                >
                  <ChevronDown size={20} className="text-brand-dark" />
                </button>
              </div>

              {/* Media Notification Controller */}
              {currentSong ? (
                <div className="bg-white/60 rounded-2xl p-4 border border-white/70 flex flex-col gap-3 shadow-neumorphic-medium">
                  <div className="flex items-center gap-3">
                    <img 
                      src={currentSong.albumArt} 
                      alt="album-art" 
                      className="w-12 h-12 rounded-xl object-cover border border-white/50 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-brand-dark truncate">{currentSong.title}</h4>
                      <p className="text-xs text-brand-medium truncate">{currentSong.artist}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={prevTrack} className="p-1.5 hover:bg-white/50 rounded-lg transition-colors text-brand-medium">
                        <SkipBack size={16} />
                      </button>
                      <button onClick={togglePlay} className="p-2 bg-brand-primary hover:scale-105 active:scale-95 rounded-full transition-all text-white shadow-md">
                        {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" className="translate-x-[1px]" />}
                      </button>
                      <button onClick={nextTrack} className="p-1.5 hover:bg-white/50 rounded-lg transition-colors text-brand-medium">
                        <SkipForward size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Progress slide */}
                  <div className="flex flex-col gap-1">
                    <div className="h-1.5 bg-brand-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-primary rounded-full" 
                        style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-brand-medium font-mono font-medium">
                      <span>{formatSeconds(progress)}</span>
                      <span>{formatSeconds(duration)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/40 rounded-2xl p-6 border border-white/50 text-center text-brand-medium text-xs shadow-neumorphic-inset">
                  No active audio playback in background.
                </div>
              )}

              {/* Mock System Settings Panel */}
              <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                <div className="flex flex-col items-center gap-1.5 p-2 bg-white/50 border border-white/40 rounded-xl shadow-sm text-brand-primary font-medium">
                  <Wifi size={18} />
                  <span className="text-[10px]">Wi-Fi</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2 bg-white/50 border border-white/40 rounded-xl shadow-sm text-brand-primary font-medium">
                  <Bluetooth size={18} />
                  <span className="text-[10px]">Bluetooth</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2 bg-white/30 border border-white/20 rounded-xl shadow-sm text-brand-medium">
                  <Volume2 size={18} />
                  <span className="text-[10px]">Volume</span>
                </div>
                <div 
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsShadeOpen(false);
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 bg-white/30 hover:bg-brand-primary/10 border border-white/20 hover:border-brand-primary/30 rounded-xl shadow-sm text-brand-medium cursor-pointer transition-all"
                  id="btn-shade-settings"
                >
                  <Settings size={18} />
                  <span className="text-[10px]">Settings</span>
                </div>
              </div>
            </div>

            {/* Click outside bottom half of screen to close */}
            <div className="flex-1" onClick={() => setIsShadeOpen(false)} />
          </div>
        )}

        {/* Content Panel */}
        <div className="flex-1 flex flex-col overflow-y-auto relative px-5" id="android-screen-content">
          {children}
        </div>

        {/* Android Navigation Bar */}
        <div className="h-6 flex items-center justify-center gap-16 bg-transparent z-40 select-none">
          <button className="w-3.5 h-3.5 border-2 border-brand-medium rounded-sm rotate-45 hover:border-brand-primary hover:scale-110 transition-all" title="Android Back" />
          <button className="w-4 h-4 border-2 border-brand-medium rounded-full hover:border-brand-primary hover:scale-110 transition-all" title="Android Home" />
          <button className="w-3.5 h-3.5 border-2 border-brand-medium rounded-md hover:border-brand-primary hover:scale-110 transition-all" title="Android App Switcher" />
        </div>
      </div>
    </div>
  );
};
