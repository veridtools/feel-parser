# Contributing to @veridtools/feel-parser

## Setup

```bash
git clone https://github.com/veridtools/feel-parser.git
cd feel-parser
pnpm install
```

## Dev commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Compile TypeScript → `dist/` (ESM + CJS) |
| `pnpm dev` | Watch mode build |
| `pnpm test` | Run all tests with Vitest |
| `pnpm test:watch` | Tests in watch mode |
| `pnpm typecheck` | Type-check without emitting |

## Making changes

1. Branch from `main`: `git checkout -b feat/my-change`
2. Make changes — test files live in `tests/` mirroring `src/` structure
3. Run `pnpm test` and `pnpm typecheck` to verify
4. Create a changeset: `pnpm changeset`
5. Open a PR against `main`

> For docs-only or chore PRs, add `[skip changeset]` to the PR title.

## Architecture

```
src/
  types.ts                   → FeelDialect type
  index.ts                   → public API: tokenize, TokenType, Token, parse, AstNode, FeelType, RangeLiteral, FeelDialect
  lexer/
    index.ts                 → tokenizer: FEEL source → Token[]
  parser/
    ast.ts                   → AST node type definitions
    constants.ts             → keywords, operators, precedences
    index.ts                 → recursive descent parser: tokens → AstNode
tests/
  feel/                      → unit tests: lexer, parser, error cases
  dmn-fixtures/              → real DMN fixture expressions
  conformance/               → OMG TCK conformance parse tests
```

## Adding a new AST node type

1. Add the interface in `src/parser/ast.ts` and include it in the `AstNode` union
2. Handle it in `src/parser/index.ts` (parsing logic)
3. Export the type from `src/index.ts` if it needs to be public
4. Add tests in `tests/feel/parser.test.ts`

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add support for FEEL 1.5 string join function
fix: correct precedence for unary minus inside filter
docs: update conformance coverage note
chore: bump vitest
```

## Release flow

Releases are automated via [Changesets](https://github.com/changesets/changesets):

1. Each PR that changes source or behavior must include a changeset (`pnpm changeset`)
2. When PRs merge to `main`, a **Version Packages** PR is opened automatically
3. Merging that PR triggers an npm publish via GitHub Actions
