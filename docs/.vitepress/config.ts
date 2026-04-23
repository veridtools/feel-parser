import { createRequire } from 'node:module';
import { defineConfig } from 'vitepress';

const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

export default defineConfig({
  title: 'Verid',
  titleTemplate: ':title | feel-parser',
  description: 'FEEL expression lexer and parser — produces a typed AST from FEEL source',
  lang: 'en-US',
  ignoreDeadLinks: true,

  head: [['link', { rel: 'icon', type: 'image/webp', href: '/verd-logo.webp' }]],

  themeConfig: {
    logo: '/verd-logo.webp',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/reference' },
      { text: 'Playground', link: '/playground' },
      { text: 'Changelog', link: '/changelog' },
      { text: `v${version}`, link: '/changelog' },
    ],

    search: {
      provider: 'local',
    },

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Overview', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/getting-started#install' },
            { text: 'Quickstart', link: '/guide/getting-started#quickstart' },
          ],
        },
        {
          text: 'Guide',
          items: [
            { text: 'CLI', link: '/guide/cli' },
            { text: 'Lexer — Tokens', link: '/guide/lexer' },
            { text: 'Parser — AST', link: '/guide/parser' },
            { text: 'AST Node Types', link: '/guide/ast' },
            { text: 'Dialects', link: '/guide/dialects' },
            { text: 'Known Names', link: '/guide/known-names' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'tokenize()', link: '/api/reference#tokenize' },
            { text: 'parse()', link: '/api/reference#parse' },
            { text: 'safeParse()', link: '/api/reference#safeparse' },
            { text: 'walk()', link: '/api/reference#walk' },
            { text: 'Token', link: '/api/reference#token' },
            { text: 'AstNode', link: '/api/reference#astnode' },
            { text: 'Loc', link: '/api/reference#loc' },
            { text: 'FeelType', link: '/api/reference#feeltype' },
            { text: 'KNOWN_NAMES', link: '/api/reference#known-names' },
          ],
        },
      ],
      '/playground': [
        {
          text: 'Playground',
          items: [{ text: 'Try it live', link: '/playground' }],
        },
        {
          text: 'Quick links',
          items: [
            { text: 'Getting started', link: '/guide/getting-started' },
            { text: 'Lexer — Tokens', link: '/guide/lexer' },
            { text: 'Parser — AST', link: '/guide/parser' },
            { text: 'API reference', link: '/api/reference' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/veridtools/feel-parser' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Verd',
    },

    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short',
      },
    },
  },

  markdown: {
    lineNumbers: true,
  },
});
