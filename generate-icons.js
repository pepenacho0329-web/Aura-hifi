import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPng(width, height) {
  // RGBA buffer: height rows, each row has 1 filter byte (0) + width * 4 bytes
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowLength);

  const cx = width / 2;
  const cy = height / 2;
  const rOuter = width * 0.45;
  const rInner = width * 0.18;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default dark background (#0a0907)
      let r = 10, g = 9, b = 7, a = 255;

      // Rounded squircle background
      const cornerRadius = width * 0.22;
      const qx = Math.max(0, Math.abs(dx) - (cx - cornerRadius));
      const qy = Math.max(0, Math.abs(dy) - (cy - cornerRadius));
      const cornerDist = Math.sqrt(qx * qx + qy * qy);

      if (cornerDist > cornerRadius) {
        a = 0; // transparent outside rounded corner
      } else {
        // Inner vinyl groove rings
        if (Math.abs(dist - width * 0.40) < 1.5 ||
            Math.abs(dist - width * 0.35) < 1.5 ||
            Math.abs(dist - width * 0.30) < 1.5) {
          r = 35; g = 30; b = 25;
        }

        // Golden Headphone Arch: dist around width * 0.25, top half (dy <= 0)
        const archDist = Math.abs(dist - width * 0.24);
        if (archDist < width * 0.035 && dy < width * 0.08) {
          r = 245; g = 158; b = 11; // Amber #f59e0b
        }

        // Left Ear Cup
        if (x >= cx - width * 0.30 && x <= cx - width * 0.20 &&
            y >= cy - width * 0.02 && y <= cy + width * 0.18) {
          r = 251; g = 191; b = 36; // Amber gold
        }

        // Right Ear Cup
        if (x >= cx + width * 0.20 && x <= cx + width * 0.30 &&
            y >= cy - width * 0.02 && y <= cy + width * 0.18) {
          r = 251; g = 191; b = 36; // Amber gold
        }

        // Center Gold Disc Core
        if (dist < rInner) {
          r = 217; g = 119; b = 6;
          if (dist < width * 0.06) {
            r = 10; g = 9; b = 7; // spindle hole
          }
        }
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT chunk
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(12 + length);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const iconsDir = path.resolve('public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

// Generate 512x512, 192x192, and 180x180 (apple-touch-icon)
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPng(512, 512));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512.png'), createPng(512, 512));
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPng(192, 192));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), createPng(180, 180));

console.log('Successfully generated all PWA & Mobile icons (PNG + SVG)!');
