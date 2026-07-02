/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Pause, ChevronUp, Music } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const MiniPlayer: React.FC = () => {
  const { currentSong, isPlaying, togglePlay, navigateTo, currentView } = usePlayer();

  if (!currentSong || currentView === 'now-playing') return null;

  return (
    <div 
      onClick={() => navigateTo('now-playing')}
      className="absolute bottom-[30px] inset-x-6 h-[54px] bg-white/70 backdrop-blur-lg rounded-full shadow-neumorphic-medium border border-white/50 flex items-center justify-between pl-3 pr-4 cursor-pointer hover:bg-white/90 active:scale-[0.99] transition-all z-40 animate-slide-up"
      id="floating-mini-player"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Rounded circular Play/Pause button left */}
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Avoid triggering navigation
            togglePlay();
          }}
          className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white shadow-md hover:scale-105 active:scale-95 transition-all"
          id="btn-mini-play"
        >
          {isPlaying ? (
            <Pause size={14} fill="white" />
          ) : (
            <Play size={14} fill="white" className="translate-x-[1px]" />
          )}
        </button>

        {/* Title and artist details */}
        <div className="min-w-0">
          <span className="text-[9px] text-brand-primary font-extrabold uppercase tracking-widest block leading-none">{currentSong.artist}</span>
          <h4 className="text-xs font-black text-brand-dark truncate mt-0.5 leading-none">
            {currentSong.title}
          </h4>
        </div>
      </div>

      {/* Expand Chevron right */}
      <div className="flex items-center text-brand-medium pl-4">
        <ChevronUp size={16} className="animate-bounce" />
      </div>
    </div>
  );
};
