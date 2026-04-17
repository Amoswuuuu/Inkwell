#!/usr/bin/env node
/**
 * inkwell CLI — Hexo-style commands for the Inkwell blog theme
 *
 * Usage (after npm link or via package.json scripts):
 *   inkwell generate   Build site + run Pagefind indexing
 *   inkwell build      Alias for generate
 *   inkwell server     Start dev server (hot-reload, no search)
 *   inkwell preview    Serve the built dist/ with a static HTTP server (search works)
 *   inkwell clean      Remove dist/ and .astro/ cache
 *   inkwell deploy     generate + deploy to GitHub Pages via gh-pages
 *   inkwell ai         Run AI abstract pre-processing script
 */

import { execFileSync, spawn } from 'child_process';
import { existsSync, readFileSync, rmSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const cmd = process.argv[2];

// Resolve pagefind binary: prefer the platform-specific exe via @pagefind/* package,
// fall back to the .bin shim (works on Linux/macOS).
function resolvePagefind() {
  const isWin = process.platform === 'win32';

  // Try @pagefind/windows-x64 or @pagefind/linux-x64 etc.
  const cpu = process.env.npm_config_arch || process.arch;
  const platform = isWin ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux';
  const candidates = [
    join(ROOT, 'node_modules', `@pagefind/${platform}-${cpu}`, 'bin', isWin ? 'pagefind_extended.exe' : 'pagefind_extended'),
    join(ROOT, 'node_modules', `@pagefind/${platform}-${cpu}`, 'bin', isWin ? 'pagefind.exe' : 'pagefind'),
    join(ROOT, 'node_modules', '.bin', isWin ? 'pagefind.cmd' : 'pagefind'),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  // Last resort: npx pagefind
  return { useNpx: true };
}

const COLORS = {
  reset: '\x1b[0m',
  cyan:  '\x1b[36m',
  green: '\x1b[32m',
  yellow:'\x1b[33m',
  red:   '\x1b[31m',
  bold:  '\x1b[1m',
};

function log(msg, color = COLORS.cyan) {
  console.log(`${color}${COLORS.bold}[inkwell]${COLORS.reset} ${msg}`);
}

// Always use the same Node binary that launched this script (ensures Node 24 is used)
const NODE = process.execPath;

function run(file, args, opts = {}) {
  // Safe command execution using array args (no shell injection)
  log(`$ ${file}${args ? ' ' + args.join(' ') : ''}`, COLORS.yellow);
  execFileSync(file, args, { cwd: ROOT, stdio: 'inherit', ...opts });
}

function spawnInteractive(command, args, opts = {}) {
  // If command is "node", use the explicit binary
  const bin = command === 'node' ? NODE : command;
  // On Windows, .cmd shims (npx, serve, etc.) require shell:true to be found
  const useShell = process.platform === 'win32' && bin !== NODE;
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd: ROOT, stdio: 'inherit', shell: useShell, ...opts });
    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Process exited with code ${code}`));
    });
  });
}

const COMMANDS = {
  async generate() {
    // Read config.yml for postsDir and ai.enabled
    const configPath = join(ROOT, 'config.yml');
    let postsDir = './src/content/posts';
    let aiEnabled = false;
    try {
      const raw = yaml.load(readFileSync(configPath, 'utf-8'));
      if (raw?.content?.postsDir) {
        postsDir = raw.content.postsDir;
      }
      aiEnabled = raw?.ai?.enabled === true;
    } catch (e) {
      log(`Warning: Could not read config.yml: ${e.message}`, COLORS.yellow);
    }

    const args = process.argv.slice(3);
    const autoFix = args.includes('--fix');

    // Run Markdown Linter first
    log('Running Markdown check…', COLORS.cyan);
    try {
      const lintArgs = ['scripts/lint-md.mjs'];
      if (autoFix) lintArgs.push('--fix');
      run(NODE, lintArgs);
    } catch (e) {
      log(`Markdown check complete with exits: ${e.message}`, COLORS.yellow);
    }

    // Run AI preprocessing first if enabled
    if (aiEnabled) {
      log('Running AI preprocessing…', COLORS.cyan);
      try {
        run(NODE, ['scripts/ai-preprocess.mjs']);
      } catch (e) {
        log(`AI preprocessing failed: ${e.message}`, COLORS.yellow);
        log('Continuing with build…', COLORS.yellow);
      }
    }

    log('Building site…');
    log(`Posts source: ${postsDir}`, COLORS.cyan);

    // Inject INKWELL_POSTS_DIR env var so content.config.ts can read it
    const buildEnv = { ...process.env, INKWELL_POSTS_DIR: postsDir };

    // Run astro build with env var via spawn
    await spawnInteractive('npx', ['astro', 'build'], { env: buildEnv });
    log('Indexing with Pagefind…');
    const pagefind = resolvePagefind();
    if (pagefind && pagefind.useNpx) {
      await spawnInteractive('npx', ['pagefind', '--site', 'dist']);
    } else {
      run(pagefind, ['--site', 'dist']);
    }

    // Trigger webhooks after successful build
    try {
      const raw = yaml.load(readFileSync(configPath, 'utf-8'));
      if (raw?.webhook?.enabled) {
        log('Triggering webhooks…', COLORS.cyan);
        run(NODE, ['scripts/webhook-trigger.mjs', 'deploy']);
      }
    } catch (e) { /* ignore webhook errors */ }

    log('Done! Output → dist/', COLORS.green);
  },

  async build() {
    return COMMANDS.generate();
  },

  async server() {
    log('Starting dev server (search unavailable in dev mode)…');
    await spawnInteractive(NODE, ['node_modules/astro/dist/cli/index.js', 'dev']);
  },

  async preview() {
    const distPath = resolve(ROOT, 'dist');
    if (!existsSync(distPath)) {
      log('dist/ not found. Run `inkwell generate` first.', COLORS.red);
      process.exit(1);
    }
    log('Serving dist/ at http://localhost:4321 (search is available)…', COLORS.green);
    // Use serve (npx serve) for reliable static file serving including /pagefind/
    await spawnInteractive('npx', ['serve', 'dist', '--listen', '4321', '--no-clipboard']);
  },

  async clean() {
    const targets = ['dist', '.astro'];
    for (const t of targets) {
      const p = resolve(ROOT, t);
      if (existsSync(p)) {
        rmSync(p, { recursive: true, force: true });
        log(`Removed ${t}/`, COLORS.yellow);
      }
    }
    log('Clean done.', COLORS.green);
  },

  async deploy() {
    log('Building before deploy…');
    await COMMANDS.generate();
    log('Deploying to GitHub Pages…');
    // Push dist/ to gh-pages branch using git
    try {
      const distPath = resolve(ROOT, 'dist');
      // Use gh-pages package or direct git subtree push
      run('npx', ['gh-pages', '-d', 'dist', '-m', 'deploy: site update']);
    } catch (e) {
      log(`Deploy failed: ${e.message}`, COLORS.red);
      log('Hint: Make sure gh-pages is available or use GitHub Actions for deployment.', COLORS.yellow);
      process.exit(1);
    }
    log('Deploy complete!', COLORS.green);
  },

  async ai() {
    log('Running AI abstract pre-processing…');
    run(NODE, ['scripts/ai-preprocess.mjs']);
    log('AI processing complete.', COLORS.green);
  },

  async lint() {
    const args = process.argv.slice(3);
    const lintArgs = ['scripts/lint-md.mjs'];
    if (args.includes('--fix')) lintArgs.push('--fix');
    run(NODE, lintArgs);
  },

  async export() {
    try {
    // Export posts metadata as JSON (useful for AI agents and external tools)
    const configPath = join(ROOT, 'config.yml');
    let postsDir = './src/content/posts';
    try {
      const raw = yaml.load(readFileSync(configPath, 'utf-8'));
      if (raw?.content?.postsDir) postsDir = raw.content.postsDir;
    } catch (e) { /* use default */ }

    log(`Exporting posts metadata from ${postsDir}…`, COLORS.cyan);

    // Read posts directly from the source directory
    const postsPath = resolve(ROOT, postsDir);
    if (!existsSync(postsPath)) {
      log(`Posts directory not found: ${postsPath}`, COLORS.red);
      process.exit(1);
    }

    // Get all markdown files recursively
    function getMdFiles(dir, base = '') {
      const entries = readdirSync(dir, { withFileTypes: true });
      const files = [];
      for (const entry of entries) {
        const full = join(dir, entry.name);
        const rel = base ? `${base}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('_')) files.push(...getMdFiles(full, rel));
        } else if (entry.name.endsWith('.md') && !entry.name.startsWith('_')) {
          files.push(rel);
        }
      }
      return files;
    }
    const files = getMdFiles(postsPath);
    const pathParse = (await import('path')).default.parse;

    // Simple front-matter parser (YAML between --- markers)
    function parseFrontMatter(raw) {
      const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
      if (!match) return { attributes: {}, body: raw };
      const yamlStr = match[1];
      const body = match[2];
      // Simple YAML parsing for known fields
      const attrs = {};
      const lines = yamlStr.split('\n');
      let currentKey = null;
      let inList = false;
      for (const line of lines) {
        const keyMatch = line.match(/^(\w+):/);
        if (keyMatch) {
          currentKey = keyMatch[1];
          const val = line.slice(currentKey.length + 1).trim();
          if (val) {
            if (val.startsWith('[') || val === 'true' || val === 'false') {
              try { attrs[currentKey] = JSON.parse(val.replace(/'/g, '"')); } catch { attrs[currentKey] = val; }
            } else {
              attrs[currentKey] = val.replace(/^['"]|['"]$/g, '');
            }
          } else {
            attrs[currentKey] = null;
          }
          inList = false;
        } else if (line.match(/^\s+-\s+/)) {
          if (!attrs[currentKey]) attrs[currentKey] = [];
          if (Array.isArray(attrs[currentKey])) {
            const item = line.replace(/^\s+-\s+/, '').trim().replace(/^['"]|['"]$/g, '');
            attrs[currentKey].push(item);
          }
          inList = true;
        }
      }
      return { attributes: attrs, body };
    }

    const posts = files.map(file => {
      const fullPath = join(postsPath, file);
      const raw = readFileSync(fullPath, 'utf-8');
      const parsed = parseFrontMatter(raw);
      const { base } = pathParse(file);
      const id = base.replace(/\.md$/, '');
      const dateMatch = parsed.attributes?.date instanceof Date
        ? parsed.attributes.date
        : new Date(parsed.attributes?.date || Date.now());
      const tags = parsed.attributes?.tags
        ? (Array.isArray(parsed.attributes.tags) ? parsed.attributes.tags
          : (typeof parsed.attributes.tags === 'string' ? parsed.attributes.tags.split(',').map(s => s.trim()) : [String(parsed.attributes.tags)]))
        : [];
      const categories = parsed.attributes?.categories
        ? (Array.isArray(parsed.attributes.categories) ? parsed.attributes.categories : [parsed.attributes.categories])
        : [];

      return {
        id,
        title: parsed.attributes?.title || id,
        slug: parsed.attributes?.abbrlink || id,
        date: dateMatch.toISOString(),
        updated: parsed.attributes?.updated instanceof Date
          ? parsed.attributes.updated.toISOString()
          : (parsed.attributes?.updated ? new Date(parsed.attributes.updated).toISOString() : null),
        description: parsed.attributes?.description || '',
        categories,
        tags,
        cover: parsed.attributes?.cover || null,
        draft: parsed.attributes?.draft || false,
        license: parsed.attributes?.license || null,
        ai_summary: parsed.attributes?.ai_summary || [],
        reading_time: Math.max(1, Math.round(parsed.body.length / 400)),
        file_path: file,
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const format = process.argv[3];
    if (format === '--csv' || format === '-c') {
      // CSV export
      const header = 'id,title,slug,date,updated,description,categories,tags,cover,draft,license,reading_time';
      const rows = posts.map(p => [
        p.id, `"${p.title.replace(/"/g, '""')}"`, p.slug, p.date, p.updated || '',
        `"${(p.description || '').replace(/"/g, '""')}"`,
        `"${p.categories.join(';')}"`, `"${p.tags.join(';')}"`,
        p.cover || '', p.draft, p.license || '', p.reading_time,
      ].join(','));
      console.log([header, ...rows].join('\n'));
    } else {
      // Default JSON export
      console.log(JSON.stringify({ version: '1.0', total: posts.length, posts }, null, 2));
    }
    log(`Exported ${posts.length} posts.`, COLORS.green);
    } catch (err) {
      console.error('Export error:', err);
    }
  },

  async status() {
    // Quick status check
    const distPath = resolve(ROOT, 'dist');
    const configPath = join(ROOT, 'config.yml');
    const distExists = existsSync(distPath);
    let postsDir = './src/content/posts';
    let postCount = 0;
    try {
      const raw = yaml.load(readFileSync(configPath, 'utf-8'));
      if (raw?.content?.postsDir) postsDir = raw.content.postsDir;
      const postsPath = resolve(ROOT, postsDir);
      if (existsSync(postsPath)) {
        const getFiles = (dir) => {
          const entries = readdirSync(dir, { withFileTypes: true });
          let count = 0;
          for (const entry of entries) {
            if (entry.name.startsWith('_')) continue;
            if (entry.isDirectory()) count += getFiles(join(dir, entry.name));
            else if (entry.name.endsWith('.md')) count++;
          }
          return count;
        };
        postCount = getFiles(postsPath);
      }
    } catch (e) { /* ignore */ }

    console.log(`
${COLORS.bold}${COLORS.cyan}Inkwell Status${COLORS.reset}

  ${COLORS.green}dist/${COLORS.reset}  ${distExists ? COLORS.green + '✓ exists' + COLORS.reset : COLORS.red + '✗ missing' + COLORS.reset}
  Posts   ${postCount} files in ${postsDir}
`);
  },
};

const aliases = { g: 'generate', b: 'build', s: 'server', p: 'preview', c: 'clean', d: 'deploy', a: 'ai', e: 'export', st: 'status', l: 'lint' };
const resolved = aliases[cmd] ?? cmd;

if (!resolved || !COMMANDS[resolved]) {
  console.log(`
${COLORS.bold}${COLORS.cyan}Inkwell CLI${COLORS.reset}  A refined blog theme for writers

${COLORS.bold}Usage:${COLORS.reset}
  inkwell <command> [options]

${COLORS.bold}Commands:${COLORS.reset}
  ${COLORS.green}generate/g${COLORS.reset}  Build site + Pagefind index
  ${COLORS.green}build/b${COLORS.reset}    Alias for generate
  ${COLORS.green}server/s${COLORS.reset}    Start dev server (hot-reload)
  ${COLORS.green}preview/p${COLORS.reset}   Serve dist/ with search support
  ${COLORS.green}clean/c${COLORS.reset}     Remove dist/ and .astro/ cache
  ${COLORS.green}deploy/d${COLORS.reset}    Generate + deploy to GitHub Pages
  ${COLORS.green}ai/a${COLORS.reset}        Run AI abstract pre-processing
  ${COLORS.green}lint/l${COLORS.reset}      Scan markdown formatting (add --fix to auto-resolve)
  ${COLORS.green}export/e${COLORS.reset}    Export posts metadata (JSON or CSV)
  ${COLORS.green}status/st${COLORS.reset}   Show blog status

${COLORS.bold}Examples:${COLORS.reset}
  inkwell g           ${COLORS.yellow}# Build the site${COLORS.reset}
  inkwell s           ${COLORS.yellow}# Start dev server${COLORS.reset}
  inkwell c && inkwell g  ${COLORS.yellow}# Clean + build${COLORS.reset}
  inkwell g --fix     ${COLORS.yellow}# Auto-fix markdown then build${COLORS.reset}
  inkwell lint        ${COLORS.yellow}# Scan formatting issues without fixing${COLORS.reset}
  inkwell e           ${COLORS.yellow}# Export posts as JSON${COLORS.reset}
  inkwell e --csv     ${COLORS.yellow}# Export posts as CSV${COLORS.reset}
`);
  process.exit(0);
}

COMMANDS[resolved]().catch(err => {
  console.error(`${COLORS.red}Error:${COLORS.reset}`, err.message);
  process.exit(1);
});
