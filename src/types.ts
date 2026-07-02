/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number; // in seconds
  durationStr: string; // e.g. "2:35"
  fileSize: number; // in bytes
  fileType: string; // e.g. "audio/mp3"
  filePath: string; // Relative path or folder
  albumArt?: string; // Base64 or object URL or pre-bundled URL
  isLocal: boolean; // True if uploaded/scanned by user, false if sample
  fileData?: File | Blob; // The actual file binary (stored in IndexedDB)
  addedAt: number;
  playCount: number;
  lastPlayedAt?: number;
}

export interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: number;
  isSystem?: boolean; // e.g. Favorites, Recently Played
}

export interface PlaybackState {
  currentSongId: string | null;
  isPlaying: boolean;
  progress: number; // current time in seconds
  volume: number; // 0 to 1
  playbackRate: number; // 0.5 to 2.0
  shuffle: boolean;
  repeatMode: 'off' | 'one' | 'all';
  sleepTimerDuration: number | null; // minutes left, or null
  sleepTimerEndAt: number | null; // timestamp when sleep timer fires
}

export type ViewType = 'home' | 'now-playing' | 'library' | 'playlists' | 'favorites' | 'folders' | 'scanner';
