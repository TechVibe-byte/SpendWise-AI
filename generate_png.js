import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

function createPngBuffer(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);  // bit depth: 8
  ihdrData.writeUInt8(6, 9);  // color type: 6 (RGBA)
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

// Lerp helper
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Check if point is inside a rounded rectangle (squircle-style corner rounding)
function isInRoundedRect(px, py, w, h, rx, ry) {
  // Rounded corners: if near corner, check ellipse
  const ox = Math.max(0, Math.abs(px - w / 2) - (w / 2 - rx));
  const oy = Math.max(0, Math.abs(py - h / 2) - (h / 2 - ry));
  return (ox * ox) / (rx * rx) + (oy * oy) / (ry * ry) <= 1;
}

// Check if point (px, py) is inside a rounded rectangle with corner radius r
// rect defined by center cx, cy, half-width hw, half-height hh
function inRoundedRectCentered(px, py, cx, cy, hw, hh, r) {
  const dx = Math.abs(px - cx);
  const dy = Math.abs(py - cy);
  if (dx > hw || dy > hh) return false;
  const ox = Math.max(0, dx - (hw - r));
  const oy = Math.max(0, dy - (hh - r));
  return ox * ox + oy * oy <= r * r;
}

// Check if a point is inside the rounded background square icon
function isInIconBackground(x, y, size) {
  const cornerRadius = size * 0.234; // ~120/512 ratio matching the SVG
  return inRoundedRectCentered(x, y, size / 2, size / 2, size / 2, size / 2, cornerRadius);
}

/**
 * Renders the SpendWise S-shaped logo icon.
 * Design matches:
 *  - Purple gradient background (top-left: #8B5CF6 -> bottom-right: #5b21b6)
 *  - Top loop: #22c55e (green) — upper half S-shape
 *  - Bottom loop: white (opacity 0.92) — lower half S-shape
 *  - Thin gradient transition band in the middle
 */
