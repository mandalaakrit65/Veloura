/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Heart, Repeat, Shuffle, MoreHorizontal, ChevronDown, Play, Pause, SkipForward, SkipBack, ListMusic, Clock, Gauge, Sliders, Rewind, FastForward } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const NOW_PLAYING_THEME_CLASSES = [
  'from-[#FF6EC7]/20 via-[#A154F2]/5 to-transparent',
  'from-[#8A2387]/20 via-[#E94057]/5 to-transparent',
  'from-[#11998E]/20 via-[#1B4D3E]/5 to-transparent',
  'from-[#2193B0]/20 via-[#1D2A44]/5 to-transparent',
  'from-[#7F00FF]/20 via-[#3F007F]/5 to-transparent',
  'from-[#E65C00]/20 via-[#5A1A00]/5 to-transparent'
];

const getThemeIndex = (title: string, artist: string): number => {
  const cleanTitle = (title || 'Track').trim();
  const cleanArtist = (artist || 'Artist').trim();
  let hash = 0;
  const str = cleanTitle + cleanArtist;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 6;
};

export const NowPlaying: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    playbackRate,
    shuffle,
    repeatMode,
    activeQueue,
    songs,
    playlists,
    favorites,
    sleepTimer,
    
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    changeVolume,
    changeSpeed,
    toggleShuffle,
    toggleRepeatMode,
    toggleFavorite,
    setSleepTimerDuration,
    navigateTo,
    setIsSettingsOpen
  } = usePlayer();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);
  const [isSleepOpen, setIsSleepOpen] = useState(false);

  // Gesture Swipe State
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;

    // Detect horizontal swipes (Threshold: 50px)
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 50) {
        // Swipe Left = Next Song
        nextTrack();
      } else if (diffX < -50) {
        // Swipe Right = Previous Song
        prevTrack();
      }
    } else {
      // Detect vertical swipes
      if (diffY < -60) {
        // Swipe Down = Minimize to Home
        navigateTo('home');
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (!currentSong) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-10" id="now-playing-empty">
        <p className="text-zinc-400 text-sm">Select a song to start playing.</p>
      </div>
    );
  }

  // Format seconds to text
  const formatSeconds = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const themeIdx = getThemeIndex(currentSong.title, currentSong.artist);

  return (
    <div 
      className="flex-1 flex flex-col justify-between py-1 relative select-none animate-slide-up overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      id="now-playing-view"
    >
      {/* Ambient Artwork Glow */}
      <div className={`absolute -inset-10 bg-gradient-to-b ${NOW_PLAYING_THEME_CLASSES[themeIdx]} blur-3xl opacity-90 pointer-events-none -z-10`} />

      {/* Top Header */}
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={() => navigateTo('home')}
          className="p-2 bg-white/50 hover:bg-white/80 rounded-full shadow-neumorphic-medium text-brand-dark transition-all border border-white/60"
          id="btn-np-back"
          title="Minimize"
        >
          <ChevronDown size={18} />
        </button>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-medium">NOW PLAYING</h3>
        <button 
          onClick={() => setIsQueueOpen(!isQueueOpen)}
          className={`p-2 rounded-full shadow-neumorphic-medium transition-all border border-white/60 ${isQueueOpen ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white/50 text-brand-medium hover:text-brand-dark hover:bg-white/80'}`}
          id="btn-np-queue"
          title="View Queue"
        >
          <ListMusic size={18} />
        </button>
      </div>

      {/* Main Core Content Area */}
      <div className="flex-1 flex flex-col justify-between relative overflow-hidden">
        
        {/* Album Artwork Wrapper with Adaptive height */}
        <div className="flex-1 min-h-0 max-h-[30vh] aspect-square mx-auto rounded-[32px] overflow-hidden bg-white/20 shadow-neumorphic-large group border border-white/50 relative flex items-center justify-center my-1.5">
          <img 
            src={currentSong.albumArt} 
            alt="Album Artwork" 
            className={`w-full h-full object-cover transition-transform duration-[6s] ease-out ${isPlaying ? 'scale-105' : 'scale-100'}`}
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/20 via-transparent to-transparent opacity-60" />
        </div>

        {/* Dynamic Queue Slide-over list */}
        {isQueueOpen && (
          <div className="absolute inset-x-0 top-0 bottom-0 bg-white/90 backdrop-blur-xl rounded-[36px] p-5 shadow-neumorphic-large border border-white/60 z-30 flex flex-col animate-fade-in" id="queue-overlay-list">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/40">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">PLAYING QUEUE</span>
              <span className="text-[10px] font-mono text-brand-medium font-bold">{activeQueue.length} songs</span>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 scrollbar-thin">
              {activeQueue.map((songId, index) => {
                const songItem = songs.find(s => s.id === songId);
                if (!songItem) return null;
                const isCurrent = songItem.id === currentSong.id;
                return (
                  <div 
                    key={songItem.id + '_' + index}
                    onClick={() => seek(0) || togglePlay() || seek(0)} // Play
                    className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all ${
                      isCurrent ? 'bg-white/50 border border-brand-secondary' : 'hover:bg-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={songItem.albumArt} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isCurrent ? 'text-brand-primary' : 'text-brand-dark'}`}>
                          {songItem.title}
                        </p>
                        <p className="text-[10px] text-brand-medium truncate">{songItem.artist}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-brand-medium font-mono font-bold">{songItem.durationStr}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Metadata section (Title & Artist) */}
        <div className="flex flex-col items-center text-center mt-3 px-1">
          <h1 className="text-xl md:text-2xl font-black text-brand-dark tracking-tight truncate w-full px-2" id="np-song-title">
            {currentSong.title}
          </h1>
          <span className="text-xs font-bold text-brand-medium tracking-wider truncate block uppercase mt-1 w-full px-2">
            {currentSong.artist || 'Unknown Artist'}
          </span>
        </div>

        {/* Playback Timeline Slider (Playback option) */}
        <div className="mt-3 px-1 flex flex-col gap-1">
          <div className="relative w-full group py-1">
            <input 
              type="range"
              min={0}
              max={duration || 1}
              value={progress}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-brand-secondary/50 rounded-full appearance-none cursor-pointer accent-brand-primary focus:outline-none"
              style={{
                background: `linear-gradient(to right, #FF6EC7 0%, #FF6EC7 ${(progress / (duration || 1)) * 100}%, #FFD6F3 ${(progress / (duration || 1)) * 100}%, #FFD6F3 100%)`
              }}
              id="np-timeline"
            />
          </div>

          <div className="flex justify-between text-[10px] text-brand-medium font-bold font-mono px-0.5">
            <span>{formatSeconds(progress)}</span>
            <span>{formatSeconds(duration)}</span>
          </div>
        </div>

        {/* Core Playback Control Row (Play, Pause, Forward, Rewind, Skip, Repeat, Shuffle) */}
        <div className="flex items-center justify-between px-1 mt-3">
          {/* Shuffle Toggle */}
          <button 
            onClick={toggleShuffle}
            className={`p-2 rounded-full transition-colors ${
              shuffle ? 'text-brand-primary' : 'text-brand-medium hover:text-brand-dark'
            }`}
            id="btn-np-shuffle"
            title="Shuffle"
          >
            <Shuffle size={18} />
          </button>

          {/* Previous Track */}
          <button 
            onClick={prevTrack} 
            className="p-2.5 hover:bg-white/40 active:scale-90 rounded-full transition-all text-brand-dark"
            id="btn-np-prev"
            title="Previous Track"
          >
            <SkipBack size={18} fill="currentColor" />
          </button>

          {/* Rewind 10 Seconds */}
          <button 
            onClick={() => seek(progress - 10)} 
            className="p-2.5 hover:bg-white/40 active:scale-90 rounded-full transition-all text-brand-dark flex flex-col items-center"
            id="btn-np-rewind"
            title="Rewind 10s"
          >
            <Rewind size={20} className="text-brand-dark" />
            <span className="text-[7px] font-bold font-mono text-brand-medium -mt-0.5">10s</span>
          </button>

          {/* Master Play/Pause Button */}
          <button 
            onClick={togglePlay} 
            className="p-4 bg-brand-primary text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center"
            id="btn-np-play"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" className="translate-x-[1.5px]" />}
          </button>

          {/* Fast Forward 10 Seconds */}
          <button 
            onClick={() => seek(progress + 10)} 
            className="p-2.5 hover:bg-white/40 active:scale-90 rounded-full transition-all text-brand-dark flex flex-col items-center"
            id="btn-np-forward"
            title="Forward 10s"
          >
            <FastForward size={20} className="text-brand-dark" />
            <span className="text-[7px] font-bold font-mono text-brand-medium -mt-0.5">10s</span>
          </button>

          {/* Next Track */}
          <button 
            onClick={nextTrack} 
            className="p-2.5 hover:bg-white/40 active:scale-90 rounded-full transition-all text-brand-dark"
            id="btn-np-next"
            title="Next Track"
          >
            <SkipForward size={18} fill="currentColor" />
          </button>

          {/* Repeat Mode Toggle */}
          <button 
            onClick={toggleRepeatMode}
            className={`p-2 rounded-full transition-colors relative ${
              repeatMode !== 'off' ? 'text-brand-primary font-bold' : 'text-brand-medium hover:text-brand-dark'
            }`}
            id="btn-np-repeat"
            title={`Repeat: ${repeatMode}`}
          >
            <Repeat size={18} />
            {repeatMode === 'one' && (
              <span className="absolute bottom-0 right-0 text-[7px] bg-brand-primary text-white rounded-full w-2.5 h-2.5 flex items-center justify-center font-extrabold font-mono">1</span>
            )}
          </button>
        </div>

        {/* Secondary Utilities & Controls (Favorite, Speed, Equalizer, Sleep Timer, Playlist Label) */}
        <div className="flex flex-col gap-2 mt-4 bg-white/40 border border-white/30 rounded-3xl p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-brand-medium">PLAYING FROM:</span>
              <button 
                onClick={() => setIsQueueOpen(!isQueueOpen)}
                className="flex items-center gap-1 text-[11px] font-bold text-brand-dark hover:text-brand-primary transition-colors"
              >
                <span>Current Queue</span>
                <ChevronDown size={12} className="text-brand-medium" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Favorite toggle */}
              <button 
                onClick={() => toggleFavorite(currentSong.id)}
                className={`p-1.5 rounded-full hover:bg-white/40 transition-colors ${
                  favorites.includes(currentSong.id) ? 'text-brand-primary fill-brand-primary' : 'text-brand-medium hover:text-brand-dark'
                }`}
                id="btn-np-fav"
                title="Favorite"
              >
                <Heart size={15} />
              </button>

              {/* Playback speed toggle */}
              <button 
                onClick={() => setIsSpeedOpen(!isSpeedOpen)}
                className={`p-1.5 rounded-full hover:bg-white/40 transition-colors ${
                  isSpeedOpen ? 'text-brand-primary bg-white/40' : 'text-brand-medium hover:text-brand-dark'
                }`}
                title="Playback Speed"
              >
                <Gauge size={15} />
              </button>

              {/* Equalizer toggle */}
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 rounded-full hover:bg-white/40 text-brand-medium hover:text-brand-dark transition-colors cursor-pointer"
                title="Equalizer Settings"
                id="btn-np-equalizer"
              >
                <Sliders size={15} />
              </button>

              {/* Sleep timer toggle */}
              <button 
                onClick={() => setIsSleepOpen(!isSleepOpen)}
                className={`p-1.5 rounded-full border transition-all relative ${
                  sleepTimer !== null 
                    ? 'bg-brand-dark border-brand-dark text-white' 
                    : 'bg-white/50 border-white/60 text-brand-medium hover:text-brand-dark shadow-sm'
                }`}
                title="Sleep Timer"
              >
                <Clock size={15} />
                {sleepTimer !== null && (
                  <span className="absolute -top-1 -right-1 text-[8px] bg-brand-primary text-white px-1 py-0.5 rounded-full font-bold">
                    {sleepTimer}m
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Speed Controls Popover Inline */}
          {isSpeedOpen && (
            <div className="bg-white/60 border border-white/50 rounded-xl p-2 flex items-center justify-between animate-fade-in text-[10px] shadow-sm">
              <span className="font-bold text-brand-dark">Speed:</span>
              <div className="flex gap-1">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(s => (
                  <button 
                    key={s}
                    onClick={() => {
                      changeSpeed(s);
                      setIsSpeedOpen(false);
                    }}
                    className={`px-2 py-0.5 rounded-md font-extrabold transition-all ${
                      playbackRate === s ? 'bg-brand-primary text-white shadow-sm' : 'hover:bg-white/60 text-brand-medium bg-white/30'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sleep Timer popover Inline */}
          {isSleepOpen && (
            <div className="bg-white/60 border border-white/50 rounded-xl p-2 flex items-center justify-between animate-fade-in text-[10px] shadow-sm">
              <span className="font-bold text-brand-dark">Timer:</span>
              <div className="flex gap-1">
                {[5, 15, 30, 45, 60, null].map((m, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setSleepTimerDuration(m);
                      setIsSleepOpen(false);
                    }}
                    className={`px-2 py-0.5 rounded-md font-extrabold transition-all ${
                      sleepTimer === m ? 'bg-brand-primary text-white shadow-sm' : 'hover:bg-white/60 text-brand-medium bg-white/30'
                    }`}
                  >
                    {m ? `${m}m` : 'Off'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
