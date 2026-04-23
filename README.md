# @veridtools/feel-parser

<img src="./docs/public/verd-logo.webp" alt="Veridtools Logo" width="150" />

[![npm](https://img.shields.io/npm/v/@veridtools/feel-parser)](https://www.npmjs.com/package/@veridtools/feel-parser)
[![license](https://img.shields.io/github/license/veridtools/feel-parser)](./LICENSE)
[![ci](https://img.shields.io/github/actions/workflow/status/veridtools/feel-parser/ci.yml?label=ci)](https://github.com/veridtools/feel-parser/actions)
[![docs](https://img.shields.io/badge/docs-github%20pages-blue)](https://veridtools.github.io/feel-parser/)
![dependencies](https://img.shields.io/badge/dependencies-0-success)

> FEEL expression lexer and parser — produces a typed AST from FEEL source, zero dependencies.

`@veridtools/feel-parser` tokenizes and parses [FEEL](https://www.omg.org/spec/DMN/1.5) (Friendly Enough Expression Language) expressions as defined in the OMG DMN 1.5 specification. It produces a fully typed AST — evaluation is handled separately by [`@veridtools/feel-runner`](https://www.npmjs.com/package/@veridtools/feel-runner).

## Install

```bash
pnpm add @veridtools/feel-parser
# or
npm install @veridtools/feel-parser
```

## Quick start

```ts
import { parse, tokenize } from '@veridtools/feel-parser'

// Parse a FEEL expression into an AST
const ast = parse('price * quantity + discount')
// → BinaryOp { op: '+', left: BinaryOp { op: '*', ... }, right: Identifier { name: 'discount' } }

// Parse a unary test list (DMN input cell)
const tests = parse('[18..65], > 70', 'unary-tests')

// Multi-word names: pass known names so the parser resolves ambiguity
const ast2 = parse('order line item * 2', 'expression', new Set(['order line item']))

// Tokenize only
const tokens = tokenize('1 + 2 * 3')
```

## CLI

### Installed

```bash
# Install globally
pnpm add -g @veridtools/feel-parser
# or without installing
pnpx @veridtools/feel-parser "1 + 2"

# Parse an expression → AST JSON
feel-parser "if score >= 700 then \"approved\" else \"declined\""

# Multi-word known names
feel-parser "Monthly Salary * 12" --known-names "Monthly Salary"

# Unary-tests dialect (DMN input cell)
feel-parser "> 100, <= 200" --dialect unary-tests

# Token stream instead of AST
feel-parser "date and time(\"2024-01-15T10:30:00\")" --tokens

# Read expression from stdin
echo "for x in 1..5 return x * x" | feel-parser -

feel-parser --help
```

### Try it locally (from the repo)

```bash
git clone https://github.com/veridtools/feel-parser
cd feel-parser
pnpm install

# Run without building (via tsx)
npx tsx bin/feel-parser.ts "1 + 2"
npx tsx bin/feel-parser.ts "format number(1234.56, \"#,##0.00\")"
npx tsx bin/feel-parser.ts "Monthly Salary * 12" --known-names "Monthly Salary"
npx tsx bin/feel-parser.ts "> 100, <= 200" --dialect unary-tests
npx tsx bin/feel-parser.ts "date(2024, 1, 1)" --tokens
npx tsx bin/feel-parser.ts --help

# Or build first and run the output directly
pnpm build
node dist/bin/feel-parser.js "some x in [1,2,3] satisfies x > 2"
```

## API

### `parse(source, dialect?, knownNames?)`

| Param | Type | Default | Description |
|---|---|---|---|
| `source` | `string` | — | FEEL expression source text |
| `dialect` | `FeelDialect` | `'expression'` | `'expression'` or `'unary-tests'` |
| `knownNames` | `Set<string>` | `new Set()` | Multi-word names in scope |

Returns an `AstNode`. Throws a `ParseSyntaxError` with `message`, `start`, and `end` on parse failure.

### `tokenize(source)`

Returns `Token[]`. Each token has `type: TokenType`, `value: string`, `start: number`, `end: number`.

### `safeParse(source, dialect?, knownNames?)`

Like `parse()` but never throws. Returns `{ ast: AstNode, errors: ParseSyntaxError[] }`.

On error, `ast` is a partial tree where invalid positions are filled with `ErrorNode` sentinels — the parser recovers and continues past each error.

```ts
const { ast, errors } = safeParse('1 +')
// ast    → BinaryOp { op: '+', left: NumberLiteral{1}, right: ErrorNode }
// errors → [ParseSyntaxError { message: '...', start: 3, end: 3 }]

const ok = safeParse('1 + 2')
// ok.ast    → BinaryOp { op: '+', ... }
// ok.errors → []
```

### `walk(node, visitor)`

Depth-first traversal. Visitor is a partial record keyed by node type.

```ts
import { parse, walk } from '@veridtools/feel-parser'

const ast = parse('1 + 2 * 3')
const nums: string[] = []
walk(ast, { NumberLiteral: (n) => nums.push(n.value) })
// nums → ['1', '2', '3']
```

### `KNOWN_NAMES`

`Set<string>` of all multi-word builtin names the parser recognises.

```ts
import { KNOWN_NAMES } from '@veridtools/feel-parser'
KNOWN_NAMES.has('date and time') // true
```

### Source locations (`loc`)

Every AST node carries `loc: { start: number; end: number }` with byte offsets.

```ts
parse('"hello"').loc // { start: 0, end: 7 }
```

### Types

```ts
import type { AstNode, ErrorNode, Token, FeelDialect, FeelType, RangeLiteral } from '@veridtools/feel-parser'
import type { Loc, ParseResult, Visitor } from '@veridtools/feel-parser'
import { ParseSyntaxError, TokenType, KNOWN_NAMES } from '@veridtools/feel-parser'
```

## Development

```bash
pnpm install          # Install dependencies
pnpm build            # Build library + CLI (ESM + CJS)
pnpm test             # Run all tests
pnpm test:watch       # Watch mode
pnpm typecheck        # TypeScript type checking
pnpm check            # Lint + format (Biome)
pnpm docs:dev         # VitePress dev server
pnpm docs:build       # Build docs
```

## Tests

All tests are colocated with the source files they cover (`src/**/*.test.ts`):

| File | Coverage |
|---|---|
| `src/lexer/index.test.ts` | Tokenizer — all token types, positions |
| `src/parser/index.test.ts` | AST shapes for all node types |
| `src/parser/errors.test.ts` | Parse errors and error messages |
| `src/parser/safeParse.test.ts` | `safeParse()` contract — valid/invalid inputs, error shape, never throws |
| `src/parser/recovery.test.ts` | Error recovery — `ErrorNode`, `ParseSyntaxError`, per-construct recovery, accumulation |
| `src/index.test.ts` | Public API, DMN / TCK expression patterns |
| `src/language.test.ts` | Full FEEL language coverage — all 80+ builtins, OMG DMN 1.5 conformance, vendor extensions |
| `src/summarize.test.ts` | `summarize()` — header fields, root detail, node-type breakdown, loc spans |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT — [LICENSE](./LICENSE)
