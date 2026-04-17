import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs';
import yaml from 'js-yaml';
import { resolveConfigPath } from './utils/resolveConfig';

/**
 * 博文源文件目录配置
 *
 * 优先级（从高到低）：
 *   1. 环境变量 INKWELL_POSTS_DIR（由 inkwell.mjs 构建脚本注入）
 *   2. config.yml 的 content.postsDir
 *   3. 默认值 ./src/content/posts
 *
 * 支持相对路径和绝对路径，支持中文目录名。
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readPostsDirFromConfig(): string | null {
  try {
    const configPath = resolveConfigPath(__dirname);
    if (!configPath) return null;
    const raw = yaml.load(fs.readFileSync(configPath, 'utf-8'));
    const postsDir = raw?.content?.postsDir;
    if (typeof postsDir === 'string' && postsDir.trim()) return postsDir.trim();
  } catch {/* ignore */}
  return null;
}

const postsBaseRaw = process.env.INKWELL_POSTS_DIR || readPostsDirFromConfig() || './src/content/posts';

// Normalize path: if relative, resolve from project root; if absolute, use as-is
const postsBasePath = path.isAbsolute(postsBaseRaw) 
  ? postsBaseRaw 
  : path.resolve(__dirname, '..', postsBaseRaw);

// Convert to file:// URL for Astro glob loader
const postsBase = pathToFileURL(postsBasePath).href;

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: postsBase }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().nullish().transform(v => v ?? undefined),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    cover: z.string().nullish(),
    headimg: z.string().optional(), // Legacy Hexo field, fallback for cover
    // Array branch must come first; z.coerce.string() would coerce ["a","b"] → "a,b"
    categories: z.union([z.array(z.coerce.string()), z.coerce.string()]).optional(),
    tags: z.union([z.array(z.coerce.string()), z.coerce.string()]).optional(),
    description: z.string().optional(),
    ai_summary: z.array(z.string()).optional(),
    abbrlink: z.string().optional(), // Hexo permanent link
    draft: z.boolean().optional().default(false),
    published: z.boolean().optional().default(true),
    featured: z.coerce.boolean().optional().default(false), // Pinned to homepage featured section
    // license accepts a preset key string (e.g. "MIT", "CC-BY-NC-SA")
    // or a custom object for one-off overrides
    license: z.union([
      z.string(),
      z.object({
        name: z.string(),
        url: z.string().url(),
        notice: z.string().optional(),
      }),
    ]).optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    friendsData: z.string().optional(),
  }),
});

export const collections = { posts, pages };
