---
title: CLI — feel-parser
---

# CLI

`feel-parser` is a command-line tool for parsing FEEL expressions and inspecting the resulting AST or token stream.

## Install

```bash
pnpm add -g @veridtools/feel-parser
# or without installing
pnpx @veridtools/feel-parser "1 + 2"
```

## Usage

```
feel-parser <expression> [options]
feel-parser - [options]          Read expression from stdin
```

## Options

| Flag | Short | Description |
|------|-------|-------------|
| `--dialect <dialect>` | `-d` | `expression` (default) or `unary-tests` |
| `--known-names <names>` | `-k` | Comma-separated multi-word known names |
| `--tokens` | `-t` | Output token list instead of AST |
| `--no-color` | `-n` | Disable ANSI colors |
| `--help` | `-h` | Show help |

## Examples

### Parse an expression → AST

```bash
feel-parser "1 + 2 * 3"
```

```json
{
  "type": "BinaryOp",
  "op": "+",
  "left": { "type": "NumberLiteral", "value": "1" },
  "right": {
    "type": "BinaryOp",
    "op": "*",
    "left": { "type": "NumberLiteral", "value": "2" },
    "right": { "type": "NumberLiteral", "value": "3" }
  }
}
```

### Conditional expression

```bash
feel-parser "if score >= 700 then \"approved\" else \"declined\""
```

### Multi-word known names

```bash
feel-parser "Monthly Salary * 12" --known-names "Monthly Salary"
# Identifier { name: 'Monthly Salary' }  ← assembled as one node

feel-parser "Full Name + \" \" + Email" --known-names "Full Name, Email"
```

### Unary-tests dialect (DMN input cell)

```bash
feel-parser ">= 700" --dialect unary-tests
feel-parser "[18..65]" --dialect unary-tests
feel-parser "\"Low\",\"Medium\",\"High\"" --dialect unary-tests
feel-parser "not(\"High\",\"Medium\")" --dialect unary-tests
feel-parser "-" --dialect unary-tests      # wildcard — any value passes
```

### Token stream

```bash
feel-parser "date and time(\"2024-01-15T10:30:00\")" --tokens
```

```json
[
  { "type": "Name",   "value": "date",  "start": 0,  "end": 4  },
  { "type": "Name",   "value": "and",   "start": 5,  "end": 8  },
  { "type": "Name",   "value": "time",  "start": 9,  "end": 13 },
  { "type": "(",      "value": "(",     "start": 13, "end": 14 },
  ...
]
```

### Read from stdin

```bash
echo "for x in 1..5 return x * x" | feel-parser -
cat expression.feel | feel-parser - --tokens
```

### Temporal and builtins

```bash
feel-parser "@\"2024-06-15\" + duration(\"P30D\")"
feel-parser "format number(1234567.89, \"#,##0.00\")"
feel-parser "sort([3,1,4,1,5], function(a,b) a < b)"
feel-parser "let base = 100 in let tax = base * 0.1 in base + tax"
feel-parser "\"hello world\" |> upper case |> substring(?, 1, 5)"
```

## Try it locally (from the repo)

```bash
git clone https://github.com/veridtools/feel-parser
cd feel-parser
pnpm install

# Run without building (via tsx)
npx tsx bin/feel-parser.ts "1 + 2"
npx tsx bin/feel-parser.ts "Monthly Salary * 12" --known-names "Monthly Salary"
npx tsx bin/feel-parser.ts ">= 700" --dialect unary-tests
npx tsx bin/feel-parser.ts "date and time(\"2024-01-15T10:30:00\")" --tokens
npx tsx bin/feel-parser.ts --help

# Or build first and run the output directly
pnpm build
node dist/bin/feel-parser.js "some x in [1,2,3] satisfies x > 2"
node dist/bin/feel-parser.js "format date(date(\"2024-06-15\"), \"dd/MM/yyyy\")"
```
