import { getCollection } from 'astro:content';
import { SITE } from '../config';
import { normalizeCats, normalizeTags } from '../utils/posts';

export async function GET(context) {
  const allPosts = (await getCollection('posts'))
    .filter(p => !p.data.draft && p.data.published !== false)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const siteUrl = context.site?.toString().replace(/\/$/, '') ?? SITE.url;

  const items = allPosts.map(post => ({
    id: `${siteUrl}/posts/${post.data.abbrlink || post.id}/`,
    url: `${siteUrl}/posts/${post.data.abbrlink || post.id}/`,
    title: post.data.title,
    summary: post.data.description || post.data.ai_summary?.join(' ') || '',
    date_published: post.data.date.toISOString(),
    date_modified: post.data.updated?.toISOString() ?? post.data.date.toISOString(),
    author: {
      name: SITE.author.name,
      url: siteUrl,
      avatar: SITE.author.avatar,
    },
    categories: normalizeCats(post.data.categories),
    tags: normalizeTags(post.data.tags),
    image: post.data.cover || undefined,
    language: 'zh-CN',
    // AI summary points for machine reading
    ...(post.data.ai_summary?.length > 0 && {
      custom_summary: post.data.ai_summary,
    }),
  }));

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: SITE.title,
    description: SITE.description,
    home_page_url: siteUrl,
    feed_url: `${siteUrl}/feed.json`,
    language: 'zh-CN',
    authors: [{
      name: SITE.author.name,
      url: siteUrl,
      avatar: SITE.author.avatar,
    }],
    favicon: `${siteUrl}/logo.svg`,
    icon: `${siteUrl}/logo.svg`,
    ttl: 60,
    date_modified: allPosts.length > 0 ? allPosts[0].data.date.toISOString() : new Date().toISOString(),
    items,
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
