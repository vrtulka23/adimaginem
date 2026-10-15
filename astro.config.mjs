import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { documentationLinks } from './tools/documentation_links.mjs';

const base = process.env.BASE_PATH || '/';
export default defineConfig({
  site: process.env.SITE_URL || 'https://vrtulka23.github.io',
  base,
  output: 'static',
  trailingSlash: 'always',
  vite: {
    server: { strictPort: true },
    preview: { strictPort: true },
  },
  markdown: { processor: unified({ remarkPlugins: [[documentationLinks, { base }]], syntaxHighlight: false }) },
});
