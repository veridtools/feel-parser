---
title: Getting Started
---

# Getting Started

## Overview

`@veridtools/feel-parser` is the **lexer and parser** for the FEEL expression language (Friendly Enough Expression Language), as defined in the OMG DMN 1.5 specification.

It converts a FEEL source string into a **typed AST** (`AstNode`) that can be evaluated, validated, introspected, or compiled into another representation.

```
FEEL string ──► tokenize() ──► Token[]
FEEL string ──► parse()    ──► AstNode
```

::: tip feel-runner
If you want to **evaluate** FEEL expressions against a context, see [`@veridtools/feel-runner`](https://github.com/veridtools/feel-runner). It uses this package internally.
:::

## Install {#install}

::: code-group

```sh [pnpm]
pnpm add @veridtools/feel-parser
```

```sh [npm]
npm install @veridtools/feel-parser
```

```sh [yarn]
yarn add @veridtools/feel-parser
```

:::

## Quickstart {#quickstart}

### Parse an expression

```ts
import { parse } from '@veridtools/feel-parser';

const ast = parse('(1 + 2) * 3');
// { type: 'BinaryOp', op: '*', left: ..., right: ... }
```

### Tokenize

```ts
import { tokenize } from '@veridtools/feel-parser';

const tokens = tokenize('1 + 2');
// [
//   { type: 'Number', value: '1', start: 0, end: 1 },
//   { type: 'Plus',   value: '+', start: 2, end: 3 },
//   { type: 'Number', value: '2', start: 4, end: 5 },
//   { type: 'EOF',    value: '',  start: 5, end: 5 },
// ]
```

### Unary-test dialect

```ts
import { parse } from '@veridtools/feel-parser';

const ast = parse('"A","B","C"', 'unary-tests');
// { type: 'UnaryTestList', negated: false, tests: [...] }
```

### Known names

```ts
import { parse } from '@veridtools/feel-parser';

const names = new Set(['Monthly Salary', 'Full Name']);
const ast = parse('Monthly Salary * 12', 'expression', names);
// Identifier { name: 'Monthly Salary' }  ← assembled as one node
```

Without `knownNames`, `Monthly` and `Salary` would each become separate identifiers.
