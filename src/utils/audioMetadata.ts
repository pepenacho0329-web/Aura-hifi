/**
 * Client-side embedded album artwork and metadata extractor
 * Supports ID3v2 (MP3/AAC), FLAC Vorbis picture blocks (block 6), MP4/M4A covr atoms,
 * companion image files (cover.jpg/png), and generative vinyl sleeves.
 */

export interface ExtractedMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string;
  coverUrl?: string;
  hasEmbeddedCover?: boolean;
}

/**
 * Extracts metadata and embedded album artwork from an audio File.
 */
export async function extractAudioFileMetadata(file: File): Promise<ExtractedMetadata> {
  const result: ExtractedMetadata = {
    title: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
    artist: 'Archivo Local',
    album: 'Álbum Desconocido',
    hasEmbeddedCover: false,
  };

  try {
    // Read up to first 1MB for metadata headers and embedded image data
    const readSize = Math.min(file.size, 1024 * 1024);
    const buffer = await file.slice(0, readSize).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // 1. Check ID3v2 header ('ID3')
    if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      const id3Data = parseID3v2(bytes);
      if (id3Data.title) result.title = id3Data.title;
      if (id3Data.artist) result.artist = id3Data.artist;
      if (id3Data.album) result.album = id3Data.album;
      if (id3Data.year) result.year = id3Data.year;
      if (id3Data.genre) result.genre = id3Data.genre;
      if (id3Data.coverUrl) {
        result.coverUrl = id3Data.coverUrl;
        result.hasEmbeddedCover = true;
      }
    }
    // 2. Check FLAC header ('fLaC')
    else if (bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43) {
      const flacData = parseFlacMetadata(bytes);
      if (flacData.title) result.title = flacData.title;
      if (flacData.artist) result.artist = flacData.artist;
      if (flacData.album) result.album = flacData.album;
      if (flacData.coverUrl) {
        result.coverUrl = flacData.coverUrl;
        result.hasEmbeddedCover = true;
      }
    }
    // 3. Check MP4 / M4A ('ftyp' or 'moov' atom)
    else if (
      (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) ||
      (bytes[4] === 0x6d && bytes[5] === 0x6f && bytes[6] === 0x6f && bytes[7] === 0x76)
    ) {
      const mp4Data = parseMp4Cover(bytes);
      if (mp4Data.coverUrl) {
        result.coverUrl = mp4Data.coverUrl;
        result.hasEmbeddedCover = true;
      }
    }
  } catch (err) {
    console.warn('Metadata parsing fallback for:', file.name, err);
  }

  // If no embedded artwork found, generate an audiophile vinyl sleeve artwork
  if (!result.coverUrl) {
    result.coverUrl = generateArtworkPlaceholder(result.title || file.name, result.artist || 'AuraHiFi');
  }

  return result;
}

/**
 * Pairs companion cover image files (e.g., cover.jpg, folder.png, album.jpg) with tracks.
 */
export function pairCompanionImagesWithTracks(
  tracks: { relativePath?: string; coverUrl?: string }[],
  imageFiles: { file: File; relativePath: string }[]
) {
  if (imageFiles.length === 0) return;

  imageFiles.forEach((imgItem) => {
    const imgDir = getDirectoryPath(imgItem.relativePath);
    const imageUrl = URL.createObjectURL(imgItem.file);

    tracks.forEach((track) => {
      const trackDir = getDirectoryPath(track.relativePath || '');
      // Match image in same directory or root cover
      if (trackDir === imgDir || imageFiles.length === 1) {
        track.coverUrl = imageUrl;
      }
    });
  });
}

function getDirectoryPath(path: string): string {
  const parts = path.split('/');
  parts.pop(); // remove filename
  return parts.join('/');
}

function parseID3v2(bytes: Uint8Array): ExtractedMetadata {
  const res: ExtractedMetadata = {};
  const majorVersion = bytes[3]; // e.g., 3 or 4
  let offset = 10; // Skip 10-byte ID3 header
  const totalLength = bytes.length;

  while (offset < totalLength - 10) {
    const frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
    if (!/^[A-Z0-9]{4}$/.test(frameId)) break;

    // Frame size
    let frameSize = 0;
    if (majorVersion === 4) {
      // Syncsafe in ID3v2.4
      frameSize =
        (bytes[offset + 4] << 21) |
        (bytes[offset + 5] << 14) |
        (bytes[offset + 6] << 7) |
        bytes[offset + 7];
    } else {
      // Standard big-endian in ID3v2.3
      frameSize =
        (bytes[offset + 4] << 24) |
        (bytes[offset + 5] << 16) |
        (bytes[offset + 6] << 8) |
        bytes[offset + 7];
    }

    if (frameSize <= 0 || offset + 10 + frameSize > totalLength) break;
    const frameData = bytes.subarray(offset + 10, offset + 10 + frameSize);

    if (frameId === 'TIT2') {
      res.title = decodeTextFrame(frameData);
    } else if (frameId === 'TPE1') {
      res.artist = decodeTextFrame(frameData);
    } else if (frameId === 'TALB') {
      res.album = decodeTextFrame(frameData);
    } else if (frameId === 'TCON') {
      res.genre = decodeTextFrame(frameData);
    } else if (frameId === 'TYER' || frameId === 'TDRC') {
      const yearStr = decodeTextFrame(frameData);
      const y = parseInt(yearStr, 10);
      if (!isNaN(y)) res.year = y;
    } else if (frameId === 'APIC') {
      const cover = decodeApicFrame(frameData);
      if (cover) res.coverUrl = cover;
    }

    offset += 10 + frameSize;
  }

  return res;
}

