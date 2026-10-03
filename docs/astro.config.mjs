import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://alexanderop.github.io',
  base: '/aop-mode',
  integrations: [
    starlight({
      title: 'aop-mode',
      description: 'Explicit coding workflows with verification steps.',
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Start',
          items: [
            { label: 'Introduction', slug: 'index' },
            { label: 'Installation', slug: 'getting-started' },
            { label: 'Install the plugin', slug: 'plugin-installation' },
            { label: 'Fix your first bug', slug: 'first-workflow' },
          ],
        },
        {
          label: 'Understand',
          items: [
            { label: 'How aop-mode works', slug: 'workflow' },
            { label: 'Personal principles', slug: 'principles' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Choose a workflow', slug: 'guides/choose-a-workflow' },
            { label: 'Review a change', slug: 'guides/review-change' },
            { label: 'Write documentation', slug: 'writing/write-documentation' },
          ],
        },
        {
          label: 'Reference',
          collapsed: true,
          items: [
            { label: 'Skill catalog', slug: 'catalog' },
            { label: 'Runtime compatibility', slug: 'compatibility' },
            { label: 'Installation reference', slug: 'installation-reference' },
            { label: 'Technical-writing skill', slug: 'writing/technical-writing' },
          ],
        },
        {
          label: 'Evaluation',
          items: [
            { label: 'Run and read evaluations', slug: 'testing' },
            { label: 'Plugin installation', slug: 'plugin-evaluation' },
            { label: 'Workflow evaluations', slug: 'workflow-evals' },
            { label: 'Workflow pilot evidence', slug: 'evidence/workflows' },
            { label: 'Latest local evidence', slug: 'evidence/latest' },
          ],
        },
        {
          label: 'Contribute',
          collapsed: true,
          items: [
            { label: 'Architecture', slug: 'architecture' },
            { label: 'Contributing', slug: 'contributing' },
            { label: 'Credits & inspiration', slug: 'credits' },
          ],
        },
      ],
      expressiveCode: { themes: ['github-dark', 'github-light'] },
    }),
  ],
});
