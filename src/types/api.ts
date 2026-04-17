/**
 * Inkwell API Response Types
 *
 * Shared TypeScript interfaces for all machine-readable JSON endpoints.
 * Used in: /api/posts.json, /api/posts/[slug].json, /api/search.json
 */

export interface SiteInfo {
  name: string;
  url: string;
  description: string;
  author: string;
}

/** Lightweight post item used in list and search responses */
export interface PostListItem {
  slug: string;
  title: string;
  description: string;
  date: string;            // ISO 8601
  updated?: string;        // ISO 8601, present in list response
  categories: string[];
  tags?: string[];
  cover: string | null;
  readingTime: number;     // minutes
  aiSummary: string[];
  url: string;             // canonical page URL
  apiUrl?: string;         // per-article API URL (present in search response)
  matchType?: string;      // 'search' | 'category' | 'tag' | 'all'
}

/** GET /api/posts.json */
export interface PostListResponse {
  version: '1.0';
  site: SiteInfo;
  total: number;
  posts: PostListItem[];
}

/** GET /api/posts/[slug].json */
export interface PostDetailResponse {
  version: '1.0';
  schema: string;          // self-referencing URL
  slug: string;
  title: string;
  description: string;
  date: string;            // ISO 8601
  updated: string;         // ISO 8601
  categories: string[];
  tags: string[];
  cover: string | null;
  readingTime: number;
  wordCount: number;
  aiSummary: string[];
  license: string;
  url: string;
  body: string;            // Raw Markdown body for AI agents
}

/** GET /api/search.json */
export interface SearchResponse {
  version: '1.0';
  schema: string;
  q: string | null;
  category: string | null;
  tag: string | null;
  total: number;
  returned: number;
  limit: number;
  posts: PostListItem[];
}
