#!/usr/bin/env node
/**
 * Inkwell AI 预处理脚本
 * 
 * 功能：
 * - 扫描博文源文件
 * - 调用 AI 生成摘要（ai_summary）和 SEO 描述（description）
 * - 写回 frontmatter
 * 
 * 使用：
 *   node scripts/ai-preprocess.mjs              # 只处理没有摘要的博文（默认）
 *   node scripts/ai-preprocess.mjs --force      # 强制重新生成所有博文
 *   node scripts/ai-preprocess.mjs --dry-run    # 只预览，不写入
 * 
 * 配置：
 *   config.yml 中的 ai 部分配置 provider 和参数
 *   .env 中配置 API Key
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { createProvider } from './ai/providers/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.resolve(__dirname, '../.env');
const CONFIG_PATH = path.resolve(__dirname, '../config.yml');

// ── CLI 参数解析 ──────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');  // 强制重新生成（即使已有摘要）

// ── 从 config.yml 读取 postsDir ──────────────────────────────────
function resolvePostsDir() {
  try {
    const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    const raw = config?.content?.postsDir;
    if (typeof raw === 'string' && raw.trim()) return path.resolve(__dirname, '..', raw.trim());
  } catch {/* fallback */}
  return path.resolve(__dirname, '../src/content/posts');
}
const POSTS_DIR = resolvePostsDir();

// ── 加载 .env 文件 ──────────────────────────────────
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

// ── 加载配置 ──────────────────────────────────
function loadConfig() {
  const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  if (!config || typeof config !== 'object' || !config.ai) {
    throw new Error('Invalid config.yml: missing ai section.');
  }
  
  // 兼容旧版配置（ai-abstract）
  if (!config.ai && config['ai-abstract']) {
    config.ai = {
      enabled: config['ai-abstract'].enabled,
      provider: 'gemini',
      providers: {
        gemini: {
          apiKey: '${GEMINI_API_KEY}',
          model: config['ai-abstract'].model,
          endpoint: config['ai-abstract'].apiEndpoint,
        },
      },
      summary: { prompt: config['ai-abstract'].prompt },
    };
  }
  
  return config;
}

// ── 解析环境变量占位符 ──────────────────────────────────
function resolveEnvVar(value) {
  if (typeof value !== 'string') return value;
  
  // 匹配 ${VAR_NAME} 格式
  const match = value.match(/^\$\{(.+)\}$/);
  if (match) {
    const envValue = process.env[match[1]];
    if (!envValue) {
      throw new Error(`Environment variable ${match[1]} is not set. Please add it to .env`);
    }
    return envValue;
  }
  
  return value;
}

// ── 收集 Markdown 文件 ──────────────────────────────────
function collectMarkdownFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectMarkdownFiles(fullPath);
    return /\.mdx?$/i.test(entry.name) ? [fullPath] : [];
  });
}

// ── 分离 frontmatter ──────────────────────────────────
function splitFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  return { frontmatter: match[1], body: match[2] };
}

// ── 主流程 ──────────────────────────────────
async function run() {
  console.log('🤖 Inkwell AI Preprocessor\n');
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No files will be modified\n');
  }
  
  const config = loadConfig();
  const { enabled, provider, providers, summary, description } = config.ai;

  if (!enabled) {
    console.log('AI preprocessing is disabled in config.yml.');
    return;
  }

  loadEnvFile(ENV_PATH);

  // 只解析当前 provider 的 API Key
  const currentProviderConfig = providers?.[provider];
  if (!currentProviderConfig) {
    throw new Error(`Provider "${provider}" not found in config.ai.providers`);
  }
  
  if (currentProviderConfig.apiKey) {
    currentProviderConfig.apiKey = resolveEnvVar(currentProviderConfig.apiKey);
  }

  // 创建 provider
  const aiProvider = createProvider(config.ai);
  console.log(`📡 Using provider: ${provider} (${providers[provider].model})\n`);

  const files = collectMarkdownFiles(POSTS_DIR);
  console.log(`📂 Scanning ${files.length} posts in:\n   ${POSTS_DIR}\n`);

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parts = splitFrontmatter(content);
    if (!parts) {
      skipped++;
      continue;
    }

    const frontmatter = yaml.load(parts.frontmatter) ?? {};
    const title = typeof frontmatter.title === 'string' ? frontmatter.title : path.basename(filePath);

    // 默认跳过已有摘要的博文（节省 token），--force 强制重新生成
    if (!FORCE && Array.isArray(frontmatter.ai_summary) && frontmatter.ai_summary.length > 0) {
      console.log(`⏭️  Skipping "${title}" (already has summary)`);
      skipped++;
      continue;
    }

    try {
      console.log(`📝 Processing "${title}"...`);
      
      // 生成摘要
      const summaryPoints = await aiProvider.generateSummary({
        title,
        content: parts.body,
        prompt: summary?.prompt,
      });
      
      console.log(`   Summary: ${JSON.stringify(summaryPoints)}`);
      
      // 生成 SEO 描述
      let seoDescription = frontmatter.description;
      if (description?.autoGenerate !== false) {
        seoDescription = await aiProvider.generateDescription(summaryPoints);
        console.log(`   SEO: ${seoDescription.slice(0, 60)}${seoDescription.length > 60 ? '...' : ''}`);
      }
      
      // 更新 frontmatter
      frontmatter.ai_summary = summaryPoints;
      if (seoDescription && seoDescription !== frontmatter.description) {
        frontmatter.description = seoDescription;
      }

      if (!DRY_RUN) {
        const nextContent = `---\n${yaml.dump(frontmatter, { indent: 2, lineWidth: -1 })}---\n${parts.body}`;
        fs.writeFileSync(filePath, nextContent);
        console.log(`   ✅ Updated\n`);
      } else {
        console.log(`   👁️  Preview only (dry run)\n`);
      }
      
      processed++;
    } catch (error) {
      console.error(`   ❌ Failed: ${error instanceof Error ? error.message : String(error)}\n`);
      failed++;
    }
  }

  console.log('─'.repeat(50));
  console.log(`✨ Finished: ${processed} processed, ${skipped} skipped, ${failed} failed`);
  
  if (DRY_RUN) {
    console.log('\n⚠️  This was a dry run. Run without --dry-run to apply changes.');
  }
}

run().catch(console.error);
