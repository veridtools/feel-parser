---
"@veridtools/feel-parser": patch
---

Change `ParseError` shape: `pos: number` replaced by `start: number` and `end: number` for precise token-span error reporting. Add `summarize(ast, tokens, dialect)` internal utility and playground summary tab.
