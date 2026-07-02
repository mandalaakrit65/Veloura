/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Extracts embedded album artwork (APIC frame) from an MP3 / audio file ID3 tag.
 * Converts it to a Base64 data URL for durable persistence in IndexedDB.
 */
export async function extractAlbumArt(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) {
          resolve(null);
          return;
        }
        const view = new DataView(buffer);

        // Check for 'ID3' header at start of file
        if (
          view.byteLength < 10 ||
          view.getUint8(0) !== 0x49 || // 'I'
          view.getUint8(1) !== 0x44 || // 'D'
          view.getUint8(2) !== 0x33    // '3'
        ) {
          resolve(null);
          return;
        }

        const versionMajor = view.getUint8(3);

        // Get ID3 tag size (synchsafe integer: 4 bytes where MSB is always 0)
        const tagSize =
          ((view.getUint8(6) & 0x7f) << 21) |
          ((view.getUint8(7) & 0x7f) << 14) |
          ((view.getUint8(8) & 0x7f) << 7) |
          (view.getUint8(9) & 0x7f);

        let offset = 10;
        const maxOffset = Math.min(tagSize + 10, view.byteLength - 10);

        // Scan frames
        while (offset < maxOffset) {
          // Read 4-character Frame ID
          const frameIdBytes = [
            view.getUint8(offset),
            view.getUint8(offset + 1),
            view.getUint8(offset + 2),
            view.getUint8(offset + 3)
          ];
          const frameId = String.fromCharCode(...frameIdBytes);

          // Frame size
          let frameSize = 0;
          if (versionMajor === 4) {
            // ID3v2.4 uses synchsafe size for frames
            frameSize =
              ((view.getUint8(offset + 4) & 0x7f) << 21) |
              ((view.getUint8(offset + 5) & 0x7f) << 14) |
              ((view.getUint8(offset + 6) & 0x7f) << 7) |
              (view.getUint8(offset + 7) & 0x7f);
          } else {
            // ID3v2.3 uses standard 32-bit big-endian size
            frameSize = view.getUint32(offset + 4, false);
          }

          if (frameSize <= 0 || offset + 10 + frameSize > view.byteLength) {
            break;
          }

          // We're looking for the Attached Picture (APIC) frame
          if (frameId === 'APIC') {
            const apicOffset = offset + 10;
            const textEncoding = view.getUint8(apicOffset);

            // MIME type starts at apicOffset + 1 and is null-terminated
            let mimeTypeOffset = apicOffset + 1;
            let mimeType = '';
            while (mimeTypeOffset < apicOffset + frameSize) {
              const charCode = view.getUint8(mimeTypeOffset);
              if (charCode === 0) {
                break;
              }
              mimeType += String.fromCharCode(charCode);
              mimeTypeOffset++;
            }

            // Picture type is 1 byte after MIME type null terminator
            const pictureTypeOffset = mimeTypeOffset + 1;

            // Description is null-terminated (or double-null if UTF-16)
            let descOffset = pictureTypeOffset + 1;
            if (textEncoding === 1 || textEncoding === 2) {
              // UTF-16 has double-null terminator (0x00 0x00)
              while (descOffset < apicOffset + frameSize - 1) {
                if (view.getUint8(descOffset) === 0 && view.getUint8(descOffset + 1) === 0) {
                  descOffset += 2;
                  break;
                }
                descOffset += 2;
              }
            } else {
              // UTF-8 or ASCII has single null terminator (0x00)
              while (descOffset < apicOffset + frameSize) {
                if (view.getUint8(descOffset) === 0) {
                  descOffset++;
                  break;
                }
                descOffset++;
              }
            }

            // The rest of the frame is the actual image binary data
            const imgDataOffset = descOffset;
            const imgDataSize = apicOffset + frameSize - imgDataOffset;

            if (imgDataSize > 0) {
              const imgArray = new Uint8Array(buffer, imgDataOffset, imgDataSize);
              const blob = new Blob([imgArray], { type: mimeType || 'image/jpeg' });

              // Convert Blob directly to a Base64 Data URL for persistent storage
              const base64Reader = new FileReader();
              base64Reader.onloadend = function () {
                resolve(base64Reader.result as string);
              };
              base64Reader.readAsDataURL(blob);
              return;
            }
          }

          // Advance to the next frame
          offset += 10 + frameSize;
        }
        resolve(null);
      } catch (err) {
        console.error('Error parsing ID3 tags:', err);
        resolve(null);
      }
    };

    reader.onerror = function () {
      resolve(null);
    };

    // Read the first 12MB, which contains the ID3 tag metadata & embedded cover
    const sliceSize = Math.min(file.size, 12 * 1024 * 1024);
    reader.readAsArrayBuffer(file.slice(0, sliceSize));
  });
}

