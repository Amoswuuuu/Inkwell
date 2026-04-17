import fs from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const COLORS = {
  reset: '\x1b[0m',
  cyan:  '\x1b[36m',
  green: '\x1b[32m',
  yellow:'\x1b[33m',
  red:   '\x1b[31m',
  bold:  '\x1b[1m',
};

function log(msg, color = COLORS.cyan) {
  console.log(`${color}${COLORS.bold}[inkwell-lint]${COLORS.reset} ${msg}`);
}

const args = process.argv.slice(2);
const autoFix = args.includes('--fix');

const configPath = join(ROOT, 'config.yml');
let postsDir = './src/content/posts';
try {
  const raw = yaml.load(fs.readFileSync(configPath, 'utf-8'));
  if (raw?.content?.postsDir) postsDir = raw.content.postsDir;
} catch (e) {
  log(`Warning: Could not read config.yml: ${e.message}`, COLORS.yellow);
}

const postsPath = resolve(ROOT, postsDir);

if (!fs.existsSync(postsPath)) {
  log(`Posts directory not found: ${postsPath}`, COLORS.red);
  process.exit(1);
}

function getMdFiles(dir, base = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('_')) {
        files.push(...getMdFiles(full, rel));
      }
    } else if (entry.name.endsWith('.md') && !entry.name.startsWith('_')) {
      files.push(full);
    }
  }
  return files;
}

const mdFiles = getMdFiles(postsPath);
log(`Scanning ${mdFiles.length} Markdown files for anomalies...`);

let issuesFound = 0;
let filesFixed = 0;

for (const filePath of mdFiles) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  const issues = [];
  
  // 1. Detect BOM (\uFEFF)
  if (content.charCodeAt(0) === 0xFEFF) {
    issues.push(`Found invisible BOM marker at the very beginning of the document`);
    if (autoFix) {
      content = content.slice(1);
    }
  }

  // Look line by line for other anomalies
  const lines = content.split('\n');
  const fixedLines = [];
  let fileHasLineIssue = false;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Track code blocks so we don't accidentally mutate code snippets
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }

    // 2. Zero-Width Space \u200b and inside-line BOM tracking
    if (line.includes('\uFEFF') || line.includes('\u200b')) {
      issues.push(`Line ${i+1}: Found zero-width/invisible characters`);
      if (autoFix) {
        line = line.replace(/[\uFEFF\u200b]/g, '');
        fileHasLineIssue = true;
      }
    }

    // 3. Invalid Markdown Heading missing space (e.g., '###Heading')
    // Make sure we are not inside a code block!
    if (!inCodeBlock) {
      const badHeadingMatch = /^(#+)([^#\s].*)$/.exec(line);
      if (badHeadingMatch) {
        issues.push(`Line ${i+1}: Missing space after heading tag -> "${badHeadingMatch[1] + badHeadingMatch[2]}"`);
        if (autoFix) {
          line = `${badHeadingMatch[1]} ${badHeadingMatch[2]}`;
          fileHasLineIssue = true;
        }
      }
    }
    
    fixedLines.push(line);
  }

  if (issues.length > 0) {
    console.log(`\n📄 ${COLORS.yellow}${filePath.replace(ROOT, '.')}${COLORS.reset}`);
    issues.forEach(msg => console.log(`  - ${COLORS.red}${msg}${COLORS.reset}`));
    issuesFound += issues.length;

    if (autoFix) {
      // Re-stitch content if we did line edits
      if (fileHasLineIssue) {
        content = fixedLines.join('\n');
      }
      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`  ✨ ${COLORS.green}Fixed automatically.${COLORS.reset}`);
        filesFixed++;
      }
    }
  }
}

if (issuesFound === 0) {
  log(`All markdown files are clean!`, COLORS.green);
} else {
  console.log(`\n${COLORS.bold}Summary:${COLORS.reset} Found ${issuesFound} issues.`);
  if (autoFix) {
    log(`Fixed ${filesFixed} files.`, COLORS.green);
  } else {
    log(`Run "inkwell lint --fix" to resolve automatically.`, COLORS.yellow);
  }
}
