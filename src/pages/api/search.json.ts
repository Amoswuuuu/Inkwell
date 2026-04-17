import { getCollection } from 'astro:content';
import { SITE } from '../../config';
import { normalizeCats, normalizeTags } from '../../utils/posts';

/**
 * Inkwell Search API
 * GET /api/search.json
 *
 * Query Parameters:
 *   q        (string)  — Full-text search (title, description, ai_summary, tags, categories)
 *   category (string)  — Filter by category (partial match, case-insensitive)
 *   tag      (string)  — Filter by tag (partial match, case-insensitive)
 *   limit    (number)  — Max results to return (default: 10, max: 50)
 *
 * Response Schema:
 *   { version, schema, q, category, tag, total, returned, posts[] }
 *   Each post: { slug, title, description, date, categories, tags, cover, readingTime, aiSummary, url, apiUrl, matchType }
 */
export async function GET({ url }) {
  const query = url.searchParams.get('q')?.toLowerCase() ?? '';
  const category = url.searchParams.get('category')?.toLowerCase() ?? null;
  const tag = url.searchParams.get('tag')?.toLowerCase() ?? null;
  const limit = Math.min(50, parseInt(url.searchParams.get('limit') ?? '10', 10));

  const allPosts = (await getCollection('posts'))
    .filter(p => !p.data.draft && p.data.published !== false)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const siteUrl = (SITE.url || '').replace(/\/$/, '');

  let results = allPosts;

  if (category) {
    results = results.filter(p => normalizeCats(p.data.categories).some(c => c.toLowerCase().includes(category)));
  }

  if (tag) {
    results = results.filter(p => normalizeTags(p.data.tags).some(t => t.toLowerCase().includes(tag)));
  }

  if (query) {
    results = results.filter(p => {
      const searchable = [
        p.data.title,
        p.data.description ?? '',
        p.data.ai_summary?.join(' ') ?? '',
        ...normalizeTags(p.data.tags),
        ...normalizeCats(p.data.categories),
      ].join(' ').toLowerCase();
      return searchable.includes(query);
    });
  }

  const posts = results.slice(0, limit).map(post => ({
    slug: post.data.abbrlink || post.id,
    title: post.data.title,
    description: post.data.description || '',
    date: post.data.date.toISOString(),
    categories: normalizeCats(post.data.categories),
    tags: normalizeTags(post.data.tags),
    cover: post.data.cover || null,
    readingTime: Math.max(1, Math.round(((post.body ?? '').length) / 400)),
    aiSummary: post.data.ai_summary ?? [],
    url: `${siteUrl}/posts/${post.data.abbrlink || post.id}/`,
    apiUrl: `${siteUrl}/api/posts/${post.data.abbrlink || post.id}.json`,
    matchType: query ? 'search' : (category ? 'category' : (tag ? 'tag' : 'all')),
  }));

  return new Response(JSON.stringify({
    version: '1.0',
    schema: `${siteUrl}/api/search.json`,
    q: query || null,
    category,
    tag,
    total: results.length,
    returned: posts.length,
    limit,
    posts,
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
      'X-API-Version': '1.0',
      'X-Content-Type': 'inkwell/search',
    },
  });
}
