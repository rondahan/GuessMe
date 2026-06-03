/**
 * Single source of truth: package.json "version".
 * Writes version.json and syncs native iOS/Android when platforms exist.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

function gitShortSha() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return 'local';
  }
}

function buildNumber() {
  const envBuild = process.env.VITE_APP_BUILD?.trim();
  if (envBuild) return envBuild;
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.${pad(now.getHours())}${pad(now.getMinutes())}`;
}

const versionInfo = {
  name: pkg.name,
  version: pkg.version,
  build: buildNumber(),
  git: gitShortSha(),
  updatedAt: new Date().toISOString(),
};

writeFileSync(join(root, 'version.json'), JSON.stringify(versionInfo, null, 2) + '\n');

const iosPlist = join(root, 'ios', 'App', 'App', 'Info.plist');
if (existsSync(iosPlist)) {
  let plist = readFileSync(iosPlist, 'utf8');
  plist = plist.replace(
    /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/,
    `$1${versionInfo.version}$2`,
  );
  plist = plist.replace(
    /(<key>CFBundleVersion<\/key>\s*<string>)[^<]*(<\/string>)/,
    `$1${versionInfo.build}$2`,
  );
  writeFileSync(iosPlist, plist);
  console.log('synced iOS Info.plist');
}

console.log(`version ${versionInfo.version} · build ${versionInfo.build} · git ${versionInfo.git}`);
