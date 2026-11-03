// Writes the Cut Paper cup icons into public/: apple-touch-icon.png (180),
// pwa-192.png, pwa-512.png, pwa-maskable-512.png and favicon.svg.
// Node built-ins only (no ImageMagick). Shapes use the coordinates of the cup
// in mockups/directions.html, section "B. Cut Paper", so the icon matches it.
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const C = {
  paper: "#F6CDC1", // salmon background
  mustard: "#F5B335",
  cream: "#FFF9EF",
  cobalt: "#2443B0",
  tomato: "#E5533C",
  coffee: "#6B3A22",
  shadow: "#8E2F25", // hard offset shadow
};

// Each shape has an SVG form and a point test in the same coordinate space.
const circle = (cx, cy, r) => ({
  svg: (fill) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`,
  hit: (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r,
});
const pill = (x0, y0, w, h, r) => ({
  svg: (fill) => `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`,
  hit: (x, y) => {
    if (x < x0 || x > x0 + w || y < y0 || y > y0 + h) return false;
    const nx = Math.min(Math.max(x, x0 + r), x0 + w - r);
    const ny = Math.min(Math.max(y, y0 + r), y0 + h - r);
    return (x - nx) ** 2 + (y - ny) ** 2 <= r * r;
  },
});
// Cup body: square top, rounded bottom corners (radius 28).
const inBody = (x, y) => {
  if (x < 128 || x > 262 || y < 318 || y > 490) return false;
  if (y <= 462) return true;
  const cx = x < 156 ? 156 : x > 234 ? 234 : x;
  return (x - cx) ** 2 + (y - 462) ** 2 <= 28 * 28;
};
const body = {
  svg: (fill) => `<path d="M128 318 H262 V462 A28 28 0 0 1 234 490 H156 A28 28 0 0 1 128 462Z" fill="${fill}"/>`,
  hit: inBody,
};
// Coffee fills the body from just under the rim.
const coffee = {
  svg: (fill) => `<path d="M128 336 H262 V462 A28 28 0 0 1 234 490 H156 A28 28 0 0 1 128 462Z" fill="${fill}"/>`,
  hit: (x, y) => y >= 336 && inBody(x, y),
};
// Handle: a squared C on the right of the body.
const handle = {
  svg: (fill) => `<path d="M258 350 H304 V436 H258 V414 H282 V372 H258Z" fill="${fill}"/>`,
  hit: (x, y) => x >= 258 && x <= 304 && y >= 350 && y <= 436 && !(x < 282 && y > 372 && y < 414),
};
const saucer = pill(96, 488, 198, 18, 9);
const rim = pill(120, 308, 150, 18, 9);
const disc = circle(195, 400, 150);

const offset = (shape, dx, dy) => ({
  svg: (fill) => `<g transform="translate(${dx} ${dy})">${shape.svg(fill)}</g>`,
  hit: (x, y) => shape.hit(x - dx, y - dy),
});

// Painter's order, back to front.
const LAYERS = [
  [offset(disc, 10, 10), C.shadow],
  [disc, C.mustard],
  ...[saucer, handle, body, rim].map((s) => [offset(s, 8, 8), C.shadow]),
  [saucer, C.cobalt],
  [handle, C.tomato],
  [body, C.cream],
  [coffee, C.coffee],
  [rim, C.cobalt],
];

// Square crops centred on the art. The maskable crop keeps the disc and its
// shadow inside the 80% safe circle.
const CX = 200;
const CY = 405;
const crop = (side) => ({ x: CX - side / 2, y: CY - side / 2, side });
const FULL = crop(390);
const MASKABLE = crop(440);

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function render(size, { x: ox, y: oy, side }) {
  const scale = side / size;
  const N = 4; // 4x4 supersampling for smooth edges
  const bg = rgb(C.paper);
  const layers = LAYERS.map(([shape, hex]) => [shape, rgb(hex)]);
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let py = 0; py < size; py++) {
    const row = py * (size * 3 + 1);
    raw[row] = 0; // filter: none
    for (let px = 0; px < size; px++) {
      const sum = [0, 0, 0];
      for (let sy = 0; sy < N; sy++)
        for (let sx = 0; sx < N; sx++) {
          const x = ox + (px + (sx + 0.5) / N) * scale;
          const y = oy + (py + (sy + 0.5) / N) * scale;
          let col = bg;
          for (const [shape, c] of layers) if (shape.hit(x, y)) col = c;
          for (let c = 0; c < 3; c++) sum[c] += col[c];
        }
      for (let c = 0; c < 3; c++) raw[row + 1 + px * 3 + c] = Math.round(sum[c] / (N * N));
    }
  }
  return encodePng(size, raw);
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
function encodePng(size, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function svg({ x, y, side }) {
  const art = LAYERS.map(([shape, hex]) => shape.svg(hex)).join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${side} ${side}">` +
    `<rect x="${x}" y="${y}" width="${side}" height="${side}" rx="${Math.round(side * 0.22)}" fill="${C.paper}"/>` +
    `${art}</svg>\n`
  );
}

const write = (name, data) => {
  const out = fileURLToPath(new URL(`../public/${name}`, import.meta.url));
  writeFileSync(out, data);
  console.log(`wrote ${out} (${data.length} bytes)`);
};

write("apple-touch-icon.png", render(180, FULL));
write("pwa-192.png", render(192, FULL));
write("pwa-512.png", render(512, FULL));
write("pwa-maskable-512.png", render(512, MASKABLE));
write("favicon.svg", svg(FULL));
