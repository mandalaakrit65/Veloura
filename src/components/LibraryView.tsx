/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Plus, Trash2, Heart, Folder, Music, Play, Pause, Disc, User, ListMusic, PlusCircle, Sparkles, Settings } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Song, Playlist } from '../types';

const THEME_CLASSES = [
  // Veloura Dusk: start: '#FF6EC7', mid: '#A154F2', end: '#4A4458'
  {
    bgActive: 'bg-gradient-to-br from-[#FF6EC7]/20 via-[#A154F2]/15 to-[#4A4458]/20 border-[#FF6EC7]/40 shadow-[#FF6EC7]/5',
    bgNormal: 'bg-gradient-to-br from-[#FF6EC7]/5 via-white/40 to-[#4A4458]/5 border-white/40 hover:from-[#FF6EC7]/10 hover:to-[#4A4458]/10',
    badge: 'bg-[#FF6EC7]/10 text-[#FF6EC7] border-[#FF6EC7]/20',
    textAccent: 'text-[#FF6EC7]'
  },
  // Solar Flare: start: '#8A2387', mid: '#E94057', end: '#F27121'
  {
    bgActive: 'bg-gradient-to-br from-[#8A2387]/20 via-[#E94057]/15 to-[#F27121]/20 border-[#E94057]/40 shadow-[#E94057]/5',
    bgNormal: 'bg-gradient-to-br from-[#8A2387]/5 via-white/40 to-[#F27121]/5 border-white/40 hover:from-[#8A2387]/10 hover:to-[#F27121]/10',
    badge: 'bg-[#E94057]/10 text-[#E94057] border-[#E94057]/20',
    textAccent: 'text-[#E94057]'
  },
  // Bio Synth: start: '#11998E', mid: '#1B4D3E', end: '#38EF7D'
  {
    bgActive: 'bg-gradient-to-br from-[#11998E]/20 via-[#1B4D3E]/15 to-[#38EF7D]/20 border-[#11998E]/40 shadow-[#38EF7D]/5',
    bgNormal: 'bg-gradient-to-br from-[#11998E]/5 via-white/40 to-[#38EF7D]/5 border-white/40 hover:from-[#11998E]/10 hover:to-[#38EF7D]/10',
    badge: 'bg-[#11998E]/10 text-[#11998E] border-[#11998E]/20',
    textAccent: 'text-[#11998E]'
  },
  // Deep Atlantic: start: '#2193B0', mid: '#1D2A44', end: '#6DD5ED'
  {
    bgActive: 'bg-gradient-to-br from-[#2193B0]/20 via-[#1D2A44]/15 to-[#6DD5ED]/20 border-[#2193B0]/40 shadow-[#2193B0]/5',
    bgNormal: 'bg-gradient-to-br from-[#2193B0]/5 via-white/40 to-[#6DD5ED]/5 border-white/40 hover:from-[#2193B0]/10 hover:to-[#6DD5ED]/10',
    badge: 'bg-[#2193B0]/10 text-[#2193B0] border-[#2193B0]/20',
    textAccent: 'text-[#2193B0]'
  },
  // Cosmic Laser: start: '#7F00FF', mid: '#3F007F', end: '#E100FF'
  {
    bgActive: 'bg-gradient-to-br from-[#7F00FF]/20 via-[#3F007F]/15 to-[#E100FF]/20 border-[#7F00FF]/40 shadow-[#7F00FF]/5',
    bgNormal: 'bg-gradient-to-br from-[#7F00FF]/5 via-white/40 to-[#E100FF]/5 border-white/40 hover:from-[#7F00FF]/10 hover:to-[#E100FF]/10',
    badge: 'bg-[#7F00FF]/10 text-[#7F00FF] border-[#7F00FF]/20',
    textAccent: 'text-[#7F00FF]'
  },
  // Liquid Gold: start: '#E65C00', mid: '#5A1A00', end: '#F9D423'
  {
    bgActive: 'bg-gradient-to-br from-[#E65C00]/20 via-[#5A1A00]/15 to-[#F9D423]/20 border-[#E65C00]/40 shadow-[#E65C00]/5',
    bgNormal: 'bg-gradient-to-br from-[#E65C00]/5 via-white/40 to-[#F9D423]/5 border-white/40 hover:from-[#E65C00]/10 hover:to-[#F9D423]/10',
    badge: 'bg-[#E65C00]/10 text-[#E65C00] border-[#E65C00]/20',
    textAccent: 'text-[#E65C00]'
  }
];

