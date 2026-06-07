import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

function createPngBuffer(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth: 8
  ihdrData.writeUInt8(6, 9); // color type: 6 (RGBA)
  ihdrData.writeUInt8(0, 10); // compression method: 0
  ihdrData.writeUInt8(0, 11); // filter method: 0
  ihdrData.writeUInt8(0, 12); // interlace method: 0
  const ihdr = createChunk('IHDR', ihdrData);

  // IDAT Chunk
  const rowSize = width * 4;
  const filteredBuffer = Buffer.alloc(height * (rowSize + 1));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    filteredBuffer.writeUInt8(0, offset++); // Filter 0 (None)
    const sourceRowOffset = y * rowSize;
    rgbaBuffer.copy(filteredBuffer, offset, sourceRowOffset, sourceRowOffset + rowSize);
    offset += rowSize;
  }

  const compressedData = zlib.deflateSync(filteredBuffer, { level: 9 });
  const idat = createChunk('IDAT', compressedData);

  // IEND Chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const chunkType = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crcBuffer = Buffer.concat([chunkType, data]);
  const crcValue = crc(crcBuffer);
  const crcBytes = Buffer.alloc(4);
  crcBytes.writeUInt32BE(crcValue >>> 0, 0);

  return Buffer.concat([length, chunkType, data, crcBytes]);
}

// CRC32 table & calculation
const crcTable = [];
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[i] = c;
}

function crc(buffer) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buffer.length; i++) {
    c = crcTable[(c ^ buffer[i]) & 0xFF] ^ (c >>> 8);
  }
  return c ^ 0xFFFFFFFF;
}

function renderIcon(width, height) {
  const buffer = Buffer.alloc(width * height * 4);
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const x = px / (width - 1);
      const y = py / (height - 1);

      // Default background: Premium Dark Slate
      let r = 11, g = 18, b = 32, a = 255;

      const dx = x - 0.5;
      const dy = y - 0.5;
      const val = Math.pow(dx, 4) + Math.pow(dy, 4);

      if (val < Math.pow(0.44, 4)) {
        // Inside squircle
        r = 15;
        g = 23;
        b = 42;
        a = 255;

        // Squircle outer border (gradient green to teal)
        if (val > Math.pow(0.40, 4)) {
          const angle = Math.atan2(dy, dx);
          const pct = (angle + Math.PI) / (2 * Math.PI);
          // Interpolate 22c55e (34, 197, 94) to 10b981 (16, 185, 129)
          r = Math.round(34 * pct + 16 * (1 - pct));
          g = Math.round(197 * pct + 185 * (1 - pct));
          b = Math.round(94 * pct + 129 * (1 - pct));
        } else {
          // Inside design
          const rx = x;
          const ry = y;
          let inBar = false;
          let barPct = 0;

          // Three financial growth bar shapes
          function checkBar(bx, bWidth, bTop, bBottom) {
            const hHalfWidth = bWidth / 2;
            if (rx >= bx - hHalfWidth && rx <= bx + hHalfWidth) {
              if (ry >= bTop + hHalfWidth && ry <= bBottom) return true;
              
              // Rounded cap
              const capDy = ry - (bTop + hHalfWidth);
              const capDx = rx - bx;
              if (ry < bTop + hHalfWidth) {
                return (capDx*capDx + capDy*capDy) <= hHalfWidth*hHalfWidth;
              }
            }
            return false;
          }

          if (checkBar(0.36, 0.08, 0.55, 0.70)) {
            inBar = true;
            barPct = 0.5;
          } else if (checkBar(0.50, 0.08, 0.42, 0.70)) {
            inBar = true;
            barPct = 0.75;
          } else if (checkBar(0.64, 0.08, 0.28, 0.70)) {
            inBar = true;
            barPct = 1.0;
          }

          if (inBar) {
            r = Math.round(34 * barPct + 16 * (1 - barPct));
            g = Math.round(197 * barPct + 185 * (1 - barPct));
            b = Math.round(94 * barPct + 129 * (1 - barPct));
          }

          // Golden trend arc
          const trendX = x;
          const trendY = 0.75 - 0.52 * Math.sin((trendX - 0.22) * 2.1);
          if (x >= 0.25 && x <= 0.75) {
            const distToCurve = Math.abs(y - trendY);
            if (distToCurve < 0.012) {
              r = 250;
              g = 204;
              b = 21;
              a = 255;
            }
          }
        }
      }

      const pixelOffset = (py * width + px) * 4;
      buffer[pixelOffset] = r;
      buffer[pixelOffset + 1] = g;
      buffer[pixelOffset + 2] = b;
      buffer[pixelOffset + 3] = a;
    }
  }
  return buffer;
}

const sizes = [192, 512];
for (const size of sizes) {
  console.log(`Rendering SpendWise ${size}x${size} PNG icon...`);
  const rgba = renderIcon(size, size);
  const png = createPngBuffer(size, size, rgba);
  
  // Write to workspace root
  const rootPath = `icon-${size}.png`;
  fs.writeFileSync(rootPath, png);
  console.log(`Saved ${rootPath}`);

  // Write to public folder
  const publicDir = './public';
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const publicPath = path.join(publicDir, `icon-${size}.png`);
  fs.writeFileSync(publicPath, png);
  console.log(`Saved ${publicPath}`);
}
console.log("PNG icons generation completed successfully.");
