import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../config';
import { normalizeCats } from '../utils/posts';

export async function GET(context) {
  const allPosts = (await getCollection('posts'))
    .filter(p => !p.data.draft && p.data.published !== false)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const items = allPosts.map((post) => {
    const title = post.data.title || 'Untitled';
    const description = post.data.description || (Array.isArray(post.data.ai_summary) ? post.data.ai_summary.join(' ') : '') || title;

    return {
      title,
      pubDate: post.data.date,
      description,
      link: `/posts/${post.data.abbrlink || post.id}/`,
      categories: normalizeCats(post.data.categories),
      author: SITE.author.email,
      content: post.body || '',  // raw Markdown body as fallback
    };
  }).filter(item => item.title && item.description);

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site,
    items,
    customData: `<language>zh-cn</language>`,
  });
}
