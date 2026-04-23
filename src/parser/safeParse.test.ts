import { describe, expect, it } from 'vitest';
import { safeParse } from '../index.js';

describe('safeParse', () => {
  it('returns ast and empty errors for valid expression', () => {
    const result = safeParse('1 + 2');
    expect(result.errors).toEqual([]);
    expect(result.ast).toMatchObject({ type: 'BinaryOp', op: '+' });
  });

  it('returns partial ast and error for invalid expression', () => {
    const result = safeParse('1 +');
    expect(result.ast).not.toBeNull();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      message: expect.any(String),
      start: expect.any(Number),
      end: expect.any(Number),
    });
  });

  it('error span points to the bad token', () => {
    const result = safeParse('if true then');
    expect(result.errors.length).toBeGreaterThan(0);
    const err = result.errors[0]!;
    expect(err.start).toBeGreaterThanOrEqual(0);
    expect(err.end).toBeGreaterThanOrEqual(err.start);
  });

  it('error span covers the offending token range', () => {
    // '1 +' — EOF token at position 3, single char
    const result = safeParse('1 +');
    const err = result.errors[0]!;
    expect(err.start).toBe(3);
    expect(err.end).toBeGreaterThanOrEqual(err.start);
  });

  it('works with unary-tests dialect', () => {
    const result = safeParse('>= 100', 'unary-tests');
    expect(result.errors).toEqual([]);
    expect(result.ast).toMatchObject({ type: 'UnaryTestList' });
  });

  it('returns partial ast on unary-tests parse error', () => {
    const result = safeParse('>=', 'unary-tests');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('passes knownNames through', () => {
    const result = safeParse('Monthly Salary * 12', 'expression', new Set(['Monthly Salary']));
    expect(result.errors).toEqual([]);
    expect(result.ast).toMatchObject({
      type: 'BinaryOp',
      left: { type: 'Identifier', name: 'Monthly Salary' },
    });
  });

  it('attaches loc to returned ast node', () => {
    const result = safeParse('"hello"');
    expect(result.ast?.loc).toEqual({ start: 0, end: 7 });
  });
});
