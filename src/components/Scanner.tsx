/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { FolderUp, Loader, Music, CheckCircle2, RefreshCw, Smartphone } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const Scanner: React.FC = () => {
  const { scanDeviceStorage, isScanning, navigateTo } = usePlayer();
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [scannedCount, setScannedCount] = useState<number>(0);
  const [currentScanningPath, setCurrentScanningPath] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    startMockScan(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      startMockScan(files);
    }
  };

  const startMockScan = async (files: FileList | File[]) => {
    setScanStatus('scanning');
    
    // Simulate real scanning paths for maximum android high-fidelity feel!
    const paths = [
      '/storage/emulated/0/Music/Download/',
      '/storage/emulated/0/Music/Telegram/',
      '/storage/emulated/0/Podcasts/',
      '/storage/emulated/0/WhatsApp/Media/WhatsApp Audio/',
      '/storage/emulated/0/Alarms/'
    ];

    let currentIdx = 0;
    const pathInterval = setInterval(() => {
      const randomPath = paths[currentIdx % paths.length] + (files[currentIdx]?.name || 'checking...');
      setCurrentScanningPath(randomPath);
      currentIdx++;
    }, 400);

    try {
      const count = await scanDeviceStorage(files);
      clearInterval(pathInterval);
      setScannedCount(count);
      setScanStatus('success');
    } catch (err) {
      clearInterval(pathInterval);
      setScanStatus('idle');
      console.error(err);
    }
  };

  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col flex-1 py-4 justify-center" id="scanner-view">
      <div className="text-center mb-6">
        <span className="text-[10px] text-brand-primary font-extrabold uppercase tracking-widest bg-brand-secondary/40 px-3 py-1 rounded-full border border-brand-primary/20">
          Android MediaStore Scanner
        </span>
        <h2 className="text-xl font-bold text-brand-dark mt-2 font-display">Local Music Scanner</h2>
        <p className="text-xs text-brand-medium mt-1 max-w-[260px] mx-auto font-medium">
          Scan storage directories to discover MP3, WAV, AAC, FLAC, M4A, or OGG tracks.
        </p>
      </div>

      {/* Main Drag/Upload Area */}
      <div 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={scanStatus === 'idle' ? triggerPicker : undefined}
        className={`w-full aspect-square max-w-[280px] mx-auto rounded-[36px] border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 relative overflow-hidden ${
          scanStatus === 'scanning' 
            ? 'border-brand-primary/40 bg-brand-secondary/20' 
            : scanStatus === 'success'
            ? 'border-emerald-300 bg-emerald-50/20'
            : 'border-white/50 hover:border-brand-primary/50 hover:bg-white/60 bg-white/40 shadow-neumorphic-large'
        }`}
        id="scanner-drag-drop-area"
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="audio/*"
          className="hidden"
          id="scanner-hidden-input"
        />

        {scanStatus === 'idle' && (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="w-16 h-16 bg-brand-secondary/40 text-brand-primary rounded-full flex items-center justify-center shadow-inner border border-white/30">
              <FolderUp size={30} className="stroke-[1.5]" />
            </div>
            <div>
              <span className="text-sm font-bold text-brand-dark">Select Audio Tracks</span>
              <p className="text-[11px] text-brand-medium mt-1 leading-relaxed font-medium">
                Click to browse files or drag & drop songs / folders here.
              </p>
            </div>
          </div>
        )}

        {scanStatus === 'scanning' && (
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="w-16 h-16 bg-brand-secondary/40 rounded-full flex items-center justify-center relative border border-white/30">
              <Loader size={30} className="text-brand-primary animate-spin" />
              <Smartphone size={16} className="text-brand-primary absolute center" />
            </div>
            <div className="w-full">
              <span className="text-xs font-bold text-brand-primary block">SCANNING STORAGE</span>
              <div className="text-[9px] font-mono text-brand-medium truncate w-full max-w-[220px] mx-auto mt-2 bg-white/50 p-1 rounded border border-white/40">
                {currentScanningPath || '/storage/emulated/0/Music/'}
              </div>
            </div>
          </div>
        )}

        {scanStatus === 'success' && (
          <div className="flex flex-col items-center gap-4 animate-scale-up">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-white/40">
              <CheckCircle2 size={32} className="stroke-[1.5]" />
            </div>
            <div>
              <span className="text-sm font-bold text-emerald-600 block">Scan Completed</span>
              <p className="text-xs text-brand-medium mt-1 font-medium">
                Successfully imported <span className="font-bold text-brand-dark">{scannedCount}</span> new local tracks into Veloura library!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="flex flex-col items-center gap-2 mt-6">
        {scanStatus === 'success' ? (
          <button 
            onClick={() => navigateTo('home')}
            className="px-6 py-2.5 bg-brand-dark text-white rounded-full text-xs font-bold shadow-lg hover:bg-brand-primary active:scale-95 transition-all"
            id="btn-view-library"
          >
            Open Library
          </button>
        ) : (
          <button 
            onClick={triggerPicker}
            disabled={scanStatus === 'scanning'}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-full text-xs font-bold shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            id="btn-scan-trigger"
          >
            <RefreshCw size={14} className={scanStatus === 'scanning' ? 'animate-spin' : ''} />
            Scan Storage Folder
          </button>
        )}
      </div>
    </div>
  );
};
