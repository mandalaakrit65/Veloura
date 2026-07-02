/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Song, Playlist } from '../types';

const DB_NAME = 'VelouraMusicPlayerDB';
const DB_VERSION = 1;

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;

      // Store songs
      if (!db.objectStoreNames.contains('songs')) {
        const songStore = db.createObjectStore('songs', { keyPath: 'id' });
        songStore.createIndex('title', 'title', { unique: false });
        songStore.createIndex('artist', 'artist', { unique: false });
        songStore.createIndex('album', 'album', { unique: false });
        songStore.createIndex('filePath', 'filePath', { unique: false });
      }

      // Store playlists
      if (!db.objectStoreNames.contains('playlists')) {
        db.createObjectStore('playlists', { keyPath: 'id' });
      }

      // Store state/preferences
      if (!db.objectStoreNames.contains('preferences')) {
        db.createObjectStore('preferences', { keyPath: 'key' });
      }
    };
  });
}

// Songs DAO
export async function saveSong(song: Song): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('songs', 'readwrite');
    const store = transaction.objectStore('songs');
    const request = store.put(song);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllSongsFromDB(): Promise<Song[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('songs', 'readonly');
    const store = transaction.objectStore('songs');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSongFromDB(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('songs', 'readwrite');
    const store = transaction.objectStore('songs');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllSongs(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('songs', 'readwrite');
    const store = transaction.objectStore('songs');
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Playlists DAO
export async function savePlaylist(playlist: Playlist): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('playlists', 'readwrite');
    const store = transaction.objectStore('playlists');
    const request = store.put(playlist);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllPlaylistsFromDB(): Promise<Playlist[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('playlists', 'readonly');
    const store = transaction.objectStore('playlists');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function deletePlaylistFromDB(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('playlists', 'readwrite');
    const store = transaction.objectStore('playlists');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Preferences DAO
export async function setPreference(key: string, value: any): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('preferences', 'readwrite');
    const store = transaction.objectStore('preferences');
    const request = store.put({ key, value });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getPreference<T>(key: string, defaultValue: T): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve) => {
    const transaction = db.transaction('preferences', 'readonly');
    const store = transaction.objectStore('preferences');
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result ? (request.result.value as T) : defaultValue);
    };
    request.onerror = () => {
      resolve(defaultValue);
    };
  });
}
