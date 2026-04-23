---
title: Parser — AST
---

# Parser — AST

`parse(source, dialect?, knownNames?)` runs the lexer and then the recursive-descent parser, returning the root `AstNode`.

## Signature

```ts
function parse(
  source: string,
  dialect?: 'expression' | 'unary-tests',
  knownNames?: Set<string>,
): AstNode
```

| Parameter | Default | Description |
|---|---|---|
| `source` | — | FEEL source string |
| `dialect` | `'expression'` | Grammar entry point |
| `knownNames` | `new Set()` | Multi-word identifier hints |

Throws a `SyntaxError` (or similar) when the input is malformed.

## How it works

The parser is a **single-pass recursive descent** parser. It reads the token stream produced by `tokenize()` and builds an AST bottom-up by precedence.

### Operator precedence (expression dialect)

From lowest to highest:

| Level | Operators |
|---|---|
| 1 | `or` |
| 2 | `and` |
| 3 | `=`, `!=`, `<`, `>`, `<=`, `>=` |
| 4 | `+`, `-` |
| 5 | `*`, `/` |
| 6 | `**` |
| 7 | Unary `-`, `not` |
| 8 | Filter `[…]`, path `.name`, function call `(…)` |

### Multi-word identifiers

FEEL allows names with spaces: `Monthly Salary`, `Order Line Item`. The lexer emits these as separate `Name` tokens. The parser reassembles them into a single `Identifier` node if the full phrase appears in `knownNames`.

```ts
parse('Monthly Salary + 1', 'expression', new Set(['Monthly Salary']));
// BinaryOp {
//   left: Identifier { name: 'Monthly Salary' },
//   right: NumberLiteral { value: '1' }
// }
```

Without the hint, the parser sees `Monthly` as one expression and `Salary` as a second — a parse error or unexpected structure.

## Examples

### Arithmetic

```ts
parse('(1 + 2) * 3')
// BinaryOp {
//   op: '*',
//   left: BinaryOp { op: '+', left: NumberLiteral{1}, right: NumberLiteral{2} },
//   right: NumberLiteral { value: '3' }
// }
```

### Conditional

```ts
parse('if score >= 700 then "approved" else "declined"')
// IfExpression {
//   condition: BinaryOp { op: '>=', left: Identifier{score}, right: NumberLiteral{700} },
//   consequent: StringLiteral { value: 'approved' },
//   alternate:  StringLiteral { value: 'declined' }
// }
```

### Unary tests

```ts
parse('[100..999]', 'unary-tests')
// UnaryTestList {
//   negated: false,
//   tests: [ RangeLiteral { startIncluded: true, endIncluded: true, ... } ]
// }
```