function renderIcon(size) {
  const buffer = Buffer.alloc(size * size * 4);

  // Logo occupies 60% of icon, centered with padding
  // SVG viewbox: 0..512, logo shapes use normalized coords 0..1
  // Shapes in SVG coords (512x512 canvas):
  //  Top loop (green):    path roughly occupying top-left to center-right
  //  Bottom loop (white): path roughly occupying center-left to bottom-right
  // We use a pixel-level signed-distance / analytical approach.

  const S = size;

  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      // Normalized coords 0..1
      const nx = px / (S - 1);
      const ny = py / (S - 1);

      // Default: transparent
      let r = 0, g = 0, b = 0, a = 0;

      // --- Background rounded rect ---
      if (isInIconBackground(px, py, S)) {
        // Purple gradient: top-left #8B5CF6 to bottom-right #5b21b6
        const t = (nx + ny) / 2;
        r = Math.round(lerp(0x8B, 0x5b, t));
        g = Math.round(lerp(0x5C, 0x21, t));
        b = Math.round(lerp(0xF6, 0xb6, t));
        a = 255;

        // --- S-shaped logo paths ---
        // SVG coords: 0..512 space
        // Logo inner bounding box padded ~20% each side
        // Top loop: semi-circle on top-left, anti-semi on bottom-right
        // Analytically: the logo is two "D" shapes, mirrored

        // Scale: logo lives in [153.6, 358.4] x [102, 410] in the 512 space
        // Normalize those to 0..1 for our nx, ny
        // logoX range: 153.6..358.4  -> logoNx = (nx*512 - 153.6) / 204.8
        // logoY range: 102..410      -> logoNy = (ny*512 - 102) / 308

        const SX = nx * 512; // pixel x in SVG space
        const SY = ny * 512; // pixel y in SVG space

        // Logo boundary box
        const LX1 = 153.6, LX2 = 358.4; // left, right
        const LY1 = 102, LY2 = 410;     // top, bottom
        const LCX = (LX1 + LX2) / 2;   // 256
        const LCY = (LY1 + LY2) / 2;   // 256
        const LW = LX2 - LX1;           // 204.8
        const LH = LY2 - LY1;           // 308
        const halfW = LW / 2;           // 102.4
        const halfH = LH / 2;           // 154

        // The S-logo is two D-shapes:
        //   Top-D (green): left side straight, right side semicircle — occupies top half
        //     flat edge: x from LX1..LX2, y = LCY  (horizontal split)
        //     but it's a rotated D shape: flat on right, arc on left
        //   Bottom-D (white): flat on left, arc on right — occupies bottom half

        // More precisely from the SVG paths:
        // Top loop (green):
        //   "M358.4,153.6 C358.4,210.194 312.794,256 256.2,256 H153.6 V153.6
        //    C153.6,125.094 176.694,102 205.2,102 H307.2
        //    C335.706,102 358.4,125.094 358.4,153.6Z"
        //   = A rounded rectangle occupying top half [LX1..LX2] x [LY1..LCY]
        //     with rounded corners radius ~28 (27.5 = 102/512*128?)
        //   Actually it is: top half of the icon, with rounded corners top-left & top-right only? No...
        //   Let me re-read: it's a shape that has:
        //     - Straight left edge from (LX1, LCY) to (LX1, LY1+cornerR)
        //     - Rounded top-left corner
        //     - Straight top edge to (LX2-cornerR, LY1)
        //     - Rounded top-right corner
        //     - Right edge curves inward (semicircle) to (LX2, LCY)... wait that's the arc
        //   Actually: "C358.4,210.194 312.794,256 256.2,256" - this IS a bezier arc
        //   The top loop and bottom loop create a classic "S" or "yin-yang" like figure.
        //   The top is a D-shape rotated 90° counterclockwise.

        // Let me use a simpler analytical model:
        // The icon is essentially two rounded rectangles, one on top half and one on bottom half,
        // with a semicircular cutout on one side of each.

        // TOP HALF shape (green) — occupies:
        //   Full width [LX1..LX2], top half [LY1..LCY]
        //   MINUS semicircle cut on right that extends into bottom half
        //   PLUS semicircle bump on left extending down into middle
        // This creates the S-yin-yang shape.

        // Actually the simplest model: it's a yin-yang S symbol.
        // The dividing curve is a vertical S-curve through the center.
        // Top region (green) = left side of S-curve in top, right side in bottom... no

        // Let me use the actual bezier paths analytically.
        // The two paths in the SVG are:
        // Bottom-white path: "M153.6,358.4 C153.6,301.806 199.206,256 255.8,256 H358.4 V358.4
        //                     C358.4,386.906 335.306,410 306.8,410 H204.8
        //                     C176.294,410 153.6,386.906 153.6,358.4Z"
        // = Rectangle [LX1..LX2] x [LCY..LY2] with:
        //   - Top edge replaced by a curve going from (LX1,LCY) to (LCX,LCY) via arc (semicircle up? No, it's C153.6,301.806...)
        //   Actually this is a rounded rect with rounded corners on bottom, and top-right is a curve.

        // Simplified rendering: treat as two rectangles for top/bottom halves
        // with rounded corners and a curved centerline.

        const inLogoBox = SX >= LX1 && SX <= LX2 && SY >= LY1 && SY <= LY2;
        if (inLogoBox) {
          // Corner radius for logo shapes (from SVG: ~28px in 512 space ≈ LW*0.14)
          const CR = LW * 0.136; // ~27.8

          // TOP LOOP (green): upper rounded-rect with semicircle arc on right side
          // Approximate: rounded rect top half [LX1..LX2] x [LY1..LCY]
          // with curved bottom edge: semicircle dipping from right toward left
          const topRectR = inRoundedRectCentered(SX, SY, LCX, (LY1 + LCY) / 2, halfW, halfH / 2 + 0.5, CR);
          // Add left-side bump: semicircle centered at (LCX, LCY) with radius halfW/2, extending upward into top half
          const bumpCX = LCX - halfW / 2; // = LX1 + halfW/2 = 153.6 + 51.2 = 204.8
          // Actually the curve: "C358.4,210.194 312.794,256 256.2,256" means right side arcs to center
          // and "C153.6,125.094 176.694,102..." means left side is rounded corner
          // Bottom of green shape = horizontal line at LCY with a RIGHT-side semicircle depression
          //   i.e., the right half of the bottom is cut away by a circle

          // Semicircle on bottom-right of top shape (cut = removed area)
          const scR = halfH / 2; // radius of the S-curve semicircle = half of half-height = LH/4
          const scCX_top = LCX + halfW / 2; // right-center: 256 + 51.2 = 307.2... not quite
          // From SVG: arc goes from (LX2, LCY) up to (LCX, LCY) with control points suggesting center at (LX2, LCY-scR)
          // Actually: "M...H153.6 V153.6 C..." - the arc in top shape has center approximately at (LX2, LY1+halfH) for a quarter-circle
          // Let me use a cleaner interpretation:
          // The center S-curve dividing line is a cubic bezier. The two shapes are:
          //   Top (green) = everything ABOVE the S-curve
          //   Bottom (white) = everything BELOW the S-curve

          // The S-curve dividing path (centerline):
          // From SVG bottom-white path top edge:
          //   M(LX1, LCY) C(LX1, LCY - halfH/2)(LX2, LCY - halfH/2)(LX2, LCY)
          //   Wait that's a symmetric S. Let me just use: standard yin-yang S curve

          // S-curve: from (LX1, LCY) bezier to (LX2, LCY) through control points:
          // P1=(LX1, LCY - halfH*0.55), P2=(LX2, LCY - halfH*0.55) [top shape's bottom edge]
          // Approximate it as: for a given x in [LX1..LX2], the dividing y = LCY - halfH*0.55*f(x)
          // where f is a sine-like curve.

          // Simpler approach: use a cubic bezier approximation as a lookup
          // The top green shape has its bottom boundary as the top-white-path's arc.
          // "C153.6,301.806 199.206,256 255.8,256" - this goes from (LX1=153.6, LY2=410) no wait...
          // It's: M(153.6, 358.4) C(153.6, 301.806) (199.206, 256) (255.8, 256) H(358.4) V(358.4)...
          // So the top of the white shape goes from LX1@LY=LCY... no, from (255.8, 256)=(~LCX, LCY)
          // across to LX2, then down.

          // OK, I'll use the actual formulation:
          // The logo can be described as:
          //   inGreen: in top rounded-rect AND in left half-circle of middle row
          //   inWhite: in bottom rounded-rect AND in right half-circle of middle row
          // The left/right half-circles create the S-yin-yang bulges.

          // Top green D-shape: Rectangle [LX1..LX2]x[LY1..LCY] with right-side semicircle cut AND left-side semicircle added
          // Semicircle radius = halfW / 2
          const scR2 = halfW / 2; // 51.2
          // Right side CUT (from green, concave): center at (LX2, LCY), radius scR2
          const distRightCut = Math.sqrt((SX - LX2) ** 2 + (SY - LCY) ** 2);
          // Left side BUMP (added to green, convex): center at (LX1, LCY), radius scR2
          const distLeftBump = Math.sqrt((SX - LX1) ** 2 + (SY - LCY) ** 2);

          // Green region:
          //   (in top rect OR in left-side semicircle extending below LCY)
          //   AND NOT in right-side semicircle cut below LCY
          const inTopRect = SX >= LX1 && SX <= LX2 && SY >= LY1 && SY <= LCY;
          const inLeftBump = distLeftBump <= scR2 && SY >= LCY; // semicircle below LCY on left
          const inRightCut = distRightCut <= scR2 && SY <= LCY;  // semicircle above LCY on right

          const isGreen = (inTopRect || inLeftBump) && !inRightCut;

          // White region (symmetric / mirrored):
          const distRightBump = Math.sqrt((SX - LX2) ** 2 + (SY - LCY) ** 2);
          const distLeftCut = Math.sqrt((SX - LX1) ** 2 + (SY - LCY) ** 2);
          const inBottomRect = SX >= LX1 && SX <= LX2 && SY >= LCY && SY <= LY2;
          const inRightBump2 = distRightBump <= scR2 && SY <= LCY;
          const inLeftCut2 = distLeftCut <= scR2 && SY >= LCY;

          const isWhite = (inBottomRect || inRightBump2) && !inLeftCut2;

          // Apply rounded corners to the whole logo bounding box
          const inLogoBBox = inRoundedRectCentered(SX, SY, LCX, (LY1 + LY2) / 2, halfW, halfH, CR);

          if (inLogoBBox) {
            if (isGreen) {
              // Green: #22c55e
              r = 0x22; g = 0xc5; b = 0x5e; a = 255;
            } else if (isWhite) {
              // White with slight transparency
              r = 255; g = 255; b = 255; a = 235;
            }
            // else: stays as purple background (already set)
          }
        }
      }

      const pixelOffset = (py * S + px) * 4;
      buffer[pixelOffset]     = r;
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
  const rgba = renderIcon(size);
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
