import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://senivel.github.io',
  base: '/domain-context-claude',
  integrations: [
    starlight({
      title: 'Domain Context',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/senivel/domain-context-claude' },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          autogenerate: { directory: 'getting-started' },
        },
      ],
    }),
  ],
});
