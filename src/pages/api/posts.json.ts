import { getCollection } from 'astro:content';
import { SITE } from '../../config';
import { normalizeCats, normalizeTags } from '../../utils/posts';

export async function GET() {
  const allPosts = (await getCollection('posts'))
    .filter(p => !p.data.draft && p.data.published !== false)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const siteUrl = (SITE.url || '').replace(/\/$/, '');

  const posts = allPosts.map(post => ({
    slug: post.data.abbrlink || post.id,
    title: post.data.title,
    description: post.data.description || '',
    date: post.data.date.toISOString(),
    updated: post.data.updated?.toISOString() ?? post.data.date.toISOString(),
    categories: normalizeCats(post.data.categories),
    tags: normalizeTags(post.data.tags),
    cover: post.data.cover || null,
    readingTime: Math.max(1, Math.round(((post.body ?? '').length) / 400)),
    aiSummary: post.data.ai_summary ?? [],
    url: `${siteUrl}/posts/${post.data.abbrlink || post.id}/`,
  }));

  return new Response(JSON.stringify({
    version: '1.0',
    site: {
      name: SITE.title,
      url: siteUrl,
      description: SITE.description,
      author: SITE.author.name,
    },
    total: posts.length,
    posts,
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