const getThemeIndex = (title: string, artist: string): number => {
  const cleanTitle = (title || 'Track').trim();
  const cleanArtist = (artist || 'Artist').trim();
  let hash = 0;
  const str = cleanTitle + cleanArtist;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % THEME_CLASSES.length;
};

export const LibraryView: React.FC = () => {
  const {
    songs,
    playlists,
    favorites,
    currentSong,
    isPlaying,
    progress,
    duration,
    playTrack,
    togglePlay,
    toggleFavorite,
    navigateTo,
    createPlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    recentlyPlayed,
    mostPlayed,
    deleteSong,
    setIsSettingsOpen
  } = usePlayer();

  const [activeTab, setActiveTab] = useState<'songs' | 'albums' | 'artists' | 'playlists' | 'favorites' | 'folders'>('songs');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter songs based on search and active category tab
  const getFilteredSongs = (): Song[] => {
    let list = [...songs];

    // Filter by Search Query
    if (localSearchQuery) {
      const q = localSearchQuery.toLowerCase();
      list = list.filter(
        s =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.album.toLowerCase().includes(q) ||
          s.filePath.toLowerCase().includes(q)
      );
    }

    // Filter by Category Tab
    if (activeTab === 'favorites') {
      list = list.filter(s => favorites.includes(s.id));
    }

    return list;
  };

  // Group songs helper
  const getGroupedData = () => {
    const list = getFilteredSongs();
    
    if (activeTab === 'albums') {
      const groups: Record<string, Song[]> = {};
      list.forEach(s => {
        const album = s.album || 'Unknown Album';
        if (!groups[album]) groups[album] = [];
        groups[album].push(s);
      });
      return Object.entries(groups).map(([name, tracks]) => ({ name, tracks, count: tracks.length }));
    }

    if (activeTab === 'artists') {
      const groups: Record<string, Song[]> = {};
      list.forEach(s => {
        const artist = s.artist || 'Unknown Artist';
        if (!groups[artist]) groups[artist] = [];
        groups[artist].push(s);
      });
      return Object.entries(groups).map(([name, tracks]) => ({ name, tracks, count: tracks.length }));
    }

    if (activeTab === 'folders') {
      const groups: Record<string, Song[]> = {};
      list.forEach(s => {
        // Strip file name to get mock directory
        const parts = s.filePath.split('/');
        const dir = parts.slice(0, -1).join('/') || '/storage/emulated/0/Music';
        if (!groups[dir]) groups[dir] = [];
        groups[dir].push(s);
      });
      return Object.entries(groups).map(([name, tracks]) => ({ name, tracks, count: tracks.length }));
    }

    return [];
  };

  // Recently Played Songs Helper
  const getRecentlyPlayedSongs = (): Song[] => {
    return recentlyPlayed
      .map(id => songs.find(s => s.id === id))
      .filter((s): s is Song => !!s)
      .slice(0, 5);
  };

  // Handle Playlist creation
  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    await createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setIsCreatingPlaylist(false);
  };

  const handlePlaySongInList = (song: Song, customList?: Song[]) => {
    const playList = customList || getFilteredSongs();
    const songIds = playList.map(s => s.id);
    playTrack(song.id, songIds);
  };

  const filteredSongs = getFilteredSongs();
  const groupedData = getGroupedData();
  const recentTracks = getRecentlyPlayedSongs();

  return (
    <div className="flex flex-col flex-1 pb-16 animate-fade-in" id="library-view-container">
      {/* Branding Header */}
      <div className="flex items-center justify-between mb-4 mt-2">
        <div>
          <h1 className="text-2xl font-black text-brand-dark tracking-tight flex items-center gap-1.5 leading-none font-display">
            Veloura
            <Sparkles size={16} className="text-brand-primary fill-brand-primary animate-pulse" />
          </h1>
          <p className="text-[10px] text-brand-medium font-bold tracking-widest uppercase mt-1">Feel Every Beat</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 bg-white/50 hover:bg-brand-primary hover:text-white text-brand-primary border border-white/60 rounded-full transition-all shadow-sm cursor-pointer"
            title="Acoustic Equalizer"
            id="btn-nav-equalizer"
          >
            <Settings size={14} />
          </button>
          <button 
            onClick={() => navigateTo('scanner')}
            className="px-4 py-1.5 bg-white/50 hover:bg-brand-primary hover:text-white text-brand-primary border border-white/60 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all shadow-sm"
            id="btn-nav-scanner"
          >
            Scan Media
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative mb-5" id="search-bar-wrapper">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-medium" />
        <input 
          type="text"
          placeholder="Search songs, albums, artists..."
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white/40 rounded-2xl text-xs font-semibold text-brand-dark placeholder-brand-medium shadow-neumorphic-inset border border-white/40 focus:outline-none focus:ring-1 focus:ring-brand-primary/50 transition-all"
          id="search-input"
        />
      </div>

      {/* Recently Played Section (Visible on home state and All Songs tab) */}
      {recentTracks.length > 0 && !localSearchQuery && activeTab === 'songs' && (
        <div className="mb-6" id="recently-played-section">
          <h3 className="text-[10px] font-bold text-brand-medium uppercase tracking-widest mb-3">Recently Played</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
            {recentTracks.map(song => (
              <div 
                key={song.id}
                onClick={() => handlePlaySongInList(song, recentTracks)}
                className="flex-shrink-0 w-28 cursor-pointer group snap-start"
              >
                <div className="w-28 aspect-square rounded-2xl overflow-hidden relative shadow-neumorphic-medium mb-2 border border-white/50">
                  <img src={song.albumArt} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-brand-primary/20 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-2.5 bg-white/90 rounded-full text-brand-primary shadow-md">
                      <Play size={16} fill="currentColor" />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] font-bold text-brand-dark truncate leading-tight">{song.title}</p>
                <p className="text-[9px] text-brand-medium truncate mt-0.5">{song.artist}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs (Horizontal Scrollbar) */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none" id="category-tabs-row">
        {[
          { id: 'songs', label: 'All Songs' },
          { id: 'playlists', label: 'Playlists' },
          { id: 'favorites', label: 'Favorites' },
          { id: 'albums', label: 'Albums' },
          { id: 'artists', label: 'Artists' },
          { id: 'folders', label: 'Folders' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setSelectedPlaylistId(null);
            }}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTab === tab.id 
                ? 'bg-brand-primary text-white border-white/50 shadow-neumorphic-medium' 
                : 'bg-white/40 text-brand-medium border-white/30 hover:bg-white/60 hover:text-brand-dark shadow-sm'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Content Panel based on Tab */}
      <div className="flex-1 flex flex-col" id="tab-content-panel">
        
        {/* Playlists Tab */}
        {activeTab === 'playlists' && (
          <div className="flex flex-col gap-4 animate-fade-in" id="playlists-tab-content">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-brand-medium uppercase tracking-widest">MY PLAYLISTS</span>
              <button 
                onClick={() => setIsCreatingPlaylist(!isCreatingPlaylist)}
                className="flex items-center gap-1 text-[11px] font-extrabold text-brand-primary uppercase tracking-wider"
              >
                <Plus size={14} /> New Playlist
              </button>
            </div>

            {isCreatingPlaylist && (
              <form onSubmit={handleCreatePlaylist} className="flex gap-2 animate-slide-up">
                <input 
                  type="text" 
                  placeholder="Playlist name..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-white/40 border border-white/50 rounded-xl text-xs font-semibold text-brand-dark placeholder-brand-medium focus:outline-none focus:ring-1 focus:ring-brand-primary/50"
                  autoFocus
                />
                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold shadow-md">
                  Create
                </button>
              </form>
            )}

            {/* List of playlists */}
            {playlists.length === 0 ? (
              <div className="text-center py-10 bg-white/30 rounded-2xl border border-dashed border-white/60 shadow-neumorphic-inset">
                <p className="text-xs text-brand-medium font-medium">No playlists created yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {playlists.map(p => (
                  <div key={p.id} className="flex flex-col gap-2 p-3 bg-white/40 border border-white/50 rounded-2xl shadow-neumorphic-medium">
                    <div className="flex items-center justify-between">
                      <div 
                        onClick={() => setSelectedPlaylistId(selectedPlaylistId === p.id ? null : p.id)}
                        className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                      >
                        <div className="w-10 h-10 bg-brand-secondary/50 text-brand-primary rounded-xl flex items-center justify-center border border-white/50 shadow-inner">
                          <ListMusic size={20} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-brand-dark truncate">{p.name}</h4>
                          <span className="text-[10px] text-brand-medium font-bold">{p.songIds.length} tracks</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => deletePlaylist(p.id)}
                        className="p-2 text-brand-medium hover:text-red-500 transition-colors"
                        title="Delete Playlist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Playlist details / sub-songs */}
                    {selectedPlaylistId === p.id && (
                      <div className="border-t border-white/40 pt-2.5 mt-1.5 flex flex-col gap-1.5 animate-slide-up">
                        {p.songIds.length === 0 ? (
                          <p className="text-[10px] text-brand-medium text-center py-2 italic font-semibold">Playlist is empty. Heart songs or upload tracks to add.</p>
                        ) : (
                          p.songIds.map(sId => {
                            const songItem = songs.find(s => s.id === sId);
                            if (!songItem) return null;
                            return (
                              <div key={songItem.id} className="flex items-center justify-between p-2 hover:bg-white/40 rounded-xl transition-all">
                                <div className="flex items-center gap-2 min-w-0 cursor-pointer" onClick={() => playTrack(songItem.id, p.songIds)}>
                                  <img src={songItem.albumArt} alt="" className="w-7 h-7 rounded-lg object-cover" />
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-brand-dark truncate">{songItem.title}</p>
                                    <p className="text-[9px] text-brand-medium truncate">{songItem.artist}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => removeSongFromPlaylist(p.id, songItem.id)}
                                  className="p-1.5 text-brand-medium hover:text-brand-primary transition-colors"
                                  title="Remove from playlist"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Songs List & Favorites Tab */}
        {(activeTab === 'songs' || activeTab === 'favorites') && (
          <div className="flex flex-col gap-3 animate-fade-in" id="songs-tab-content">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-brand-medium uppercase tracking-widest">
                {activeTab === 'favorites' ? `FAVORITES (${filteredSongs.length})` : `ALL SONGS (${filteredSongs.length})`}
              </span>
            </div>

            {filteredSongs.length === 0 ? (
              <div className="text-center py-12 bg-white/30 rounded-2xl border border-dashed border-white/60 shadow-neumorphic-inset">
                <p className="text-xs text-brand-medium font-medium">No songs found in this category.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredSongs.map(song => {
                  const isCurrent = currentSong?.id === song.id;
                  const themeIdx = getThemeIndex(song.title, song.artist);
                  const themeCls = THEME_CLASSES[themeIdx];
                  return (
                    <div 
                      key={song.id} 
                      className={`flex flex-col p-3 rounded-2xl border cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all ${
                        isCurrent 
                          ? `${themeCls.bgActive} border-brand-primary/40 shadow-neumorphic-medium` 
                          : `${themeCls.bgNormal} shadow-neumorphic-medium`
                      }`}
                      id={`song-item-${song.id}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Play circular button left */}
                        <div 
                          onClick={() => isCurrent ? togglePlay() : handlePlaySongInList(song)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm flex-shrink-0 ${
                            isCurrent ? 'bg-brand-primary text-white shadow-brand-primary/20' : 'bg-white/60 text-brand-medium border border-white hover:bg-brand-primary hover:text-white'
                          }`}
                        >
                          {isCurrent && isPlaying ? (
                            <Pause size={14} fill={isCurrent ? 'white' : 'currentColor'} />
                          ) : (
                            <Play size={14} fill={isCurrent ? 'white' : 'currentColor'} className="translate-x-[1px]" />
                          )}
                        </div>

                        {/* Song Artwork Thumbnail */}
                        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex-shrink-0 border border-white/50 bg-white/20">
                          <img src={song.albumArt} alt="" className="w-full h-full object-cover" />
                        </div>

                        {/* Song Title & Artist middle */}
                        <div 
                          onClick={() => handlePlaySongInList(song)}
                          className="flex-1 min-w-0"
                        >
                          <span className="text-[10px] text-brand-medium font-extrabold uppercase tracking-wider block truncate">{song.artist}</span>
                          <h4 className={`text-xs font-bold truncate leading-tight mt-0.5 ${isCurrent ? `${themeCls.textAccent} font-black` : 'text-brand-dark'}`}>
                            {song.title}
                          </h4>
                        </div>

                        {/* Right duration, favorite & delete clicks */}
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(song.id);
                            }}
                            className={`p-1.5 rounded-full transition-colors ${
                              favorites.includes(song.id) ? 'text-brand-primary' : 'text-brand-medium hover:text-brand-dark'
                            }`}
                          >
                            <Heart size={13} fill={favorites.includes(song.id) ? 'currentColor' : 'none'} />
                          </button>

                          {confirmDeleteId === song.id ? (
                            <div className="flex items-center gap-1.5 animate-pulse bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSong(song.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="text-[10px] font-black text-red-600 uppercase tracking-tight hover:text-red-700 transition-colors"
                                title="Confirm Delete"
                              >
                                Delete?
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(null);
                                }}
                                className="text-[10px] font-bold text-brand-medium hover:text-brand-dark transition-colors"
                                title="Cancel"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(song.id);
                              }}
                              className="p-1.5 rounded-full text-brand-medium hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete Song"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}

                          <span className="text-[10px] text-brand-medium font-bold font-mono min-w-[28px] text-right">
                            {song.durationStr}
                          </span>
                        </div>
                      </div>

                      {/* HIGH-FIDELITY: Custom Play Progress Line right underneath active title! */}
                      {isCurrent && (
                        <div className="mt-2.5 px-1 animate-fade-in">
                          <div className="h-[2px] bg-brand-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-brand-primary rounded-full" 
                              style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Grouped Tabs (Albums, Artists, Folders) */}
        {(activeTab === 'albums' || activeTab === 'artists' || activeTab === 'folders') && (
          <div className="flex flex-col gap-3.5 animate-fade-in" id="grouped-tab-content">
            <span className="text-[10px] font-bold text-brand-medium uppercase tracking-widest px-1">
              {activeTab} ({groupedData.length})
            </span>

            {groupedData.length === 0 ? (
              <div className="text-center py-12 bg-white/30 rounded-2xl border border-dashed border-white/60 shadow-neumorphic-inset">
                <p className="text-xs text-brand-medium font-medium">No {activeTab} discovered.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {groupedData.map(group => (
                  <div key={group.name} className="flex flex-col p-3 bg-white/40 border border-white/50 rounded-2xl shadow-neumorphic-medium">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 bg-brand-secondary/40 text-brand-primary rounded-lg flex items-center justify-center border border-white/30">
                          {activeTab === 'albums' && <Disc size={16} />}
                          {activeTab === 'artists' && <User size={16} />}
                          {activeTab === 'folders' && <Folder size={16} />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-brand-dark truncate">{group.name}</h4>
                          <span className="text-[9px] text-brand-medium font-bold">{group.count} files discovered</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => playTrack(group.tracks[0].id, group.tracks.map(t => t.id))}
                        className="px-3 py-1 bg-brand-dark text-white rounded-full text-[10px] font-extrabold uppercase tracking-wide hover:bg-brand-primary transition-all shadow-sm"
                      >
                        Play All
                      </button>
                    </div>

                    <div className="flex flex-col gap-1 pl-10">
                      {group.tracks.slice(0, 3).map(song => (
                        <div 
                          key={song.id} 
                          onClick={() => playTrack(song.id, group.tracks.map(t => t.id))}
                          className="flex items-center justify-between py-1.5 cursor-pointer text-brand-medium hover:text-brand-primary transition-all gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img src={song.albumArt} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0 border border-white/40 shadow-xs" />
                            <span className="text-xs truncate font-semibold pr-4">{song.title}</span>
                          </div>
                          <span className="text-[9px] text-brand-medium font-mono font-bold">{song.durationStr}</span>
                        </div>
                      ))}
                      {group.count > 3 && (
                        <span className="text-[9px] text-brand-medium mt-1 italic font-bold">
                          + {group.count - 3} more tracks in this {activeTab === 'albums' ? 'album' : activeTab === 'artists' ? 'artist' : 'directory'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