function decodeTextFrame(data: Uint8Array): string {
  if (data.length <= 1) return '';
  const encoding = data[0];
  const textBytes = data.subarray(1);

  try {
    if (encoding === 0 || encoding === 3) {
      return new TextDecoder('utf-8').decode(textBytes).replace(/\0+$/, '').trim();
    } else if (encoding === 1 || encoding === 2) {
      return new TextDecoder('utf-16').decode(textBytes).replace(/\0+$/, '').trim();
    }
  } catch {
    // fallback
  }
  return '';
}

function decodeApicFrame(data: Uint8Array): string | null {
  try {
    if (data.length < 10) return null;
    let pos = 1; // skip encoding byte

    // MIME type string (null terminated)
    let mime = '';
    while (pos < data.length && data[pos] !== 0) {
      mime += String.fromCharCode(data[pos]);
      pos++;
    }
    pos++; // skip null byte

    if (!mime || mime.length === 0) mime = 'image/jpeg';
    if (!mime.includes('/')) mime = `image/${mime}`;

    pos++; // skip picture type (3 = cover front)

    // Skip description string until null byte
    while (pos < data.length && data[pos] !== 0) {
      pos++;
    }
    pos++; // skip null byte

    // Check if there is another null for utf-16
    if (pos < data.length && data[pos] === 0) {
      pos++;
    }

    // Image data is remainder of bytes
    const imgBytes = data.subarray(pos);
    if (imgBytes.length > 64) {
      const blob = new Blob([imgBytes as any], { type: mime });
      return URL.createObjectURL(blob);
    }
  } catch {
    // ignore
  }
  return null;
}

function parseFlacMetadata(bytes: Uint8Array): ExtractedMetadata {
  const res: ExtractedMetadata = {};
  let offset = 4; // Skip 'fLaC'

  while (offset < bytes.length - 4) {
    const isLast = (bytes[offset] & 0x80) !== 0;
    const blockType = bytes[offset] & 0x7f;
    const length = (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];

    offset += 4;
    if (offset + length > bytes.length) break;

    // Block type 4 = VORBIS_COMMENT
    if (blockType === 4) {
      try {
        const commentBytes = bytes.subarray(offset, offset + length);
        parseVorbisComment(commentBytes, res);
      } catch {
        // ignore
      }
    }
    // Block type 6 = PICTURE
    else if (blockType === 6) {
      try {
        const picBytes = bytes.subarray(offset, offset + length);
        // Picture structure: type (4b), mime length (4b), mime, desc length (4b), desc, width (4b), height (4b), depth (4b), colors (4b), data length (4b), data
        const mimeLen = (picBytes[4] << 24) | (picBytes[5] << 16) | (picBytes[6] << 8) | picBytes[7];
        let p = 8;
        let mime = '';
        for (let i = 0; i < mimeLen && p < picBytes.length; i++) {
          mime += String.fromCharCode(picBytes[p++]);
        }
        const descLen = (picBytes[p] << 24) | (picBytes[p + 1] << 16) | (picBytes[p + 2] << 8) | picBytes[p + 3];
        p += 4 + descLen + 16; // skip desc + width/height/depth/colors

        const dataLen = (picBytes[p] << 24) | (picBytes[p + 1] << 16) | (picBytes[p + 2] << 8) | picBytes[p + 3];
        p += 4;
        const imgData = picBytes.subarray(p, p + dataLen);
        if (imgData.length > 64) {
          const blob = new Blob([imgData as any], { type: mime || 'image/jpeg' });
          res.coverUrl = URL.createObjectURL(blob);
        }
      } catch {
        // ignore
      }
    }

    if (isLast) break;
    offset += length;
  }

  return res;
}

