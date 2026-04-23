# @veridtools/feel-parser

## 0.2.1

### Patch Changes

- 0f316fd: fix: solve to run cli local

## 0.2.0

### Minor Changes

- ea43a7a: Add error recovery to safeParse, ParseSyntaxError, and ErrorNode

## 0.1.1

### Patch Changes

- 5e7d70f: Change `ParseError` shape: `pos: number` replaced by `start: number` and `end: number` for precise token-span error reporting. Add `summarize(ast, tokens, dialect)` internal utility and playground summary tab.

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
