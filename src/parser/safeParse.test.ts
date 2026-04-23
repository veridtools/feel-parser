import { describe, expect, it } from 'vitest';
import { safeParse } from '../index.js';

describe('safeParse', () => {
  it('returns ast and empty errors for valid expression', () => {
    const result = safeParse('1 + 2');
    expect(result.errors).toEqual([]);
    expect(result.ast).toMatchObject({ type: 'BinaryOp', op: '+' });
  });

  it('returns null ast and error for invalid expression', () => {
    const result = safeParse('1 +');
    expect(result.ast).toBeNull();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      message: expect.any(String),
      pos: expect.any(Number),
    });
  });

  it('error pos points to the bad token', () => {
    const result = safeParse('if true then');
    expect(result.ast).toBeNull();
    const err = result.errors[0]!;
    expect(err.pos).toBeGreaterThanOrEqual(0);
  });

  it('works with unary-tests dialect', () => {
    const result = safeParse('>= 100', 'unary-tests');
    expect(result.errors).toEqual([]);
    expect(result.ast).toMatchObject({ type: 'UnaryTestList' });
  });

  it('returns null ast on unary-tests parse error', () => {
    const result = safeParse('>=', 'unary-tests');
    expect(result.ast).toBeNull();
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
