/**
 * Generates PWA / favicon / Capacitor icons from public/icon-source.png
 * Run: npm run icons
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(root, 'public', 'icon-source.png');
const assetsDir = join(root, 'assets');

const outputs = [
  { size: 16, file: 'favicon-16.png', dir: 'public' },
  { size: 32, file: 'favicon-32.png', dir: 'public' },
  { size: 180, file: 'apple-touch-icon.png', dir: 'public' },
  { size: 192, file: 'pwa-192.png', dir: 'public' },
  { size: 512, file: 'pwa-512.png', dir: 'public' },
  { size: 1024, file: 'icon.png', dir: 'assets' },
];

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.warn('Install sharp: npm install sharp --save-dev');
    process.exit(1);
  }

  if (!existsSync(sourcePath)) {
    console.error('Missing public/icon-source.png');
    process.exit(1);
  }

  for (const { size, file, dir } of outputs) {
    const outDir = dir === 'assets' ? assetsDir : join(root, 'public');
    const outPath = join(outDir, file);
    await sharp(sourcePath)
      .resize(size, size, { fit: 'cover', position: 'centre' })
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    console.log('wrote', outPath.replace(root + '/', ''));
  }

  const splashPath = join(assetsDir, 'splash.png');
  const splashW = 1284;
  const splashH = 2778;
  const iconOnSplash = Math.round(splashW * 0.45);
  const iconBuf = await sharp(sourcePath)
    .resize(iconOnSplash, iconOnSplash, { fit: 'cover' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: splashW,
      height: splashH,
      channels: 3,
      background: { r: 91, g: 33, b: 182 },
    },
  })
    .composite([{ input: iconBuf, gravity: 'centre' }])
    .png()
    .toFile(splashPath);
  console.log('wrote assets/splash.png');
}

main();
