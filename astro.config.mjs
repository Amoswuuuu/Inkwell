// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypePrettyCode from 'rehype-pretty-code';
import yaml from 'js-yaml';
import { readFileSync } from 'node:fs';
import { visit } from 'unist-util-visit';
import { h } from 'hastscript';

function rehypeTableWrapper() {
  return function (tree) {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'table' && parent && parent.tagName !== 'div') {
        const wrapper = h('div', { class: 'table-container' }, [node]);
        parent.children[index] = wrapper;
      }
    });
  };
}

// Read site URL from config.yml to keep it in sync
function getSiteUrl() {
  try {
    const configPath = new URL('./config.yml', import.meta.url);
    const config = yaml.load(readFileSync(configPath, 'utf8'));
    return config?.site?.url || 'https://example.com';
  } catch {
    return 'https://example.com';
  }
}

export default defineConfig({
  site: getSiteUrl(),
  output: 'static',
  integrations: [mdx(), sitemap()],
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [
      rehypeTableWrapper,
      [rehypePrettyCode, {
        theme: {
          light: 'github-light',
          dark: 'catppuccin-mocha'
        },
        keepBackground: false,
      }],
    ],
  },
  vite: {
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          // Silence confusing warning from Astro's internal asset processing
          if (warning.code === 'UNUSED_EXTERNAL_IMPORT' && 
              warning.message.includes('@astrojs/internal-helpers/remote')) {
            return;
          }
          warn(warning);
        },
      },
    },
  },
});
