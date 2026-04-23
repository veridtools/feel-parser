# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Commands

```bash
pnpm build          # tsup → dist/ (ESM + CJS + CLI)
pnpm dev            # tsup --watch
pnpm test           # vitest run
pnpm test:watch     # vitest
pnpm typecheck      # tsc --noEmit
pnpm check          # biome lint + format check
pnpm check:fix      # biome lint + format auto-fix
pnpm docs:dev       # VitePress dev server
pnpm docs:build     # Build docs
```

## Architecture

This is a **FEEL expression lexer and parser**, published as `@veridtools/feel-parser`. It tokenizes and parses FEEL source into a typed AST — it does not evaluate.

### Pipeline: `parse(expression, dialect?, knownNames?)`

```
src/lexer/tokens.ts     → TokenType enum, Token interface, KEYWORDS
src/lexer/index.ts      → Lexer class → tokenize(source) → Token[]
src/parser/parser.ts    → Parser class (internal, recursive descent)
src/parser/index.ts     → parse() + safeParse() public functions → AstNode
```

### Key files

| File | Responsibility |
|------|---------------|
| `src/types.ts` | `FeelDialect` type (`'expression' \| 'unary-tests'`) |
| `src/index.ts` | Public API — all exports below |
| `src/lexer/tokens.ts` | `TokenType` enum, `Token` interface, `KEYWORDS` map |
| `src/lexer/index.ts` | `Lexer` class + `tokenize()` — FEEL source → `Token[]` |
| `src/parser/ast.ts` | All AST node type definitions + `Loc`, `ParseError`, `ParseResult` |
| `src/parser/constants.ts` | Keywords, operators, precedence rules, `KNOWN_NAMES` |
| `src/parser/parser.ts` | `Parser` class (internal) — recursive descent, all 24 node types |
| `src/parser/index.ts` | `parse()` + `safeParse()` public functions |
| `src/summarize.ts` | `summarize(ast, tokens, dialect)` — human-readable parse overview (used by docs playground) |
| `src/walker.ts` | `walk(node, visitor)` + `Visitor` type |
| `bin/feel-parser.ts` | CLI entrypoint — `feel-parser` command |

### Test structure

All tests are colocated with the source files they cover:

```
src/lexer/index.test.ts         → tokenizer tests
src/parser/index.test.ts        → AST shape tests for all node types
src/parser/errors.test.ts       → parse error messages
src/parser/safeParse.test.ts    → safeParse() — valid/invalid inputs, ParseError shape
src/index.test.ts               → public API, DMN / TCK expression patterns
src/language.test.ts            → full FEEL language coverage (80+ builtins, OMG conformance, vendor extensions)
src/summarize.test.ts           → summarize() — header fields, root detail, node-type breakdown, loc spans
src/walker.test.ts              → walk() traversal, depth-first ordering, null-safe RangeLiteral
```

### Build output

```
dist/index.js            ESM library
dist/index.cjs           CJS library
dist/index.d.ts          TypeScript declarations
dist/bin/feel-parser.js  CLI (ESM, self-contained, #!/usr/bin/env node)
```

### Dialects

`parse(source, 'expression')` parses a full FEEL expression (default).
`parse(source, 'unary-tests')` parses a unary test list (DMN input cell).

The `knownNames` set (third argument) tells the parser which multi-word identifiers are in scope, resolving grammar ambiguities in name resolution.

### KNOWN_NAMES

`src/parser/constants.ts` exports `KNOWN_NAMES` — a `Set<string>` of all multi-word builtin names the parser must recognize as single identifiers (e.g. `"date and time"`, `"list replace"`).

The set is divided into two sections:
- **Standard FEEL / DMN 1.5** — everything above the vendor comment
- **Verid vendor extensions** — functions not in the DMN spec (e.g. `is blank`, `to base64`, `string format`)

When adding a new multi-word builtin to `feel-runner`, add it to `KNOWN_NAMES` here too, in the correct section.

### Public API exports

```ts
// Core
parse(src, dialect?, knownNames?) → AstNode        // throws on error
safeParse(src, dialect?, knownNames?) → ParseResult // never throws
tokenize(src) → Token[]

// Traversal
walk(node, visitor)   // depth-first, pre-order
type Visitor          // Partial record keyed by AstNode['type']

// Data
KNOWN_NAMES           // Set<string> of all multi-word builtin names

// Types
AstNode, Loc, ParseError, ParseResult
Token, TokenType
FeelType, RangeLiteral, FeelDialect
```

### Critical design decisions

**`knownNames` for multi-word names** — FEEL allows identifiers like `"order line item"`. Without knowing which names are in scope, the parser cannot distinguish `a b` (two identifiers) from the name `a b`. Pass a `Set<string>` of known names to resolve ambiguity.

**`NumberLiteral.value` is a raw string** — the parser stores numeric literals as their raw source text. The downstream evaluator converts them to `Decimal` instances. This keeps the parser dependency-free.

**`loc: Loc` on every AstNode** — source span `{ start, end }` in byte offsets. Note: `RangeLiteral` uses `start/end` for range bounds (`AstNode | null`), so source positions are wrapped as `loc` to avoid collision.

**`exactOptionalPropertyTypes: true`** — optional fields on AST nodes must be explicitly absent, not `undefined`.

**`noUncheckedIndexedAccess: true`** — all array/object index access returns `T | undefined`.

### Changeset and commit conventions

Conventional Commits enforced. Every PR with source changes needs `pnpm changeset`. Use `[skip changeset]` for docs/chore-only PRs.
