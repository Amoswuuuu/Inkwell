import { getCollection, render } from 'astro:content';
import { SITE } from '../../../config';
import { normalizeCats, normalizeTags } from '../../../utils/posts';

export async function getStaticPaths() {
  const posts = await getCollection('posts', p => !p.data.draft && p.data.published !== false);
  return posts.map(post => ({
    params: { slug: post.data.abbrlink || post.id },
    props: { post },
  }));
}

export async function GET({ props }: { props: { post: Awaited<ReturnType<typeof getCollection<'posts'>>>[number] } }) {
  const { post } = props;
  const { remarkPluginFrontmatter } = await render(post);

  const siteUrl = (SITE.url || '').replace(/\/$/, '');
  const slug = post.data.abbrlink || post.id;
  const wordCount = (post.body ?? '').length;

  const response = {
    version: '1.0',
    schema: `${siteUrl}/api/posts/${slug}.json`,
    slug,
    title: post.data.title,
    description: post.data.description ?? '',
    date: post.data.date.toISOString(),
    updated: post.data.updated?.toISOString() ?? post.data.date.toISOString(),
    categories: normalizeCats(post.data.categories),
    tags: normalizeTags(post.data.tags),
    cover: post.data.cover ?? null,
    readingTime: Math.max(1, Math.round(wordCount / 400)),
    wordCount,
    aiSummary: post.data.ai_summary ?? [],
    license: typeof post.data.license === 'string'
      ? post.data.license
      : (post.data.license?.name ?? SITE.license.name),
    url: `${siteUrl}/posts/${slug}/`,
    // Full markdown body for AI agents that want to process the content
    body: post.body ?? '',
  };

  return new Response(JSON.stringify(response, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-API-Version': '1.0',
      'X-Content-Type': 'inkwell/post',
    },
  });
}
