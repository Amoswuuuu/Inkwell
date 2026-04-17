import { fileURLToPath, pathToFileURL } from 'url';
import { resolve, dirname } from 'path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(ROOT);

const { build } = await import(pathToFileURL(resolve(ROOT, 'node_modules/astro/dist/index.js')).href);

console.log('[inkwell] Starting Astro build…');
try {
  // Pass root as a native Windows path (string); Astro's resolveRoot handles it
  await build({ root: ROOT });
  console.log('[inkwell] Astro build complete.');
} catch (e) {
  console.error('[inkwell] Build failed:', e.message ?? e);
  process.exit(1);
}
