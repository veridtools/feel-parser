---
title: Lexer — Tokens
---

# Lexer — Tokens

`tokenize(source)` scans a FEEL source string and returns a flat `Token[]` array. The final token is always `EOF`.

## Token shape

```ts
interface Token {
  type: TokenType;
  value: string;   // raw matched text ('' for EOF)
  start: number;   // inclusive byte offset
  end: number;     // exclusive byte offset
}
```

## Token types

| `TokenType` | Example | Notes |
|---|---|---|
| `Number` | `42`, `3.14`, `.5`, `1e3` | Raw string — converted to Decimal by the evaluator |
| `String` | `"hello"` | Includes surrounding quotes |
| `Boolean` | `true`, `false` | |
| `Null` | `null` | |
| `Name` | `score`, `Monthly` | Identifier fragment |
| `Temporal` | `@"2024-06-15"` | At-sign + quoted string |
| `Plus` | `+` | |
| `Minus` | `-` | |
| `Star` | `*` | |
| `Slash` | `/` | |
| `StarStar` | `**` | Exponentiation |
| `Pipe` | `\|>` | Pipeline operator |
| `Eq` | `=` | |
| `Neq` | `!=` | |
| `Lt` | `<` | |
| `Gt` | `>` | |
| `Lte` | `<=` | |
| `Gte` | `>=` | |
| `And` | `and` | |
| `Or` | `or` | |
| `Not` | `not` | |
| `If` | `if` | |
| `Then` | `then` | |
| `Else` | `else` | |
| `For` | `for` | |
| `In` | `in` | |
| `Return` | `return` | |
| `Some` | `some` | |
| `Every` | `every` | |
| `Satisfies` | `satisfies` | |
| `Function` | `function` | |
| `External` | `external` | |
| `InstanceOf` | `instance` | Followed by `of` |
| `Between` | `between` | |
| `Let` | `let` | |
| `LParen` | `(` | |
| `RParen` | `)` | |
| `LBracket` | `[` | |
| `RBracket` | `]` | |
| `LBrace` | `{` | |
| `RBrace` | `}` | |
| `Comma` | `,` | |
| `Colon` | `:` | |
| `Dot` | `.` | |
| `DotDot` | `..` | Range separator |
| `Question` | `?` | Wildcard / pipeline placeholder |
| `At` | `@` | Temporal prefix |
| `Arrow` | `->` | |
| `EOF` | _(end)_ | `value` is `''` |

## Usage

```ts
import { tokenize, TokenType } from '@veridtools/feel-parser';

const tokens = tokenize('score >= 700');

for (const tok of tokens) {
  if (tok.type === TokenType.EOF) break;
  console.log(tok.type, JSON.stringify(tok.value));
}
// Name   "score"
// Gte    ">="
// Number "700"
```

## Whitespace

Whitespace is **skipped** during tokenization — tokens only represent meaningful FEEL symbols. Use `start`/`end` offsets to reconstruct positions in the original source if needed.
