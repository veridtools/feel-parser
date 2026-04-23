---
title: API Reference
---

# API Reference

## `tokenize()` {#tokenize}

```ts
function tokenize(source: string): Token[]
```

Scans the FEEL source string and returns a flat array of tokens. The last token is always `EOF`.

**Parameters**

| Name | Type | Description |
|---|---|---|
| `source` | `string` | FEEL source to tokenize |

**Returns** `Token[]`

**Example**

```ts
import { tokenize } from '@veridtools/feel-parser';

tokenize('1 + 2')
// [
//   { type: 'Number', value: '1', start: 0, end: 1 },
//   { type: 'Plus',   value: '+', start: 2, end: 3 },
//   { type: 'Number', value: '2', start: 4, end: 5 },
//   { type: 'EOF',    value: '',  start: 5, end: 5 },
// ]
```

---

## `parse()` {#parse}

```ts
function parse(
  source: string,
  dialect?: FeelDialect,
  knownNames?: Set<string>,
): AstNode
```

Tokenizes and parses a FEEL expression, returning the root AST node.

**Parameters**

| Name | Type | Default | Description |
|---|---|---|---|
| `source` | `string` | — | FEEL source to parse |
| `dialect` | `FeelDialect` | `'expression'` | Grammar entry point |
| `knownNames` | `Set<string>` | `new Set()` | Multi-word identifier hints |

**Returns** `AstNode`

**Throws** `ParseSyntaxError` on malformed input. The error carries `start` and `end` byte offsets pointing to the offending token.

**Example**

```ts
import { parse } from '@veridtools/feel-parser';

parse('(1 + 2) * 3')
// BinaryOp { op: '*', left: BinaryOp{...}, right: NumberLiteral{3} }

parse('"A","B"', 'unary-tests')
// UnaryTestList { negated: false, tests: [StringLiteral{A}, StringLiteral{B}] }
```

---

## `Token` {#token}

```ts
interface Token {
  type: TokenType;
  value: string;   // raw matched text; '' for EOF
  start: number;   // inclusive byte offset
  end: number;     // exclusive byte offset
}
```

---

## `TokenType` {#tokentype}

A runtime enum. All members:

```ts
enum TokenType {
  Number, String, Boolean, Null, Name, Temporal,
  Plus, Minus, Star, Slash, StarStar,
  Pipe,
  Eq, Neq, Lt, Gt, Lte, Gte,
  And, Or, Not,
  If, Then, Else,
  For, In, Return,
  Some, Every, Satisfies,
  Function, External,
  InstanceOf, Of, Between,
  Let,
  LParen, RParen, LBracket, RBracket, LBrace, RBrace,
  Comma, Colon, Dot, DotDot,
  Question, At, Arrow,
  EOF,
}
```

---

## `AstNode` {#astnode}

A discriminated union of all 25 AST node types. Switch on `node.type`:

```ts
import type { AstNode } from '@veridtools/feel-parser';

function describe(node: AstNode): string {
  switch (node.type) {
    case 'NumberLiteral':   return `number: ${node.value}`;
    case 'StringLiteral':   return `string: "${node.value}"`;
    case 'BooleanLiteral':  return `bool: ${node.value}`;
    case 'NullLiteral':     return 'null';
    case 'Identifier':      return `name: ${node.name}`;
    case 'BinaryOp':        return `${node.op}`;
    case 'ErrorNode':       return `error: ${node.message}`;
    // ... all 25 cases
    default: {
      const _: never = node; // exhaustive check
      throw new Error('unknown node');
    }
  }
}
```

Full node shapes are documented on the [AST Node Types](/guide/ast) page.

---

## `FeelType` {#feeltype}

Used by `InstanceOf` nodes to represent the target type in `x instance of T`.

