import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import FeelParserPlayground from './FeelParserPlayground.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('FeelParserPlayground', FeelParserPlayground);
  },
} satisfies Theme;
