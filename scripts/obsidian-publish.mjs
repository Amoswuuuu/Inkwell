import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Configuration ────────────────────────────────────────────────────
// Read postsDir from config.yml
function resolvePostsDir() {
  try {
    const config = yaml.load(fs.readFileSync(path.resolve(__dirname, '../config.yml'), 'utf-8'));
    const raw = config?.content?.postsDir;
    if (typeof raw === 'string' && raw.trim()) return path.resolve(__dirname, '..', raw.trim());
  } catch {/* fallback */}
  return path.resolve(__dirname, '../src/content/posts');
}
const POSTS_DIR = resolvePostsDir();

// ── Security helpers ─────────────────────────────────────────────────
// Strict path traversal check: file must be inside POSTS_DIR
function isPathInside(filePath, parentDir) {
  const normalizedFile = path.normalize(path.resolve(filePath));
  const normalizedParent = path.normalize(path.resolve(parentDir)) + path.sep;
  return normalizedFile.startsWith(normalizedParent);
}

async function publish() {
  const filePathArg = process.argv[2];
  if (!filePathArg) {
    console.error('❌  Usage: node scripts/obsidian-publish.mjs <absolute_path_to_md_file>');
    process.exit(1);
  }

  const absolutePath = path.resolve(filePathArg);
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌  File not found: ${absolutePath}`);
    process.exit(1);
  }

  // Ensure file is inside the posts directory (strict path validation)
  if (!isPathInside(absolutePath, POSTS_DIR)) {
    console.error(`❌  Security error: File is outside posts directory ${POSTS_DIR}`);
    process.exit(1);
  }

  console.log(`🚀  Preparing to publish: ${path.basename(absolutePath)}`);

  const content = fs.readFileSync(absolutePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);

  if (!match) {
    console.error('❌  Error: File lacks valid YAML front-matter.');
    process.exit(1);
  }

  let frontmatter = yaml.load(match[1]);
  const body = match[2];

  // 1. Update front-matter
  frontmatter.published = true;
  frontmatter.draft = false;
  
  // Set publish date if not present
  if (!frontmatter.date) {
    frontmatter.date = new Date().toISOString();
    console.log(`📅  Set publish date to ${frontmatter.date}`);
  }
  
  // Set update date
  frontmatter.updated = new Date().toISOString();

  // 2. Write back
  const newContent = `---\n${yaml.dump(frontmatter, { indent: 2, lineWidth: -1 })}\n---\n${body}`;
  fs.writeFileSync(absolutePath, newContent);
  console.log('✅  Front-matter updated (published: true).');

  // 3. Git Sync
  try {
    const fileName = path.basename(absolutePath);
    console.log('📦  Syncing with GitHub...');

    // Add only this specific file to avoid committing unintended changes (safe: array args, no shell injection)
    execFileSync('git', ['add', absolutePath]);
    const commitMsg = `feat(publish): ${frontmatter.title || fileName}`.replace(/[\r\n]/g, ' ');
    execFileSync('git', ['commit', '-m', commitMsg]);
    execFileSync('git', ['push']);
    
    console.log('✨  Successfully pushed to GitHub! CI/CD will now handle AI preprocessing and deployment.');
  } catch (err) {
    console.error('❌  Git sync failed:', err.message);
    process.exit(1);
  }
}

publish();
