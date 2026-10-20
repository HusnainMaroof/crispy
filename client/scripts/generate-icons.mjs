/**
 * Builds the favicon, app icon, Apple touch icon and web app icons from the
 * Crispies logo: the white wordmark on a solid black square, so it stays
 * readable on light and dark browser tabs.
 * Run: node scripts/generate-icons.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// sharp ships with Next, so resolve it from there instead of adding a dependency.
const require = createRequire(import.meta.url);
const sharp = require(require.resolve("sharp", { paths: [dirname(require.resolve("next/package.json"))] }));

const BACKGROUND = "#000000";
// The source paths have no fill, so a root fill turns the black wordmark white.
// The red accent keeps its own class colour.
const logo = readFileSync(join(root, "public/images/blacksvglogo.svg"), "utf8")
  .replace("<svg ", '<svg fill="#ffffff" ');

/** A square icon with the logo centred. `padding` is the share of each side left empty. */
async function icon(size, padding) {
  const inner = Math.round(size * (1 - padding * 2));
  const mark = await sharp(Buffer.from(logo), { density: 600 })
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: BACKGROUND } })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toBuffer();
}

/** An .ico holding PNG images, which every current browser reads. */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + images.length * 16;
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

const app = join(root, "app");
const icons = join(root, "public/icons");
mkdirSync(icons, { recursive: true });

const favicon = await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await icon(size, 0.06) })));
writeFileSync(join(app, "favicon.ico"), ico(favicon));
writeFileSync(join(app, "icon.png"), await icon(512, 0.1));
writeFileSync(join(app, "apple-icon.png"), await icon(180, 0.12));
writeFileSync(join(icons, "icon-192.png"), await icon(192, 0.1));
writeFileSync(join(icons, "icon-512.png"), await icon(512, 0.1));
// Maskable icons get cropped to a circle or squircle, so the logo sits in the safe zone.
writeFileSync(join(icons, "maskable-512.png"), await icon(512, 0.2));

console.log("Icons written to app/ and public/icons/");
