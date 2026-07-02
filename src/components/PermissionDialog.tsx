/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Music4 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const PermissionDialog: React.FC = () => {
  const { grantMediaPermission } = usePlayer();

  return (
    <div className="absolute inset-0 bg-[#4A4458]/20 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in" id="permission-dialog-container">
      <div className="w-full max-w-[280px] bg-white/85 backdrop-blur-xl rounded-[28px] p-6 shadow-neumorphic-large flex flex-col gap-4 text-brand-dark border border-white/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-secondary/50 rounded-2xl flex items-center justify-center text-brand-primary border border-white/40">
            <Music4 size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-brand-medium font-bold uppercase tracking-wider">SYSTEM PERMISSION</span>
            <span className="text-sm font-bold text-brand-dark font-display">Storage Discovery</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold leading-snug">
            Allow <span className="font-bold text-brand-primary">Veloura</span> to access audio files on this device?
          </h3>
          <p className="text-xs text-brand-medium leading-relaxed font-medium">
            Veloura automatically scans your offline music folders (MP3, FLAC, WAV, AAC, M4A) to populate your library and support high-quality local playback.
          </p>
        </div>

        <div className="flex flex-col gap-1 mt-2">
          <button 
            onClick={grantMediaPermission}
            className="w-full py-3 bg-brand-primary hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl text-white text-sm font-bold shadow-md"
            id="btn-allow-permission"
          >
            Allow access
          </button>
          <button 
            onClick={grantMediaPermission} // Fallback to let them bypass anyways, keeping the app functional
            className="w-full py-2.5 hover:bg-white/40 active:scale-[0.98] transition-all rounded-2xl text-brand-medium text-xs font-semibold"
            id="btn-deny-permission"
          >
            Don't allow
          </button>
        </div>
      </div>
    </div>
  );
};
