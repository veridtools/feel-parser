---
layout: home

hero:
  name: "@veridtools/feel-parser"
  text: FEEL Lexer & Parser
  tagline: Tokenize and parse FEEL expressions into a typed AST — zero runtime dependencies.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Playground
      link: /playground
    - theme: alt
      text: GitHub
      link: https://github.com/veridtools/feel-parser

features:
  - title: Typed AST
    details: Every node is a discriminated union — exhaustive switch statements, no runtime surprises.
  - title: Full FEEL Coverage
    details: Arithmetic, logic, if/then/else, for, some/every, filter, path, context, function def & call, instance of, let, pipeline — all 24 node types.
  - title: Two Dialects
    details: Parse FEEL expressions or unary-test lists — the grammar adapts automatically.
  - title: Known Names
    details: Pass a Set of known multi-word names so the parser assembles "Monthly Salary" into a single Identifier.
  - title: Zero Dependencies
    details: Pure TypeScript. No external runtime packages. Works in Node, Deno, Bun, and the browser.
  - title: ESM + CJS + IIFE
    details: Ships all three formats plus TypeScript declarations. Drop it into any project.
---
