import { describe, expect, it } from 'vitest';
import { parse, tokenize } from './index.js';
import { summarize } from './summarize.js';

function run(expr: string, dialect: 'expression' | 'unary-tests' = 'expression') {
  const ast = parse(expr, dialect);
  const tokens = tokenize(expr);
  return summarize(ast, tokens, dialect);
}

describe('summarize', () => {
  describe('header fields', () => {
    it('shows dialect expression', () => {
      const out = run('1 + 2');
      expect(out).toContain('dialect:   expression');
    });

    it('shows dialect unary-tests', () => {
      const out = run('>= 700', 'unary-tests');
      expect(out).toContain('dialect:   unary-tests');
    });

    it('shows root node type', () => {
      const out = run('42');
      expect(out).toContain('root:      NumberLiteral');
    });

    it('shows loc span', () => {
      const out = run('42');
      expect(out).toContain('loc:       0 → 2');
    });

    it('shows token count', () => {
      const out = run('1 + 2');
      const tokens = tokenize('1 + 2');
      expect(out).toContain(`tokens:    ${tokens.length}`);
    });

    it('shows node count', () => {
      // 1 + 2 → BinaryOp + 2× NumberLiteral = 3 nodes
      const out = run('1 + 2');
      expect(out).toContain('nodes:     3');
    });
  });

  describe('root detail', () => {
    it('shows BinaryOp operator for all ops', () => {
      expect(run('a + b')).toContain('root:      BinaryOp  (op: +)');
      expect(run('a - b')).toContain('root:      BinaryOp  (op: -)');
      expect(run('a * b')).toContain('root:      BinaryOp  (op: *)');
      expect(run('a / b')).toContain('root:      BinaryOp  (op: /)');
      expect(run('a ** b')).toContain('root:      BinaryOp  (op: **)');
      expect(run('a = b')).toContain('root:      BinaryOp  (op: =)');
      expect(run('a != b')).toContain('root:      BinaryOp  (op: !=)');
      expect(run('a < b')).toContain('root:      BinaryOp  (op: <)');
      expect(run('a > b')).toContain('root:      BinaryOp  (op: >)');
      expect(run('a <= b')).toContain('root:      BinaryOp  (op: <=)');
      expect(run('a >= b')).toContain('root:      BinaryOp  (op: >=)');
      expect(run('a and b')).toContain('root:      BinaryOp  (op: and)');
      expect(run('a or b')).toContain('root:      BinaryOp  (op: or)');
    });

    it('shows Identifier name', () => {
      expect(run('score')).toContain('root:      Identifier  ("score")');
    });

    it('shows FunctionCall callee name', () => {
      expect(run('abs(-1)')).toContain('root:      FunctionCall  ("abs")');
    });

    it('shows UnaryTestList test count', () => {
      expect(run('>= 700', 'unary-tests')).toContain('root:      UnaryTestList  (tests: 1)');
    });

    it('shows UnaryTestList with multiple tests', () => {
      expect(run('"A","B","C"', 'unary-tests')).toContain('root:      UnaryTestList  (tests: 3)');
    });

    it('shows UnaryTestList without negated flag when wrapper is not negated', () => {
      // not("A","B") creates a non-negated wrapper root with 1 inner negated UnaryTestList
      expect(run('not("A","B")', 'unary-tests')).toContain('root:      UnaryTestList  (tests: 1)');
      expect(run('not("A","B")', 'unary-tests')).not.toContain('negated');
    });
  });

  describe('node type breakdown', () => {
    it('lists node types section', () => {
      const out = run('1 + 2');
      expect(out).toContain('Node types:');
    });

    it('counts each type correctly', () => {
      // 1 + 2: BinaryOp×1, NumberLiteral×2
      const out = run('1 + 2');
      expect(out).toMatch(/NumberLiteral\s+2/);
      expect(out).toMatch(/BinaryOp\s+1/);
    });

    it('sorts by count descending', () => {
      // list [1,2,3]: ListLiteral×1, NumberLiteral×3 — NumberLiteral should come first
      const out = run('[1, 2, 3]');
      const numberIdx = out.indexOf('\n  NumberLiteral');
      const listIdx = out.indexOf('\n  ListLiteral');
      expect(numberIdx).toBeLessThan(listIdx);
    });

    it('breaks ties alphabetically', () => {
      // a + b: Identifier×2, BinaryOp×1 — Identifier comes first by count
      const out = run('a + b');
      const identIdx = out.indexOf('\n  Identifier');
      const binIdx = out.indexOf('\n  BinaryOp');
      expect(identIdx).toBeLessThan(binIdx);
    });

    it('counts nested nodes correctly', () => {
      // if a then b else c: IfExpression×1, Identifier×3
      const out = run('if a then b else c');
      expect(out).toMatch(/Identifier\s+3/);
      expect(out).toMatch(/IfExpression\s+1/);
    });

    it('counts function call args', () => {
      // abs(x): FunctionCall×1, Identifier×2 (abs + x)
      const out = run('abs(x)');
      expect(out).toMatch(/Identifier\s+2/);
      expect(out).toMatch(/FunctionCall\s+1/);
    });

    it('does not include zero-count types', () => {
      const out = run('42');
      expect(out).not.toContain('BinaryOp');
      expect(out).not.toContain('ListLiteral');
    });

    it('counts RangeLiteral and NumberLiteral in a range', () => {
      const out = run('[1..10]');
      expect(out).toMatch(/RangeLiteral\s+1/);
      expect(out).toMatch(/NumberLiteral\s+2/);
    });

    it('counts ContextLiteral, StringLiteral and NumberLiteral in a context', () => {
      const out = run('{name: "Alice", age: 30}');
      expect(out).toMatch(/ContextLiteral\s+1/);
      expect(out).toMatch(/StringLiteral\s+1/);
      expect(out).toMatch(/NumberLiteral\s+1/);
    });

    it('counts ForExpression and RangeLiteral', () => {
      const out = run('for x in 1..5 return x * x');
      expect(out).toMatch(/ForExpression\s+1/);
      expect(out).toMatch(/RangeLiteral\s+1/);
    });

    it('counts LetExpression nodes', () => {
      const out = run('let x = 1 in x + 1');
      expect(out).toMatch(/LetExpression\s+1/);
    });

    it('counts PipelineExpression nodes', () => {
      const out = run('"hello" |> upper case');
      expect(out).toMatch(/PipelineExpression\s+1/);
    });

    it('counts BetweenExpression nodes', () => {
      const out = run('x between 1 and 10');
      expect(out).toMatch(/BetweenExpression\s+1/);
    });

    it('counts InExpression nodes', () => {
      const out = run('x in [1..10]');
      expect(out).toMatch(/InExpression\s+1/);
    });

    it('counts FunctionDefinition nodes', () => {
      const out = run('function(x) x + 1');
      expect(out).toMatch(/FunctionDefinition\s+1/);
    });

    it('counts UnaryMinus nodes', () => {
      const out = run('-5');
      expect(out).toMatch(/UnaryMinus\s+1/);
      expect(out).toMatch(/NumberLiteral\s+1/);
    });

    it('counts InstanceOf nodes', () => {
      const out = run('x instance of number');
      expect(out).toMatch(/InstanceOf\s+1/);
    });

    it('counts QuantifiedExpression nodes', () => {
      const out = run('some x in [1,2,3] satisfies x > 2');
      expect(out).toMatch(/QuantifiedExpression\s+1/);
    });

    it('counts FilterExpression nodes', () => {
      const out = run('[1,2,3][item > 1]');
      expect(out).toMatch(/FilterExpression\s+1/);
    });

    it('counts PathExpression nodes', () => {
      const out = run('order.amount');
      expect(out).toMatch(/PathExpression\s+1/);
    });

    it('counts TemporalLiteral nodes', () => {
      const out = run('@"2024-01-15"');
      expect(out).toMatch(/TemporalLiteral\s+1/);
    });

    it('counts BooleanLiteral nodes', () => {
      const out = run('true');
      expect(out).toMatch(/BooleanLiteral\s+1/);
    });

    it('counts NullLiteral nodes', () => {
      const out = run('null');
      expect(out).toMatch(/NullLiteral\s+1/);
    });
  });

  describe('loc spans', () => {
    it('reflects the actual source length', () => {
      const src = '"hello world"';
      const out = run(src);
      expect(out).toContain(`loc:       0 → ${src.length}`);
    });

    it('handles multi-token expressions', () => {
      const out = run('[1..10]');
      expect(out).toContain('loc:       0 → 7');
    });
  });
});
