/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { AndroidFrame } from './components/AndroidFrame';
import { PermissionDialog } from './components/PermissionDialog';
import { LibraryView } from './components/LibraryView';
import { NowPlaying } from './components/NowPlaying';
import { Scanner } from './components/Scanner';
import { MiniPlayer } from './components/MiniPlayer';
import { EqualizerSettingsModal } from './components/EqualizerSettingsModal';

function AppContent() {
  const { currentView, isMediaPermissionGranted } = usePlayer();

  return (
    <AndroidFrame>
      {/* 1. Primary Navigational Screen Panels with explicit layouts */}
      {currentView === 'home' && (
        <div className="flex-1 flex flex-col overflow-y-auto relative px-5 pt-6 pb-6 scrollbar-none" id="app-screen-content">
          <LibraryView />
        </div>
      )}
      {currentView === 'now-playing' && (
        <div className="flex-1 flex flex-col relative px-5 pt-6 pb-6 overflow-hidden" id="app-screen-content-np">
          <NowPlaying />
        </div>
      )}
      {currentView === 'scanner' && (
        <div className="flex-1 flex flex-col overflow-y-auto relative px-5 pt-6 pb-6" id="app-screen-content-scanner">
          <Scanner />
        </div>
      )}

      {/* 2. Android Permission Request Popup simulation */}
      {!isMediaPermissionGranted && <PermissionDialog />}

      {/* 3. Floating bottom Mini Player controls - permanently pinned at the bottom */}
      <MiniPlayer />

      {/* 4. Custom Parametric Sound Equalizer Overlay */}
      <EqualizerSettingsModal />
    </AndroidFrame>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <div className="min-h-screen bg-brand-accent text-brand-medium flex items-center justify-center md:p-4 select-none font-sans">
        <AppContent />
      </div>
    </PlayerProvider>
  );
}