function parseVorbisComment(bytes: Uint8Array, out: ExtractedMetadata) {
  let pos = 0;
  // Vendor length (4 bytes little endian)
  const vendorLen = bytes[pos] | (bytes[pos + 1] << 8) | (bytes[pos + 2] << 16) | (bytes[pos + 3] << 24);
  pos += 4 + vendorLen;

  // Number of user comments (4 bytes little endian)
  const userCommentListLen = bytes[pos] | (bytes[pos + 1] << 8) | (bytes[pos + 2] << 16) | (bytes[pos + 3] << 24);
  pos += 4;

  const decoder = new TextDecoder('utf-8');
  for (let i = 0; i < userCommentListLen && pos < bytes.length; i++) {
    const len = bytes[pos] | (bytes[pos + 1] << 8) | (bytes[pos + 2] << 16) | (bytes[pos + 3] << 24);
    pos += 4;
    if (pos + len > bytes.length) break;

    const comment = decoder.decode(bytes.subarray(pos, pos + len));
    pos += len;

    const eqIdx = comment.indexOf('=');
    if (eqIdx > 0) {
      const key = comment.slice(0, eqIdx).toUpperCase();
      const val = comment.slice(eqIdx + 1);
      if (key === 'TITLE' && !out.title) out.title = val;
      else if (key === 'ARTIST' && !out.artist) out.artist = val;
      else if (key === 'ALBUM' && !out.album) out.album = val;
      else if (key === 'GENRE' && !out.genre) out.genre = val;
      else if (key === 'DATE' || key === 'YEAR') {
        const y = parseInt(val, 10);
        if (!isNaN(y)) out.year = y;
      }
    }
  }
}

function parseMp4Cover(bytes: Uint8Array): ExtractedMetadata {
  const res: ExtractedMetadata = {};
  // Search for 'covr' atom pattern
  for (let i = 0; i < bytes.length - 16; i++) {
    if (
      bytes[i] === 0x63 &&
      bytes[i + 1] === 0x6f &&
      bytes[i + 2] === 0x76 &&
      bytes[i + 3] === 0x72
    ) {
      // Found 'covr'. Next atom inside is usually 'data'
      for (let j = i + 4; j < Math.min(i + 32, bytes.length - 12); j++) {
        if (
          bytes[j] === 0x64 &&
          bytes[j + 1] === 0x61 &&
          bytes[j + 2] === 0x74 &&
          bytes[j + 3] === 0x61
        ) {
          // 'data' atom header: 4 bytes length, 4 bytes 'data', 4 bytes type flags, 4 bytes locale
          const dataLength = (bytes[j - 4] << 24) | (bytes[j - 3] << 16) | (bytes[j - 2] << 8) | bytes[j - 1];
          const imgStart = j + 12; // skip 'data' + 8 bytes flags/locale
          const imgLength = dataLength - 16;

          if (imgLength > 64 && imgStart + imgLength <= bytes.length) {
            const imgBytes = bytes.subarray(imgStart, imgStart + imgLength);
            const isPng = imgBytes[0] === 0x89 && imgBytes[1] === 0x50;
            const mime = isPng ? 'image/png' : 'image/jpeg';
            const blob = new Blob([imgBytes as any], { type: mime });
            res.coverUrl = URL.createObjectURL(blob);
            return res;
          }
        }
      }
    }
  }
  return res;
}

/**
 * Generates an elegant vinyl sleeve cover SVG data URI when no artwork is embedded
 */
export function generateArtworkPlaceholder(title: string, artist: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
  }
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 55) % 360;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="sleeve" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(${hue1}, 80%, 20%)" />
        <stop offset="50%" stop-color="hsl(${hue2}, 75%, 12%)" />
        <stop offset="100%" stop-color="#0a0a0c" />
      </linearGradient>
      <radialGradient id="disc" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#2a241a" />
        <stop offset="100%" stop-color="#050505" />
      </radialGradient>
    </defs>
    <rect width="600" height="600" fill="url(#sleeve)" />
    
    <!-- Concentric Vinyl Grooves -->
    <circle cx="300" cy="300" r="240" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="2" />
    <circle cx="300" cy="300" r="200" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1.5" />
    <circle cx="300" cy="300" r="160" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1.5" />
    <circle cx="300" cy="300" r="120" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
    
    <!-- Center Label -->
    <circle cx="300" cy="300" r="95" fill="url(#disc)" stroke="#f59e0b" stroke-width="3" />
    <circle cx="300" cy="300" r="14" fill="#030303" stroke="#666" stroke-width="2" />

    <!-- Typography -->
    <text x="300" y="90" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="900" font-size="32" fill="#ffffff" text-anchor="middle" letter-spacing="1">
      ${escapeXml(title.slice(0, 26))}
    </text>
    <text x="300" y="130" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="600" font-size="18" fill="rgba(255,255,255,0.75)" text-anchor="middle" letter-spacing="2">
      ${escapeXml(artist.slice(0, 30))}
    </text>
    <text x="300" y="535" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700" fill="#f59e0b" text-anchor="middle" letter-spacing="4">
      AURA HI-FI · STUDIO MASTER
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}
