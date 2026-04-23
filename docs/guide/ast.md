---
title: AST Node Types
---

# AST Node Types

Every node returned by `parse()` is one of the following discriminated-union members. Switch on `node.type` to handle each case.

## Literals

### `NumberLiteral`
```ts
{ type: 'NumberLiteral'; value: string }
```
Raw lexer text — evaluators convert this to a Decimal. `value` is always the original source text (e.g. `"3.14"`, `"1e6"`).

### `StringLiteral`
```ts
{ type: 'StringLiteral'; value: string }
```
The string content **without** surrounding quotes, with escape sequences resolved.

### `BooleanLiteral`
```ts
{ type: 'BooleanLiteral'; value: boolean }
```

### `NullLiteral`
```ts
{ type: 'NullLiteral' }
```

### `TemporalLiteral`
```ts
{ type: 'TemporalLiteral'; value: string }
```
The quoted content of `@"…"` literals, e.g. `@"2024-06-15"` → `value: "2024-06-15"`.

---

## Identifiers

### `Identifier`
```ts
{ type: 'Identifier'; name: string }
```
A variable reference. Multi-word names (`Monthly Salary`) are assembled as a single `Identifier` when the name is in `knownNames`.

---

## Arithmetic & Logic

### `UnaryMinus`
```ts
{ type: 'UnaryMinus'; operand: AstNode }
```

### `BinaryOp`
```ts
{
  type: 'BinaryOp';
  op: '+' | '-' | '*' | '/' | '**' | '=' | '!=' | '<' | '>' | '<=' | '>=' | 'and' | 'or';
  left: AstNode;
  right: AstNode;
}
```

---

## Control Flow

### `IfExpression`
```ts
{
  type: 'IfExpression';
  condition: AstNode;
  consequent: AstNode;
  alternate: AstNode;
}
```

### `ForExpression`
```ts
{
  type: 'ForExpression';
  bindings: Array<{ name: string; domain: AstNode }>;
  body: AstNode;
}
```
`domain` is either a `RangeLiteral` or any expression evaluating to a list. Multiple bindings produce a cartesian product.

### `QuantifiedExpression`
```ts
{
  type: 'QuantifiedExpression';
  quantifier: 'some' | 'every';
  bindings: Array<{ name: string; domain: AstNode }>;
  condition: AstNode;
}
```

### `LetExpression`
```ts
{
  type: 'LetExpression';
  name: string;
  value: AstNode;
  body: AstNode;
}
```

---

## Functions

### `FunctionDefinition`
```ts
{
  type: 'FunctionDefinition';
  params: Array<{ name: string; type?: string }>;
  body: AstNode;
  external: boolean;
}
```

### `FunctionCall`
```ts
{
  type: 'FunctionCall';
  callee: AstNode;
  args: Array<{ name?: string; value: AstNode }>;
}
```
`name` is set for named-parameter invocations: `substring(string: "hello", start position: 1)`.

---

## Collections & Paths

### `ListLiteral`
```ts
{ type: 'ListLiteral'; elements: AstNode[] }
```

### `ContextLiteral`
```ts
{
  type: 'ContextLiteral';
  entries: Array<{ key: string | AstNode; value: AstNode }>;
}
```

### `PathExpression`
```ts
{ type: 'PathExpression'; object: AstNode; path: string }
```
`a.b` → `object: Identifier{a}`, `path: "b"`.

### `FilterExpression`
```ts
{ type: 'FilterExpression'; list: AstNode; filter: AstNode }
```
`items[item > 0]` — `filter` is evaluated with each element bound to the implicit context.

### `RangeLiteral`
```ts
{
  type: 'RangeLiteral';
  startIncluded: boolean;
  endIncluded: boolean;
  start: AstNode | null;   // null = unbounded
  end: AstNode | null;     // null = unbounded
  bare?: boolean;          // true for unbracketed a..b in for loops
}
```

| Syntax | `startIncluded` | `endIncluded` |
|---|---|---|
| `[1..10]` | `true` | `true` |
| `(1..10)` | `false` | `false` |
| `[1..10)` | `true` | `false` |
| `(1..10]` | `false` | `true` |

---

## Tests & Type Checks

### `UnaryTestList`
```ts
{
  type: 'UnaryTestList';
  tests: AstNode[];
  negated: boolean;
}
```
Used in the `unary-tests` dialect. `not("A","B")` produces `negated: true`. The wildcard `-` produces `tests: []`.

### `InstanceOf`
```ts
{ type: 'InstanceOf'; value: AstNode; targetType: FeelType }
```
See [`FeelType`](/api/reference#feeltype) for all type variants.

### `InExpression`
```ts
{ type: 'InExpression'; value: AstNode; test: AstNode }
```
`x in [1..10]` — `test` is the range or unary-test RHS.

### `BetweenExpression`
```ts
{ type: 'BetweenExpression'; value: AstNode; low: AstNode; high: AstNode }
```

---

## Pipeline

### `PipelineExpression`
```ts
{ type: 'PipelineExpression'; left: AstNode; right: AstNode }
```
`[1,2,3] |> count(?)` — `?` in `right` is a placeholder for the piped value.
