# @veridtools/feel-parser

## 0.1.0

### Minor Changes

- 3378090: Initial release of the FEEL lexer and parser.

  - `parse()` — tokenizes and parses FEEL source into a typed AST (24 node types, two dialects: `expression` and `unary-tests`)
  - `safeParse()` — non-throwing variant, returns `{ ast, errors }`
  - `tokenize()` — raw token stream with byte positions
  - `walk(node, visitor)` — depth-first AST traversal with a typed visitor
  - `KNOWN_NAMES` — set of all built-in multi-word function names
  - `loc: Loc` on every AST node for source location tracking
  - CLI (`feel-parser`) with `--dialect`, `--known-names`, `--tokens`, and stdin support
  - Full DMN 1.5 standard coverage + Verid vendor extensions