export interface ArtworkTheme {
  start: string;
  mid: string;
  end: string;
  text: string;
  accent: string;
}

export function getArtworkThemeColors(title: string, artist: string): ArtworkTheme {
  const nameHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const themes = [
    { start: '#FF6EC7', mid: '#A154F2', end: '#4A4458', text: '#FFFFFF', accent: '#FFD6F3' }, // Veloura Dusk
    { start: '#8A2387', mid: '#E94057', end: '#F27121', text: '#FFFFFF', accent: '#FFD6F3' }, // Solar Flare
    { start: '#11998E', mid: '#1B4D3E', end: '#38EF7D', text: '#FFFFFF', accent: '#E6FFFA' }, // Bio Synth
    { start: '#2193B0', mid: '#1D2A44', end: '#6DD5ED', text: '#FFFFFF', accent: '#EBF8FF' }, // Deep Atlantic
    { start: '#7F00FF', mid: '#3F007F', end: '#E100FF', text: '#FFFFFF', accent: '#F5E6FF' }, // Cosmic Laser
    { start: '#E65C00', mid: '#5A1A00', end: '#F9D423', text: '#FFFFFF', accent: '#FFFDF0' }  // Liquid Gold
  ];

  const cleanTitle = (title || 'Track').trim();
  const cleanArtist = (artist || 'Artist').trim();
  const hashVal = nameHash(cleanTitle + cleanArtist);
  return themes[hashVal % themes.length];
}

/**
 * Generates an elegant dynamic SVG gradient cover based on the artist & title.
 * Returns a high-definition, responsive vector SVG data URL with a consistent, premium design.
 */
