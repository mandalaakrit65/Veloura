/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Song, Playlist, PlaybackState, ViewType } from '../types';
import { synthPlayer } from '../utils/audioSynth';
import { generateGradientCover } from '../utils/metadataParser';
import {
  getAllSongsFromDB,
  saveSong,
  deleteSongFromDB,
  getAllPlaylistsFromDB,
  savePlaylist,
  deletePlaylistFromDB,
  getPreference,
  setPreference
} from '../db/indexedDB';

interface PlayerContextProps {
  songs: Song[];
  playlists: Playlist[];
  favorites: string[];
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  playbackRate: number;
  shuffle: boolean;
  repeatMode: 'off' | 'one' | 'all';
  activeQueue: string[]; // List of song IDs
  currentQueueIndex: number;
  sleepTimer: number | null; // Minutes left
  currentView: ViewType;
  selectedPlaylistId: string | null;
  searchQuery: string;
  isMediaPermissionGranted: boolean;
  isScanning: boolean;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  recentlyPlayed: string[]; // List of song IDs
  mostPlayed: { id: string; count: number }[];
  
  // Controls
  playTrack: (songId: string, queueSongIds?: string[]) => void;
  togglePlay: () => void;
  pause: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (seconds: number) => void;
  changeVolume: (vol: number) => void;
  changeSpeed: (speed: number) => void;
  toggleShuffle: () => void;
  toggleRepeatMode: () => void;
  toggleFavorite: (songId: string) => void;
  setSleepTimerDuration: (minutes: number | null) => void;
  
  // Navigation
  navigateTo: (view: ViewType, playlistId?: string | null) => void;
  setSearchQuery: (query: string) => void;
  grantMediaPermission: () => void;
  scanDeviceStorage: (files?: FileList | File[]) => Promise<number>;
  
  // Playlists
  createPlaylist: (name: string) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<void>;
  addSongToPlaylist: (playlistId: string, songId: string) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  reorderPlaylistSongs: (playlistId: string, sourceIdx: number, destIdx: number) => Promise<void>;
  deleteSong: (id: string) => Promise<void>;
  eqPreset: string;
  eqGains: number[];
  setEqPreset: (presetName: string) => void;
  setEqGainValue: (index: number, dbValue: number) => void;
}

export const EQ_PRESETS: Record<string, number[]> = {
  'Flat': [0, 0, 0, 0, 0],
  'Bass Boost': [8, 5, 0, 0, -2],
  'Acoustic': [4, 2, 3, 5, 4],
  'Vocal': [-2, 1, 4, 3, 1],
  'Electronic': [6, 3, -1, 2, 5],
  'Classical': [5, 3, -2, 2, 4],
  'Lofi': [-3, 4, 3, -1, -4]
};

const PlayerContext = createContext<PlayerContextProps | undefined>(undefined);



