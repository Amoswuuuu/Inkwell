import { getCollection } from 'astro:content';
import { SITE } from '../../config';
import { normalizeCats, normalizeTags } from '../../utils/posts';

export async function GET() {
  const allPosts = (await getCollection('posts'))
    .filter(p => !p.data.draft && p.data.published !== false);

  const totalWords = allPosts.reduce((sum, p) => sum + (p.body ?? '').length, 0);
  const latestPost = allPosts.length > 0
    ? allPosts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime())[0]
    : null;

  // Category and tag counts
  const catSet = new Set<string>();
  const tagSet = new Set<string>();
  for (const post of allPosts) {
    normalizeCats(post.data.categories).forEach(c => catSet.add(c));
    normalizeTags(post.data.tags).forEach(t => tagSet.add(t));
  }

  const siteUrl = (SITE.url || '').replace(/\/$/, '');

  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    buildTimestamp: BUILD_TIMESTAMP,
    site: {
      name: SITE.title,
      url: siteUrl,
      description: SITE.description,
      author: SITE.author.name,
      startDate: SITE.startDate,
    },
    stats: {
      posts: allPosts.length,
      categories: catSet.size,
      tags: tagSet.size,
      totalWords,
    },
    latestPost: latestPost ? {
      title: latestPost.data.title,
      date: latestPost.data.date.toISOString(),
      url: `${siteUrl}/posts/${latestPost.data.abbrlink || latestPost.id}/`,
    } : null,
    feeds: {
      rss: `${siteUrl}/rss.xml`,
      json: `${siteUrl}/feed.json`,
      api: {
        posts: `${siteUrl}/api/posts.json`,
        search: `${siteUrl}/api/search.json`,
      },
    },
    capabilities: {
      rss: true,
      jsonFeed: true,
      searchApi: true,
      aiSummary: SITE.aiAbstract.enabled,
      math: SITE.post?.math ?? true,
      codeHighlight: SITE.post?.codeHighlight ?? true,
    },
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

// Injected at build time
const BUILD_TIMESTAMP = new Date().toISOString();