export function generateGradientCover(title: string, artist: string): string {
  const nameHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  // High-fidelity gradient color schemes to keep a consistent, beautiful look
  const themes = [
    { start: '#FF6EC7', mid: '#A154F2', end: '#4A4458', text: '#FFFFFF', accent: '#FFD6F3' }, // Veloura Dusk
    { start: '#8A2387', mid: '#E94057', end: '#F27121', text: '#FFFFFF', accent: '#FFD6F3' }, // Solar Flare
    { start: '#11998E', mid: '#1B4D3E', end: '#38EF7D', text: '#FFFFFF', accent: '#E6FFFA' }, // Bio Synth
    { start: '#2193B0', mid: '#1D2A44', end: '#6DD5ED', text: '#FFFFFF', accent: '#EBF8FF' }, // Deep Atlantic
    { start: '#7F00FF', mid: '#3F007F', end: '#E100FF', text: '#FFFFFF', accent: '#F5E6FF' }, // Cosmic Laser
    { start: '#E65C00', mid: '#5A1A00', end: '#F9D423', text: '#FFFFFF', accent: '#FFFDF0' }  // Liquid Gold
  ];

  const cleanTitle = (title || 'Track').trim();
  const cleanArtist = (artist || 'Artist').trim();

  const hashVal = nameHash(cleanTitle + cleanArtist);
  const theme = themes[hashVal % themes.length];

  // Pick first letter of title and first letter of artist as monogram
  const initials = (cleanTitle.charAt(0) || 'T').toUpperCase();
  const subInitials = cleanArtist !== 'Unknown Artist' && cleanArtist !== 'Unknown' 
    ? (cleanArtist.charAt(0) || '').toUpperCase() 
    : '';
  const monogram = subInitials ? `${initials}${subInitials}` : initials;

  // Generate unique serial number to make the record look like a rare physical print
  const serialNo = `VL-${(hashVal % 10000).toString().padStart(4, '0')}`;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
      <defs>
        <!-- Mesh-like main gradient -->
        <linearGradient id="main-grad-${hashVal}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${theme.start};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${theme.mid};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${theme.end};stop-opacity:1" />
        </linearGradient>

        <!-- Vinyl metallic sheen reflection -->
        <radialGradient id="vinyl-sheen" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.1" />
          <stop offset="40%" style="stop-color:#000000;stop-opacity:0.3" />
          <stop offset="80%" style="stop-color:#ffffff;stop-opacity:0.15" />
          <stop offset="100%" style="stop-color:#000000;stop-opacity:0.85" />
        </radialGradient>

        <clipPath id="center-circle">
          <circle cx="200" cy="180" r="90" />
        </clipPath>
      </defs>

      <!-- Outer Record Sleeve Background with Inner Drop Shadow -->
      <rect width="100%" height="100%" fill="url(#main-grad-${hashVal})" />

      <!-- Minimalist Subtle Grid Line overlay to look technical -->
      <line x1="20" y1="20" x2="380" y2="20" stroke="white" stroke-opacity="0.15" stroke-width="1" />
      <line x1="20" y1="380" x2="380" y2="380" stroke="white" stroke-opacity="0.15" stroke-width="1" />
      <line x1="20" y1="20" x2="20" y2="380" stroke="white" stroke-opacity="0.15" stroke-width="1" />
      <line x1="380" y1="20" x2="380" y2="380" stroke="white" stroke-opacity="0.15" stroke-width="1" />

      <!-- Vinyl Disk grooves behind the center label -->
      <circle cx="200" cy="180" r="130" fill="none" stroke="black" stroke-opacity="0.15" stroke-width="1.5" />
      <circle cx="200" cy="180" r="120" fill="none" stroke="black" stroke-opacity="0.2" stroke-width="1" />
      <circle cx="200" cy="180" r="110" fill="none" stroke="black" stroke-opacity="0.25" stroke-width="2" />
      <circle cx="200" cy="180" r="100" fill="none" stroke="white" stroke-opacity="0.08" stroke-width="1" />

      <!-- The Real Vinyl Vinyl Core -->
      <circle cx="200" cy="180" r="90" fill="url(#vinyl-sheen)" />
      
      <!-- Inner grooves on vinyl label -->
      <circle cx="200" cy="180" r="82" fill="none" stroke="white" stroke-opacity="0.15" stroke-width="0.5" />
      
      <!-- Center Spindle Spindle-hole -->
      <circle cx="200" cy="180" r="14" fill="#18181B" stroke="white" stroke-opacity="0.2" stroke-width="2" />
      <circle cx="200" cy="180" r="5" fill="#FAF7F9" />

      <!-- Glassmorphic Metadata Overlay Banner at Bottom -->
      <rect x="20" y="285" width="360" height="75" rx="16" fill="white" fill-opacity="0.12" stroke="white" stroke-opacity="0.2" stroke-width="1" style="backdrop-filter: blur(8px);" />

      <!-- Monogram watermark in the background of the glass banner -->
      <text x="350" y="340" dominant-baseline="alphabetic" text-anchor="end" font-family="'Space Grotesk', system-ui, sans-serif" font-weight="900" font-size="36" fill="white" fill-opacity="0.06">${monogram}</text>

      <!-- Track Name & Artist Metadata labels inside the sleeve -->
      <text x="36" y="312" font-family="'Space Grotesk', system-ui, sans-serif" font-weight="900" font-size="15" fill="${theme.text}">${cleanTitle}</text>
      <text x="36" y="330" font-family="'Inter', system-ui, sans-serif" font-weight="600" font-size="11" fill="${theme.accent}" opacity="0.9">${cleanArtist}</text>
      <text x="36" y="344" font-family="'JetBrains Mono', monospace" font-weight="500" font-size="8" fill="white" opacity="0.5" letter-spacing="1">STEREO // 24-BIT LOSSLESS</text>

      <!-- Vintage Tech Spec Tags (Top Left / Right) -->
      <text x="32" y="42" font-family="'JetBrains Mono', monospace" font-weight="700" font-size="9" fill="white" opacity="0.75" letter-spacing="1.5">VELOURA RECORDS</text>
      <text x="368" y="42" dominant-baseline="alphabetic" text-anchor="end" font-family="'JetBrains Mono', monospace" font-weight="700" font-size="9" fill="white" opacity="0.75" letter-spacing="1.5">${serialNo}</text>

      <!-- Bottom Branding print -->
      <text x="368" y="312" dominant-baseline="alphabetic" text-anchor="end" font-family="'JetBrains Mono', monospace" font-weight="700" font-size="8" fill="white" opacity="0.4">OPUS AUDIO ENGINE</text>
      <text x="368" y="325" dominant-baseline="alphabetic" text-anchor="end" font-family="'Space Grotesk', system-ui, sans-serif" font-weight="800" font-size="10" fill="white" opacity="0.8">HI-RES</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