export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State variables
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('all');
  const [activeQueue, setActiveQueue] = useState<string[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMediaPermissionGranted, setIsMediaPermissionGranted] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  
  // Stats
  const [recentlyPlayed, setRecentlyPlayed] = useState<string[]>([]);
  const [mostPlayed, setMostPlayed] = useState<{ id: string; count: number }[]>([]);
  const [eqPreset, setEqPresetState] = useState<string>('Flat');
  const [eqGains, setEqGainsState] = useState<number[]>([0, 0, 0, 0, 0]);

  // Refs for HTML5 Audio element
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<any>(null);
  const sleepTimerIntervalRef = useRef<any>(null);

  // Load everything on mount
  useEffect(() => {
    // Initialize Audio
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const loadAppData = async () => {
      // Load permission setting
      const permission = await getPreference<boolean>('media_permission_granted', false);
      setIsMediaPermissionGranted(permission);

      // Load DB Songs
      let dbSongs = await getAllSongsFromDB();
      
      // Clean up any previously seeded sample songs from IndexedDB
      const hasSamples = dbSongs.some(s => s.id.startsWith('sample_'));
      if (hasSamples) {
        dbSongs = dbSongs.filter(s => !s.id.startsWith('sample_'));
        for (const sId of ['sample_telepathia', 'sample_cherry', 'sample_star_shopping', 'sample_better_now']) {
          await deleteSongFromDB(sId).catch(err => console.error('Error removing sample song:', err));
        }
      }
      setSongs(dbSongs);

      // Load DB Playlists
      let dbPlaylists = await getAllPlaylistsFromDB();
      setPlaylists(dbPlaylists);

      // Load Favorites
      const favs = await getPreference<string[]>('favorites', []);
      setFavorites(favs);

      // Load Equalizer Settings
      const savedEqPreset = await getPreference<string>('eq_preset', 'Flat');
      const savedEqGains = await getPreference<number[]>('eq_gains', [0, 0, 0, 0, 0]);
      setEqPresetState(savedEqPreset);
      setEqGainsState(savedEqGains);
      synthPlayer.setEqGains(savedEqGains);

      // Load Stats
      const recent = await getPreference<string[]>('recently_played', []);
      setRecentlyPlayed(recent);

      const mp = await getPreference<{ id: string; count: number }[]>('most_played', []);
      setMostPlayed(mp);

      // Load last playback state
      const lastState = await getPreference<any>('playback_state', null);
      if (lastState && dbSongs.length > 0) {
        const lastSong = dbSongs.find(s => s.id === lastState.currentSongId);
        if (lastSong) {
          setCurrentSong(lastSong);
          setProgress(lastState.progress || 0);
          setVolume(lastState.volume ?? 0.8);
          setPlaybackRate(lastState.playbackRate ?? 1.0);
          setShuffle(lastState.shuffle || false);
          setRepeatMode(lastState.repeatMode || 'all');
          
          // Setup active queue
          const queue = lastState.queue || dbSongs.map(s => s.id);
          setActiveQueue(queue);
          setCurrentQueueIndex(queue.indexOf(lastSong.id));
        } else {
          // Default setup
          const defaultQueue = dbSongs.map(s => s.id);
          setActiveQueue(defaultQueue);
          setCurrentQueueIndex(0);
          setCurrentSong(dbSongs[0]);
        }
      } else if (dbSongs.length > 0) {
        // Default setup
        const defaultQueue = dbSongs.map(s => s.id);
        setActiveQueue(defaultQueue);
        setCurrentQueueIndex(0);
        setCurrentSong(dbSongs[0]);
      }
    };

    loadAppData();

    return () => {
      stopProgressTracker();
      synthPlayer.stop();
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (sleepTimerIntervalRef.current) {
        clearInterval(sleepTimerIntervalRef.current);
      }
    };
  }, []);

  // Update Audio Element when Volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    synthPlayer.setVolume(volume);
  }, [volume]);

  // Update Audio Element when Rate changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
    synthPlayer.setSpeed(playbackRate);
  }, [playbackRate]);

  // Persist preference states on change
  useEffect(() => {
    if (currentSong) {
      setPreference('playback_state', {
        currentSongId: currentSong.id,
        progress,
        volume,
        playbackRate,
        shuffle,
        repeatMode,
        queue: activeQueue
      });
    }
  }, [currentSong, progress, volume, playbackRate, shuffle, repeatMode, activeQueue]);

  // Handle standard audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      nextTrack();
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || currentSong?.duration || 0);
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [activeQueue, currentQueueIndex, repeatMode, currentSong]);

  // Sleep Timer Countdown Loop
  useEffect(() => {
    if (sleepTimer !== null && sleepTimer > 0) {
      sleepTimerIntervalRef.current = setInterval(() => {
        setSleepTimer(prev => {
          if (prev === null || prev <= 1) {
            pause();
            if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
            return null;
          }
          return prev - 1;
        });
      }, 60000); // 1 minute
    } else {
      if (sleepTimerIntervalRef.current) {
        clearInterval(sleepTimerIntervalRef.current);
      }
    }

    return () => {
      if (sleepTimerIntervalRef.current) {
        clearInterval(sleepTimerIntervalRef.current);
      }
    };
  }, [sleepTimer]);

  // Helper: Start Progress Tracker
  const startProgressTracker = () => {
    stopProgressTracker();
    progressIntervalRef.current = setInterval(() => {
      if (currentSong && isPlaying) {
        if (currentSong.isLocal) {
          if (audioRef.current) {
            setProgress(audioRef.current.currentTime);
          }
        } else {
          // Progress is updated by the synth itself via callback
        }
      }
    }, 250);
  };

  const stopProgressTracker = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Grant device storage permissions
  const grantMediaPermission = () => {
    setIsMediaPermissionGranted(true);
    setPreference('media_permission_granted', true);
  };

  // Format File Duration Helper
  const formatSeconds = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Scan files from local file picker or directory
  const scanDeviceStorage = async (selectedFiles?: FileList | File[]): Promise<number> => {
    if (!selectedFiles || selectedFiles.length === 0) return 0;
    setIsScanning(true);

    const newSongs: Song[] = [];
    const filesArray = Array.from(selectedFiles);

    for (const file of filesArray) {
      // Validate file format
      const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/aac', 'audio/flac', 'audio/x-flac', 'audio/m4a', 'audio/x-m4a', 'audio/ogg', 'audio/x-ogg'];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const validExts = ['mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg'];
      
      if (!validTypes.includes(file.type) && !validExts.includes(fileExt || '')) {
        continue;
      }

      // Read audio element to extract duration
      const fileURL = URL.createObjectURL(file);
      const tempAudio = new Audio(fileURL);

      const durationPromise = new Promise<number>((resolve) => {
        tempAudio.addEventListener('loadedmetadata', () => {
          resolve(tempAudio.duration || 180);
        });
        tempAudio.addEventListener('error', () => {
          resolve(180); // Default fallback
        });
        // Timeout safeguard
        setTimeout(() => resolve(180), 2000);
      });

      const fileDuration = await durationPromise;
      URL.revokeObjectURL(fileURL);

      // Guess Artist & Title from filename
      // e.g. "Kali Uchis - Telepathia.mp3"
      let title = file.name.replace(/\.[^/.]+$/, ""); // Strip extension
      let artist = 'Unknown Artist';
      let album = 'Unknown Album';

      if (title.includes('-')) {
        const parts = title.split('-');
        artist = parts[0].trim();
        title = parts.slice(1).join('-').trim();
      }

      // Generate high-fidelity custom premium cover artwork dynamically for every track
      const albumArt = generateGradientCover(title, artist);

      const cleanSong: Song = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        artist,
        album,
        genre: 'Local Audio',
        duration: Math.round(fileDuration),
        durationStr: formatSeconds(fileDuration),
        fileSize: file.size,
        fileType: file.type || 'audio/mp3',
        filePath: `/storage/emulated/0/Music/${file.name}`,
        albumArt,
        isLocal: true,
        fileData: file, // Keep the actual File object
        addedAt: Date.now(),
        playCount: 0
      };

      await saveSong(cleanSong);
      newSongs.push(cleanSong);
    }

    if (newSongs.length > 0) {
      const updatedSongs = await getAllSongsFromDB();
      setSongs(updatedSongs);

      // Update current playing queue to include new songs
      const updatedQueue = [...activeQueue, ...newSongs.map(s => s.id)];
      setActiveQueue(updatedQueue);
    }

    setIsScanning(false);
    return newSongs.length;
  };

  // Play controls
  const playTrack = (songId: string, queueSongIds?: string[]) => {
    const targetSong = songs.find(s => s.id === songId);
    if (!targetSong) return;

    // Halt current playbacks
    synthPlayer.stop();
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Set Queue
    let newQueue = queueSongIds && queueSongIds.length > 0 ? [...queueSongIds] : songs.map(s => s.id);
    if (shuffle) {
      // Ensure current song is placed first or keep index
      newQueue = newQueue.filter(id => id !== songId);
      newQueue.sort(() => Math.random() - 0.5);
      newQueue.unshift(songId);
    }
    
    setActiveQueue(newQueue);
    const queueIdx = newQueue.indexOf(songId);
    setCurrentQueueIndex(queueIdx >= 0 ? queueIdx : 0);

    setCurrentSong(targetSong);
    setIsPlaying(true);
    setProgress(0);
    setDuration(targetSong.duration);

    // Track playcount stats
    incrementPlayCount(targetSong.id);

    // Start playing based on Local vs Sample
    if (targetSong.isLocal) {
      if (audioRef.current && targetSong.fileData) {
        const fileURL = URL.createObjectURL(targetSong.fileData);
        audioRef.current.src = fileURL;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => console.error("Error playing audio: ", err));
      }
    } else {
      // Synthesized ambient playback for offline preloaded samples
      synthPlayer.start(targetSong.id, 0, (currentTime) => {
        setProgress(currentTime);
        // Check loop/ended inside progress callback
        if (currentTime >= targetSong.duration) {
          synthPlayer.stop();
          nextTrack();
        }
      });
    }

    // Trigger MediaSession metadata API for Android/Bluetooth/Notification lock screen controls!
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: targetSong.title,
        artist: targetSong.artist,
        album: targetSong.album,
        artwork: [
          { src: targetSong.albumArt || '', sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
    }

    startProgressTracker();
  };

  const incrementPlayCount = async (songId: string) => {
    // 1. Update list state
    setSongs(prevSongs => {
      const list = prevSongs.map(s => {
        if (s.id === songId) {
          const updated = {
            ...s,
            playCount: s.playCount + 1,
            lastPlayedAt: Date.now()
          };
          saveSong(updated); // Save to database background
          return updated;
        }
        return s;
      });
      return list;
    });

    // 2. Recently played tracker
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(id => id !== songId);
      const updated = [songId, ...filtered].slice(0, 10); // Keep top 10
      setPreference('recently_played', updated);
      return updated;
    });

    // 3. Most Played list builder
    setMostPlayed(prev => {
      const idx = prev.findIndex(item => item.id === songId);
      let updated = [...prev];
      if (idx >= 0) {
        updated[idx] = { id: songId, count: updated[idx].count + 1 };
      } else {
        updated.push({ id: songId, count: 1 });
      }
      updated.sort((a, b) => b.count - a.count);
      setPreference('most_played', updated);
      return updated;
    });
  };

  const togglePlay = () => {
    if (!currentSong) return;

    if (isPlaying) {
      setIsPlaying(false);
      stopProgressTracker();
      if (currentSong.isLocal) {
        audioRef.current?.pause();
      } else {
        synthPlayer.pause();
      }
    } else {
      setIsPlaying(true);
      if (currentSong.isLocal) {
        audioRef.current?.play().catch(e => console.error("Error playing audio: ", e));
      } else {
        // Resume synthesis from current progress
        synthPlayer.start(currentSong.id, progress, (currentTime) => {
          setProgress(currentTime);
          if (currentTime >= currentSong.duration) {
            synthPlayer.stop();
            nextTrack();
          }
        });
      }
      startProgressTracker();
    }
  };

  const pause = () => {
    if (isPlaying) {
      togglePlay();
    }
  };

  const nextTrack = () => {
    if (activeQueue.length === 0) return;

    let nextIdx = currentQueueIndex + 1;

    if (repeatMode === 'one') {
      // Seek to beginning and keep playing
      seek(0);
      return;
    }

    if (nextIdx >= activeQueue.length) {
      if (repeatMode === 'all') {
        nextIdx = 0;
      } else {
        // Stop playing
        setIsPlaying(false);
        stopProgressTracker();
        synthPlayer.stop();
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setProgress(0);
        return;
      }
    }

    const nextSongId = activeQueue[nextIdx];
    playTrack(nextSongId, activeQueue);
  };

  const prevTrack = () => {
    if (activeQueue.length === 0) return;

    // If song is more than 3s in, restart it
    if (progress > 3) {
      seek(0);
      return;
    }

    let prevIdx = currentQueueIndex - 1;
    if (prevIdx < 0) {
      if (repeatMode === 'all') {
        prevIdx = activeQueue.length - 1;
      } else {
        seek(0);
        return;
      }
    }

    const prevSongId = activeQueue[prevIdx];
    playTrack(prevSongId, activeQueue);
  };

  const seek = (seconds: number) => {
    if (!currentSong) return;
    const clampedSecs = Math.max(0, Math.min(duration, seconds));
    setProgress(clampedSecs);

    if (currentSong.isLocal) {
      if (audioRef.current) {
        audioRef.current.currentTime = clampedSecs;
      }
    } else {
      // Synthesis seeking
      if (isPlaying) {
        synthPlayer.start(currentSong.id, clampedSecs, (currentTime) => {
          setProgress(currentTime);
          if (currentTime >= currentSong.duration) {
            synthPlayer.stop();
            nextTrack();
          }
        });
      }
    }
  };

  const changeVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolume(clamped);
  };

  const changeSpeed = (speed: number) => {
    const clamped = Math.max(0.5, Math.min(2.0, speed));
    setPlaybackRate(clamped);
  };

  const toggleShuffle = () => {
    setShuffle(prev => {
      const newVal = !prev;
      if (currentSong) {
        let newQueue = [...activeQueue];
        if (newVal) {
          // Shuffle everything except current song
          newQueue = newQueue.filter(id => id !== currentSong.id);
          newQueue.sort(() => Math.random() - 0.5);
          newQueue.unshift(currentSong.id);
        } else {
          // Restore alphabetical/db order
          newQueue = songs.map(s => s.id);
        }
        setActiveQueue(newQueue);
        setCurrentQueueIndex(newQueue.indexOf(currentSong.id));
      }
      return newVal;
    });
  };

  const toggleRepeatMode = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const toggleFavorite = (songId: string) => {
    setFavorites(prev => {
      const exists = prev.includes(songId);
      const updated = exists ? prev.filter(id => id !== songId) : [...prev, songId];
      setPreference('favorites', updated);
      return updated;
    });
  };

  const setSleepTimerDuration = (minutes: number | null) => {
    setSleepTimer(minutes);
  };

  // View Navigation
  const navigateTo = (view: ViewType, playlistId: string | null = null) => {
    setCurrentView(view);
    setSelectedPlaylistId(playlistId);
  };

  // Playlists Operations
  const createPlaylist = async (name: string): Promise<Playlist> => {
    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}`,
      name,
      songIds: [],
      createdAt: Date.now()
    };
    await savePlaylist(newPlaylist);
    setPlaylists(prev => [...prev, newPlaylist]);
    return newPlaylist;
  };

  const deletePlaylist = async (id: string): Promise<void> => {
    await deletePlaylistFromDB(id);
    setPlaylists(prev => prev.filter(p => p.id !== id));
    if (selectedPlaylistId === id) {
      setCurrentView('home');
    }
  };

  const addSongToPlaylist = async (playlistId: string, songId: string): Promise<void> => {
    setPlaylists(prev => {
      const updated = prev.map(p => {
        if (p.id === playlistId) {
          if (p.songIds.includes(songId)) return p;
          const updatedPlaylist = { ...p, songIds: [...p.songIds, songId] };
          savePlaylist(updatedPlaylist); // Sync database in background
          return updatedPlaylist;
        }
        return p;
      });
      return updated;
    });
  };

  const removeSongFromPlaylist = async (playlistId: string, songId: string): Promise<void> => {
    setPlaylists(prev => {
      const updated = prev.map(p => {
        if (p.id === playlistId) {
          const updatedPlaylist = { ...p, songIds: p.songIds.filter(id => id !== songId) };
          savePlaylist(updatedPlaylist); // Sync database in background
          return updatedPlaylist;
        }
        return p;
      });
      return updated;
    });
  };

  const reorderPlaylistSongs = async (playlistId: string, sourceIdx: number, destIdx: number): Promise<void> => {
    setPlaylists(prev => {
      const updated = prev.map(p => {
        if (p.id === playlistId) {
          const ids = [...p.songIds];
          const [removed] = ids.splice(sourceIdx, 1);
          ids.splice(destIdx, 0, removed);
          const updatedPlaylist = { ...p, songIds: ids };
          savePlaylist(updatedPlaylist);
          return updatedPlaylist;
        }
        return p;
      });
      return updated;
    });
  };

  const deleteSong = async (songId: string): Promise<void> => {
    // 1. If the deleted song is currently playing, handle stopping or skipping
    if (currentSong?.id === songId) {
      if (activeQueue.length > 1) {
        // Find next track to play
        const nextIdx = (currentQueueIndex + 1) % activeQueue.length;
        const nextSongId = activeQueue[nextIdx];
        if (nextSongId !== songId) {
          playTrack(nextSongId, activeQueue.filter(id => id !== songId));
        } else {
          setIsPlaying(false);
          stopProgressTracker();
          synthPlayer.stop();
          if (audioRef.current) {
            audioRef.current.pause();
          }
          setCurrentSong(null);
          setProgress(0);
        }
      } else {
        setIsPlaying(false);
        stopProgressTracker();
        synthPlayer.stop();
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setCurrentSong(null);
        setProgress(0);
      }
    }

    // 2. Delete from DB
    await deleteSongFromDB(songId);

    // 3. Update state lists
    setSongs(prev => prev.filter(s => s.id !== songId));
    setFavorites(prev => {
      const updated = prev.filter(id => id !== songId);
      setPreference('favorites', updated);
      return updated;
    });

    // 4. Remove from active queue
    setActiveQueue(prev => {
      const updatedQueue = prev.filter(id => id !== songId);
      if (currentSong?.id !== songId) {
        const newIdx = updatedQueue.indexOf(currentSong?.id || '');
        setCurrentQueueIndex(newIdx);
      }
      return updatedQueue;
    });

    // 5. Remove from all playlists
    setPlaylists(prev => {
      const updated = prev.map(p => {
        if (p.songIds.includes(songId)) {
          const updatedPlaylist = { ...p, songIds: p.songIds.filter(id => id !== songId) };
          savePlaylist(updatedPlaylist);
          return updatedPlaylist;
        }
        return p;
      });
      return updated;
    });
  };

  const setEqPreset = (presetName: string) => {
    const gains = EQ_PRESETS[presetName] || [0, 0, 0, 0, 0];
    setEqPresetState(presetName);
    setEqGainsState(gains);
    synthPlayer.setEqGains(gains);
    setPreference('eq_preset', presetName);
    setPreference('eq_gains', gains);
  };

  const setEqGainValue = (index: number, dbValue: number) => {
    setEqGainsState(prev => {
      const updated = [...prev];
      updated[index] = dbValue;
      setEqPresetState('Custom');
      synthPlayer.setEqGains(updated);
      setPreference('eq_preset', 'Custom');
      setPreference('eq_gains', updated);
      return updated;
    });
  };

  return (
    <PlayerContext.Provider
      value={{
        songs,
        playlists,
        favorites,
        currentSong,
        isPlaying,
        progress,
        duration,
        volume,
        playbackRate,
        shuffle,
        repeatMode,
        activeQueue,
        currentQueueIndex,
        sleepTimer,
        currentView,
        selectedPlaylistId,
        searchQuery,
        isMediaPermissionGranted,
        isScanning,
        isSettingsOpen,
        setIsSettingsOpen,
        recentlyPlayed,
        mostPlayed,
        
        playTrack,
        togglePlay,
        pause,
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
        setSearchQuery,
        grantMediaPermission,
        scanDeviceStorage,
        
        createPlaylist,
        deletePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        reorderPlaylistSongs,
        deleteSong,
        eqPreset,
        eqGains,
        setEqPreset,
        setEqGainValue
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
