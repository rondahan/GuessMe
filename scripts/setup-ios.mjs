/**
 * Ensures iOS platform exists and CocoaPods is available before cap sync.
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iosDir = join(root, 'ios');

function run(cmd, args = []) {
  console.log('>', cmd, ...args);
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: false });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function hasPod() {
  try {
    execSync('which pod', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

if (!hasPod()) {
  console.error(`
CocoaPods is required for iOS.

Install (pick one):
  brew install cocoapods
  sudo gem install cocoapods

Then run again:
  npm run cap:ios
`);
  process.exit(1);
}

if (!existsSync(iosDir)) {
  console.log('Adding iOS platform…');
  run('npx', ['cap', 'add', 'ios']);
}
