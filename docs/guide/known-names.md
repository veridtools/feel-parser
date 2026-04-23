---
title: Known Names
---

# Known Names

FEEL allows variable names to contain spaces: `Monthly Salary`, `Order Line Item`, `Full Name`. The DMN spec calls these **Name** tokens assembled from multiple words.

## The problem

At the lexer level, `Monthly Salary` is two separate `Name` tokens. Without additional context the parser cannot know whether they form a single identifier or two consecutive expressions.

## The solution

Pass a `Set<string>` of known multi-word names as the third argument to `parse()`:

```ts
import { parse } from '@veridtools/feel-parser';

const knownNames = new Set([
  'Monthly Salary',
  'Full Name',
  'Order Line Item',
]);

const ast = parse('Monthly Salary * 12', 'expression', knownNames);
// BinaryOp {
//   op: '*',
//   left: Identifier { name: 'Monthly Salary' },  ← assembled
//   right: NumberLiteral { value: '12' }
// }
```

Without the hint:

```ts
parse('Monthly Salary * 12')
// BinaryOp {
//   op: '*',
//   left: Identifier { name: 'Monthly' },
//   right: ...                                ← Salary is orphaned
// }
```

## How it works

The parser performs a **greedy longest-match** when it sees consecutive `Name` tokens. It checks whether the concatenated phrase (with spaces) exists in `knownNames`, extending the match as far as possible before falling back to the shorter prefix.

## In the playground

The **Known Names** input field accepts a comma-separated list:

```
Monthly Salary, Full Name, Order Line Item
```

Each entry is trimmed and added to the `Set` passed to `parse()`.