```ts
type FeelType =
  | { name: 'Any' }
  | { name: 'Null' }
  | { name: 'number' }
  | { name: 'string' }
  | { name: 'boolean' }
  | { name: 'date' }
  | { name: 'time' }
  | { name: 'date and time' }
  | { name: 'duration' }
  | { name: 'years and months duration' }
  | { name: 'days and time duration' }
  | { name: 'context';  properties?: Array<{ name: string; type: FeelType }> }
  | { name: 'list';     elementType?: FeelType }
  | { name: 'function'; paramTypes?: FeelType[]; returnType?: FeelType }
  | { name: 'range';    elementType?: FeelType }
  | { name: 'Unknown';  ref?: string };
```

---

## `FeelDialect` {#feeldialect}

```ts
type FeelDialect = 'expression' | 'unary-tests';
```

See the [Dialects](/guide/dialects) guide for details.

---

## `safeParse()` {#safeparse}

```ts
function safeParse(
  source: string,
  dialect?: FeelDialect,
  knownNames?: Set<string>,
): ParseResult
```

Like `parse()` but never throws. Recovers from syntax errors and always returns a non-null AST.

**Returns** `ParseResult`

```ts
type ParseResult = {
  ast: AstNode;              // always non-null — ErrorNode sentinels fill invalid positions
  errors: ParseSyntaxError[];
};
```

On invalid input, `ast` is a partial tree with `ErrorNode` sentinels where parsing failed. The parser continues past each error and accumulates all of them in `errors`.

**Example**

```ts
import { safeParse } from '@veridtools/feel-parser';

const { ast, errors } = safeParse('1 +');
// ast    → BinaryOp { op: '+', left: NumberLiteral{1}, right: ErrorNode }
// errors → [ParseSyntaxError { message: '...', start: 3, end: 3 }]

const ok = safeParse('1 + 2');
// ok.ast    → BinaryOp { op: '+', ... }
// ok.errors → []
```

---

## `ParseSyntaxError` {#parsesyntaxerror}

```ts
class ParseSyntaxError extends Error {
  readonly start: number; // inclusive byte offset of the offending token
  readonly end: number;   // exclusive byte offset of the offending token
}
```

Thrown by `parse()` on malformed input. Also returned in `safeParse().errors[]`.

```ts
import { parse, ParseSyntaxError } from '@veridtools/feel-parser';

try {
  parse('1 +');
} catch (e) {
  if (e instanceof ParseSyntaxError) {
    console.log(e.message, e.start, e.end);
  }
}
```

---

## `ErrorNode` {#errornode}

```ts
interface ErrorNode {
  type: 'ErrorNode';
  message: string;
  loc: Loc;
}
```

Sentinel AST node inserted by `safeParse()` at positions where parsing failed. Safe to traverse with `walk()` — it has no children.

---

## `Loc` {#loc}

Every AST node carries a `loc` field with the source range it covers.

```ts
interface Loc {
  start: number; // inclusive byte offset
  end: number;   // exclusive byte offset
}
```

**Example**

```ts
import { parse } from '@veridtools/feel-parser';

const ast = parse('"hello"');
ast.loc // { start: 0, end: 7 }
```

---

## `walk()` {#walk}

```ts
function walk(node: AstNode, visitor: Visitor): void
```

Depth-first traversal of an AST. Calls the matching visitor handler before recursing into children.

```ts
type Visitor = Partial<{
  [K in AstNode['type']]: (node: Extract<AstNode, { type: K }>) => void;
}>;
```

**Example**

```ts
import { parse, walk } from '@veridtools/feel-parser';

const ast = parse('1 + 2 * 3');
const numbers: string[] = [];
walk(ast, {
  NumberLiteral: (n) => numbers.push(n.value),
});
// numbers → ['1', '2', '3']
```

---

## `KNOWN_NAMES` {#known-names}

```ts
const KNOWN_NAMES: Set<string>
```

The set of all built-in multi-word function names that `feel-parser` recognises — e.g. `'date and time'`, `'string length'`, `'years and months duration'`.

Useful for linters and tooling that needs to know which identifiers are reserved:

```ts
import { KNOWN_NAMES } from '@veridtools/feel-parser';

KNOWN_NAMES.has('date and time')    // true
KNOWN_NAMES.has('string join')      // true
KNOWN_NAMES.has('my custom func')   // false
```
