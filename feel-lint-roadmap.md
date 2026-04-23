# feel-lint roadmap — parser improvements

Improvements to `@veridtools/feel-parser` that will enable a powerful `feel-lint` package.

Point 1 (error span) is already done — `ParseError` now carries `start` and `end` instead of a single `pos`.

---

## 2. Error recovery in `safeParse`

**What**: When parsing fails, return a partial AST (the nodes that parsed successfully) instead of `null`.

**Why**: A linter should continue analyzing the expression even when it has syntax errors. With a partial AST, `feel-lint` can report multiple problems in a single pass — a missing operand doesn't hide a type mismatch further in the expression.

**Shape change**:
```ts
// today
{ ast: AstNode | null; errors: ParseError[] }

// target
{ ast: AstNode | null; errors: ParseError[] }  // same — but ast is non-null when partial recovery succeeds
```

**Complexity**: High. Requires the recursive-descent parser to catch errors locally, insert sentinel nodes, and continue. A minimal approach: wrap each top-level statement boundary in a try/catch and collect partial results.

---

## 3. `collectIdentifiers` utility

**What**: A function that returns the set of all identifier names referenced in an AST.

```ts
function collectIdentifiers(ast: AstNode): Set<string>
```

**Why**: The most fundamental lint check — "is this variable in scope?" — requires knowing which names an expression uses. Today this needs a manual `walk()` loop at every call site. A single utility removes that boilerplate from every lint rule.

**Complexity**: Low. It is a `walk()` wrapper that collects `Identifier.name` values.

---

## 4. Type context (feel-lint responsibility, not parser)

**What**: Type inference and type compatibility checking belong in `feel-lint`, not in the parser. The parser already exposes everything needed: literal types are encoded in node types (`NumberLiteral`, `StringLiteral`, etc.) and the full AST is available for traversal.

**Why it's listed here**: The parser's public API should make it easy to pass a type context into `feel-lint` rules. The expected interface:

```ts
type TypeContext = Map<string, FeelType>
// e.g. new Map([['score', { name: 'number' }], ['status', { name: 'string' }]])
```

**What the parser can do**: Nothing new — `FeelType` is already exported. The lint package consumes it directly.

**Complexity**: N/A for parser. Medium for feel-lint itself.

---

## 5. Builtin arity map

**What**: A map from every builtin name to its accepted argument count range.

```ts
const BUILTIN_ARITY: ReadonlyMap<string, { min: number; max: number }>
```

**Why**: With this, `feel-lint` can detect wrong argument counts statically — no evaluation needed. Example: `substring("hello")` is missing the required `start position` argument. This covers an entire class of errors cheaply.

**Complexity**: Low for the data structure; medium to keep it accurate as builtins evolve. Should live alongside `KNOWN_NAMES` in `src/parser/constants.ts` and be exported from `src/index.ts`.

**Example entries**:
```ts
['substring',        { min: 2, max: 3 }],
['string length',    { min: 1, max: 1 }],
['round up',         { min: 2, max: 2 }],
['format number',    { min: 2, max: 2 }],
['date and time',    { min: 1, max: 2 }],
```
