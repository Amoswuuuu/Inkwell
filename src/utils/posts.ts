/**
 * 文章数据处理工具函数
 *
 * 解决分类/标签解析逻辑在多文件重复的问题：
 * - normalizeCats() / normalizeTags() 统一处理数组/字符串/单个值的边界情况
 * - buildSidebarData() 从文章列表提取侧边栏所需的所有统计数据
 * - formatChars() 将字符数格式化为可读字符串（万为单位）
 */

import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/**
 * 统一分类数据为数组
 */
export function normalizeCats(categories: string | string[] | undefined): string[] {
  if (!categories) return [];
  return Array.isArray(categories) ? categories : [categories];
}

/**
 * 统一标签数据为数组（支持逗号分隔字符串）
 */
export function normalizeTags(tags: string | string[] | undefined): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(t => typeof t === 'string' ? t.trim() : String(t)).filter(Boolean);
  if (typeof tags === 'string') return tags.split(',').map(s => s.trim()).filter(Boolean);
  return [String(tags)];
}

export interface SidebarData {
  categories: { name: string; count: number }[];
  tags: { name: string; count: number }[];
  totalChars: number;
  lastPostDate: string | undefined;
}

/**
 * 从文章列表构建侧边栏统计数据
 */
export function buildSidebarData(posts: Post[]): SidebarData {
  const catMap = new Map<string, number>();
  for (const post of posts) {
    for (const c of normalizeCats(post.data.categories)) {
      catMap.set(c, (catMap.get(c) ?? 0) + 1);
    }
  }
  const categories = [...catMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const tagMap = new Map<string, number>();
  for (const post of posts) {
    for (const t of normalizeTags(post.data.tags)) {
      tagMap.set(t, (tagMap.get(t) ?? 0) + 1);
    }
  }
  const tags = [...tagMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const totalChars = posts.reduce((sum, p) => sum + (p.body ?? '').length, 0);
  const lastPostDate = posts.length > 0 ? posts[0].data.date.toISOString() : undefined;

  return { categories, tags, totalChars, lastPostDate };
}

/**
 * 将字符数格式化为可读字符串
 * 10000+ 显示为 "X.XX万"
 */
export function formatChars(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return String(n);
}
