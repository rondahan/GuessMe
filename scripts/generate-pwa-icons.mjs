/**
 * Generates PNG icons from public/icon.svg for PWA and Capacitor.
 * Run: node scripts/generate-pwa-icons.mjs
 * Requires: npm install sharp --save-dev (one-time)
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = join(root, 'public', 'icon.svg');
const sizes = [192, 512, 180];

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.warn(
      'sharp not installed — skip PNG generation. Install: npm install sharp --save-dev\n' +
        'PWA will still use public/icon.svg where supported.',
    );
    process.exit(0);
  }

  if (!existsSync(svgPath)) {
    console.error('Missing public/icon.svg');
    process.exit(1);
  }

  const svg = readFileSync(svgPath);
  for (const size of sizes) {
    const name = size === 180 ? 'apple-touch-icon.png' : `pwa-${size}.png`;
    await sharp(svg).resize(size, size).png().toFile(join(root, 'public', name));
    console.log('wrote public/' + name);
  }
}

main();
