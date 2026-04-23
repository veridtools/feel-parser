---
title: Dialects
---

# Dialects

FEEL has two entry points in the DMN spec. `parse()` accepts a `dialect` parameter to select the correct grammar.

## `'expression'` (default)

Parses a general FEEL expression. This is the mode used for:

- Input expressions in decision tables
- Output expressions
- Decision logic (Boxed Expression)
- Context values
- Parameter defaults

```ts
parse('if score >= 700 then "approved" else "declined"')
parse('for x in 1..5 return x * 2')
parse('some o in orders satisfies o.amount > 100')
```

The expression dialect supports all 24 AST node types.

## `'unary-tests'`

Parses a comma-separated list of **unary tests** — the entries you put in decision table input cells.

```ts
parse('"A","B","C"', 'unary-tests')
// UnaryTestList { negated: false, tests: [StringLiteral{A}, StringLiteral{B}, StringLiteral{C}] }

parse('[100..999]', 'unary-tests')
// UnaryTestList { negated: false, tests: [RangeLiteral{100..999}] }

parse('not("High","Medium")', 'unary-tests')
// UnaryTestList { negated: false, tests: [UnaryTestList { negated: true, tests: [...] }] }

parse('-', 'unary-tests')
// UnaryTestList { negated: false, tests: [] }  ← wildcard (any)
```

### Unary test operators

Inside a unary-test list you can use prefix comparison operators:

```ts
parse('> 100, <= 200', 'unary-tests')
// tests contain BinaryOp nodes with the implicit input value as left operand
```

### Wildcard `-`

A single dash means "any value passes" — represented as `UnaryTestList { tests: [] }`.

## When to use each

| Context | Dialect |
|---|---|
| Decision table input cell | `'unary-tests'` |
| Decision table output cell | `'expression'` |
| `feel-runner` `unaryTest()` | `'unary-tests'` |
| `feel-runner` `evaluate()` | `'expression'` |
| BPMN condition expression | `'expression'` |
