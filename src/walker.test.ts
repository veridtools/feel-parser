import { describe, expect, it } from 'vitest';
import { parse } from './index.js';
import { walk } from './walker.js';

describe('walk', () => {
  it('visits the root node', () => {
    const ast = parse('42');
    const visited: string[] = [];
    walk(ast, { NumberLiteral: (n) => visited.push(n.value) });
    expect(visited).toEqual(['42']);
  });

  it('visits all nodes in a binary expression depth-first', () => {
    const ast = parse('1 + 2');
    const types: string[] = [];
    walk(ast, {
      BinaryOp: () => types.push('BinaryOp'),
      NumberLiteral: (n) => types.push(n.value),
    });
    expect(types).toEqual(['BinaryOp', '1', '2']);
  });

  it('visits nested binary ops', () => {
    const ast = parse('1 + 2 * 3');
    const types: string[] = [];
    walk(ast, { NumberLiteral: (n) => types.push(n.value) });
    expect(types).toEqual(['1', '2', '3']);
  });

  it('visits list elements', () => {
    const ast = parse('[1, 2, 3]');
    const values: string[] = [];
    walk(ast, { NumberLiteral: (n) => values.push(n.value) });
    expect(values).toEqual(['1', '2', '3']);
  });

  it('visits function call callee and args', () => {
    const ast = parse('abs(-1)');
    const types: string[] = [];
    walk(ast, {
      Identifier: (n) => types.push(`id:${n.name}`),
      UnaryMinus: () => types.push('UnaryMinus'),
      NumberLiteral: (n) => types.push(`num:${n.value}`),
    });
    expect(types).toContain('id:abs');
    expect(types).toContain('UnaryMinus');
    expect(types).toContain('num:1');
  });

  it('visits if-expression branches', () => {
    const ast = parse('if true then 1 else 2');
    const types: string[] = [];
    walk(ast, {
      IfExpression: () => types.push('if'),
      BooleanLiteral: (n) => types.push(`bool:${n.value}`),
      NumberLiteral: (n) => types.push(`num:${n.value}`),
    });
    expect(types).toEqual(['if', 'bool:true', 'num:1', 'num:2']);
  });

  it('visits range literal bounds (non-null only)', () => {
    const ast = parse('[1..5]');
    const values: string[] = [];
    walk(ast, { NumberLiteral: (n) => values.push(n.value) });
    expect(values).toEqual(['1', '5']);
  });

  it('handles unbounded range (null start/end)', () => {
    const ast = parse('[..5]');
    const values: string[] = [];
    walk(ast, { NumberLiteral: (n) => values.push(n.value) });
    expect(values).toEqual(['5']);
  });

  it('visits context entries', () => {
    const ast = parse('{a: 1, b: 2}');
    const values: string[] = [];
    walk(ast, { NumberLiteral: (n) => values.push(n.value) });
    expect(values).toEqual(['1', '2']);
  });

  it('visits for-expression bindings and body', () => {
    const ast = parse('for x in [1,2] return x');
    const types: string[] = [];
    walk(ast, {
      ForExpression: () => types.push('for'),
      NumberLiteral: (n) => types.push(`num:${n.value}`),
      Identifier: (n) => types.push(`id:${n.name}`),
    });
    expect(types[0]).toBe('for');
    expect(types).toContain('num:1');
    expect(types).toContain('num:2');
  });

  it('visits let expression', () => {
    const ast = parse('let x = 10 in x + 1');
    const types: string[] = [];
    walk(ast, {
      LetExpression: () => types.push('let'),
      NumberLiteral: (n) => types.push(`num:${n.value}`),
    });
    expect(types[0]).toBe('let');
    expect(types).toContain('num:10');
    expect(types).toContain('num:1');
  });

  it('passes partial visitor — unvisited types are ignored', () => {
    const ast = parse('1 + 2');
    const values: string[] = [];
    // Only visit NumberLiteral, BinaryOp not in visitor
    walk(ast, { NumberLiteral: (n) => values.push(n.value) });
    expect(values).toEqual(['1', '2']);
  });

  it('visited nodes have loc', () => {
    const ast = parse('"hello"');
    walk(ast, {
      StringLiteral: (n) => {
        expect(n.loc).toEqual({ start: 0, end: 7 });
      },
    });
  });
});
