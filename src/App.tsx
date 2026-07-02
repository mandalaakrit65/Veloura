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
      {/* 1. Android Permission Request Popup simulation */}
      {!isMediaPermissionGranted && <PermissionDialog />}

      {/* 2. Primary Navigational Screen Panels */}
      {currentView === 'home' && <LibraryView />}
      {currentView === 'now-playing' && <NowPlaying />}
      {currentView === 'scanner' && <Scanner />}

      {/* 3. Floating bottom Mini Player controls */}
      <MiniPlayer />

      {/* 4. Custom Parametric Sound Equalizer Overlay */}
      <EqualizerSettingsModal />
    </AndroidFrame>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <div className="min-h-screen bg-brand-accent text-brand-medium flex items-center justify-center p-4 select-none font-sans">
        <AppContent />
      </div>
    </PlayerProvider>
  );
}
