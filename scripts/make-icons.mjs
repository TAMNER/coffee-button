// Writes public/apple-touch-icon.png (180x180): a flat brown cup on warm cream.
// Node built-ins only (no ImageMagick). Placeholder until the chosen art lands.
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SIZE = 180;
const S = SIZE / 120; // shapes are drawn in the same 120-unit space as favicon.svg
const cream = [0xf6, 0xea, 0xd7];
const brown = [0x7a, 0x4a, 0x2a];

function inCup(x, y) {
  // body: rectangle 24..84 x 40..70, then half-disc centre (54,70) r 30
  if (x >= 24 && x <= 84 && y >= 40 && y <= 70) return true;
  if (y > 70 && (x - 54) ** 2 + (y - 70) ** 2 <= 900) return true;
  // handle: ring centre (90,60) radius 12, stroke 7, right half only
  const d = Math.hypot(x - 90, y - 60);
  if (x >= 84 && d >= 8.5 && d <= 15.5) return true;
  return false;
}

const raw = Buffer.alloc(SIZE * (SIZE * 3 + 1));
for (let py = 0; py < SIZE; py++) {
  const row = py * (SIZE * 3 + 1);
  raw[row] = 0; // filter: none
  for (let px = 0; px < SIZE; px++) {
    // 4x4 supersampling for smooth edges
    let hits = 0;
    for (let sy = 0; sy < 4; sy++)
      for (let sx = 0; sx < 4; sx++)
        if (inCup((px + (sx + 0.5) / 4) / S, (py + (sy + 0.5) / 4) / S)) hits++;
    const t = hits / 16;
    for (let c = 0; c < 3; c++)
      raw[row + 1 + px * 3 + c] = Math.round(cream[c] * (1 - t) + brown[c] * t);
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // colour type: RGB
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw)),
  chunk("IEND", Buffer.alloc(0)),
]);

const out = fileURLToPath(new URL("../public/apple-touch-icon.png", import.meta.url));
writeFileSync(out, png);
console.log(`wrote ${out} (${png.length} bytes)`);
