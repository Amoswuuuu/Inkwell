import yaml from '../node_modules/js-yaml/index.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
try {
  const raw = readFileSync(resolve(ROOT, 'config.yml'), 'utf8');
  const config = yaml.load(raw);
  console.log('YAML parse OK');
  console.log('background:', JSON.stringify(config.background));
  console.log('post:', JSON.stringify(config.post));
  console.log('siteInfo:', JSON.stringify(config.siteInfo));
  console.log('footer keys:', config.footer ? Object.keys(config.footer) : 'missing');
  console.log('ai-abstract enabled:', config.ai?.enabled);
} catch(e) {
  console.error('ERROR:', e.message);
}
