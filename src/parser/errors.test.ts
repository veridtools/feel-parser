import { describe, expect, it } from 'vitest';
import { parse } from '../index.js';

function parseExpr(src: string): () => unknown {
  return () => parse(src, 'expression', new Set());
}

function parseUnary(src: string): () => unknown {
  return () => parse(src, 'unary-tests', new Set(['?']));
}

describe('parser — error cases', () => {
  describe('unclosed brackets', () => {
    it('unclosed list [1, 2', () => {
      expect(parseExpr('[1, 2')).toThrow();
    });

    it('unclosed context {a: 1', () => {
      expect(parseExpr('{a: 1')).toThrow();
    });

    it('unclosed parenthesis (1 + 2', () => {
      expect(parseExpr('(1 + 2')).toThrow();
    });

    it('unclosed string', () => {
      expect(parseExpr('"hello')).toThrow();
    });
  });

  describe('invalid tokens', () => {
    it('unexpected operator at start', () => {
      expect(parseExpr('* 5')).toThrow();
    });

    it('missing operand after +', () => {
      expect(parseExpr('1 +')).toThrow();
    });

    it('consecutive operators', () => {
      expect(parseExpr('1 + * 2')).toThrow();
    });
  });

  describe('malformed structures', () => {
    it('if without then', () => {
      expect(parseExpr('if true 1 else 2')).toThrow();
    });

    it('if without else', () => {
      expect(parseExpr('if true then 1')).toThrow();
    });

    it('for without return', () => {
      expect(parseExpr('for x in [1,2]')).toThrow();
    });

    it('some without satisfies', () => {
      expect(parseExpr('some x in [1,2]')).toThrow();
    });

    it('let without in', () => {
      expect(parseExpr('let x = 5')).toThrow();
    });

    it('function without body', () => {
      expect(parseExpr('function(x)')).toThrow();
    });
  });

  describe('invalid range syntax', () => {
    it('empty range []', () => {
      // [] is a valid empty list, not a range — but [..] has no start/end value is invalid
      expect(parseExpr('[..]')).toThrow();
    });
  });

  describe('valid edge cases that should NOT throw', () => {
    it('empty list []', () => {
      expect(parseExpr('[]')).not.toThrow();
    });

    it('empty context {}', () => {
      expect(parseExpr('{}')).not.toThrow();
    });

    it('nested empty structures', () => {
      expect(parseExpr('{a: [], b: {}}')).not.toThrow();
    });

    it('deeply nested if', () => {
      expect(parseExpr('if a then if b then 1 else 2 else if c then 3 else 4')).not.toThrow();
    });

    it('chained and/or', () => {
      expect(parseExpr('a and b and c or d')).not.toThrow();
    });

    it('multi-binding for', () => {
      expect(parseExpr('for x in [1], y in [2] return x + y')).not.toThrow();
    });

    it('unary test list with multiple values', () => {
      expect(parseUnary('"A", "B", > 5')).not.toThrow();
    });

    it('wildcard unary test', () => {
      expect(parseUnary('-')).not.toThrow();
    });
  });
});
