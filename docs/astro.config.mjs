import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://alexanderop.github.io',
  base: '/aop-mode',
  integrations: [starlight({
    title: 'aop-mode',
    description: 'Your workflow. Your choice. Evidence across coding agents.',
    customCss: ['./src/styles/custom.css'],
    sidebar: [
      { label: 'Start here', items: [{ label: 'Getting started', slug: 'getting-started' }, { label: 'The workflow', slug: 'workflow' }, { label: 'Complete skill catalog', slug: 'catalog' }, { label: 'Runtime compatibility', slug: 'compatibility' }] },
      { label: 'Writing docs', items: [{ label: 'About technical-writing', slug: 'writing/technical-writing' }, { label: 'Write documentation', slug: 'writing/write-documentation' }] },
      { label: 'Verify', items: [{ label: 'End-to-end testing', slug: 'testing' }, { label: 'Latest local evidence', slug: 'evidence/latest' }] },
      { label: 'Build together', items: [{ label: 'Architecture', slug: 'architecture' }, { label: 'Contributing', slug: 'contributing' }, { label: 'Credits & inspiration', slug: 'credits' }] },
    ],
    expressiveCode: { themes: ['github-dark', 'github-light'] },
  })],
});
