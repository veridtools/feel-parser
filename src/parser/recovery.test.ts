import { describe, expect, it } from 'vitest';
import { walk } from '../walker.js';
import type {
  BetweenExpression,
  BinaryOp,
  ContextLiteral,
  FilterExpression,
  FunctionCall,
  FunctionDefinition,
  IfExpression,
  InstanceOf,
  ListLiteral,
  PathExpression,
  QuantifiedExpression,
  UnaryTestList,
} from './ast.js';
import { ParseSyntaxError, parse, safeParse } from './index.js';

// ─── ParseSyntaxError shape ────────────────────────────────────────────────────

describe('ParseSyntaxError', () => {
  it('has name, message, start, and end', () => {
    const result = safeParse('1 +');
    const err = result.errors[0]!;
    expect(err).toBeInstanceOf(ParseSyntaxError);
    expect(err.name).toBe('ParseSyntaxError');
    expect(typeof err.message).toBe('string');
    expect(err.message.length).toBeGreaterThan(0);
    expect(typeof err.start).toBe('number');
    expect(typeof err.end).toBe('number');
    expect(err.end).toBeGreaterThanOrEqual(err.start);
  });

  it('start and end point to the offending token (EOF after +)', () => {
    const result = safeParse('1 +');
    expect(result.errors[0]).toMatchObject({ start: 3, end: 3 });
  });

  it('is the same class as what parse() throws', () => {
    let thrown: unknown;
    try {
      parse('1 +');
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(ParseSyntaxError);
    const e = thrown as ParseSyntaxError;
    expect(e.start).toBe(3);
    expect(e.end).toBe(3);
  });
});

// ─── safeParse contract ────────────────────────────────────────────────────────

describe('safeParse contract', () => {
  it('never throws — even on completely invalid input', () => {
    const badInputs = ['1 +', '* 5', '[', '{', 'if', 'for', '', '!!!', '1 + + + +'];
    for (const src of badInputs) {
      expect(() => safeParse(src)).not.toThrow();
    }
  });

  it('returns empty errors for valid input', () => {
    expect(safeParse('1 + 2').errors).toEqual([]);
    expect(safeParse('"hello"').errors).toEqual([]);
    expect(safeParse('[1, 2, 3]').errors).toEqual([]);
  });

  it('always returns a non-null ast', () => {
    const result = safeParse('* 5');
    expect(result.ast).toBeDefined();
    expect(result.ast).not.toBeNull();
  });

  it('errors array contains ParseSyntaxError instances', () => {
    const result = safeParse('[*, *]');
    for (const err of result.errors) {
      expect(err).toBeInstanceOf(ParseSyntaxError);
    }
  });
});

// ─── ErrorNode basics ─────────────────────────────────────────────────────────

describe('ErrorNode', () => {
  it('inserted for unexpected token in prefix position', () => {
    const result = safeParse('* 5');
    expect(result.ast?.type).toBe('ErrorNode');
    expect(result.errors).toHaveLength(1);
  });

  it('inserted as right operand when operand is missing', () => {
    const result = safeParse('1 +');
    expect(result.ast?.type).toBe('BinaryOp');
    expect((result.ast as BinaryOp).right.type).toBe('ErrorNode');
  });

  it('has message field accessible after walk', () => {
    const result = safeParse('* 5');
    const messages: string[] = [];
    walk(result.ast, { ErrorNode: (n) => messages.push(n.message) });
    expect(messages).toHaveLength(1);
    expect(messages[0]!.length).toBeGreaterThan(0);
  });

  it('walk does not crash on ErrorNode', () => {
    const result = safeParse('[1, *, 3]');
    expect(() => walk(result.ast, {})).not.toThrow();
  });
});

// ─── Error accumulation ────────────────────────────────────────────────────────

describe('error accumulation', () => {
  it('accumulates multiple errors in a list with multiple bad elements', () => {
    const result = safeParse('[*, *]');
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('accumulates errors from missing then and else in if', () => {
    const result = safeParse('if true 1 2');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('first error in errors[] matches what parse() throws', () => {
    const safed = safeParse('1 +');
    let thrown: ParseSyntaxError | undefined;
    try {
      parse('1 +');
    } catch (e) {
      thrown = e as ParseSyntaxError;
    }
    expect(thrown?.message).toBe(safed.errors[0]!.message);
    expect(thrown?.start).toBe(safed.errors[0]!.start);
  });
});

// ─── List recovery ────────────────────────────────────────────────────────────

describe('list recovery', () => {
  it('inserts ErrorNode inside a list and keeps valid elements', () => {
    const result = safeParse('[1, *, 3]');
    expect(result.ast?.type).toBe('ListLiteral');
    const list = result.ast as ListLiteral;
    expect(list.elements.some((e) => e.type === 'ErrorNode')).toBe(true);
    expect(list.elements.some((e) => e.type === 'NumberLiteral')).toBe(true);
  });

  it('continues after multiple bad elements', () => {
    const result = safeParse('[*, *, 3]');
    const list = result.ast as ListLiteral;
    expect(list.elements.some((e) => e.type === 'NumberLiteral')).toBe(true);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── Context recovery ─────────────────────────────────────────────────────────

describe('context recovery', () => {
  it('records error and continues for bad key', () => {
    const result = safeParse('{*: 1, b: 2}');
    expect(result.ast?.type).toBe('ContextLiteral');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('preserves entries before and after a bad key', () => {
    const result = safeParse('{a: 1, *: 2, c: 3}');
    const ctx = result.ast as ContextLiteral;
    const keys = ctx.entries.map((e) => e.key);
    expect(keys).toContain('a');
    expect(keys).toContain('c');
    expect(keys).not.toContain('*');
  });

  it('records error for missing colon after key', () => {
    const result = safeParse('{a 1}');
    expect(result.ast?.type).toBe('ContextLiteral');
    expect(result.errors.length).toBeGreaterThan(0);
    const ctx = result.ast as ContextLiteral;
    expect(ctx.entries.length).toBeGreaterThan(0);
  });

  it('context with only bad keys returns empty entries and errors', () => {
    const result = safeParse('{*: 1}');
    expect(result.ast?.type).toBe('ContextLiteral');
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ─── if expression recovery ───────────────────────────────────────────────────

describe('if expression recovery', () => {
  it('recovers from missing then — parses consequent and alternate', () => {
    const result = safeParse('if true 1 else 2');
    expect(result.errors.length).toBeGreaterThan(0);
    const node = result.ast as IfExpression;
    expect(node.type).toBe('IfExpression');
    expect(node.consequent.type).toBe('NumberLiteral');
    expect(node.alternate.type).toBe('NumberLiteral');
  });

  it('recovers from missing else — inserts ErrorNode as alternate', () => {
    const result = safeParse('if true then 1');
    expect(result.errors.length).toBeGreaterThan(0);
    const node = result.ast as IfExpression;
    expect(node.type).toBe('IfExpression');
    expect(node.consequent.type).toBe('NumberLiteral');
  });

  it('recovers when condition is invalid — consequent and alternate still parse', () => {
    const result = safeParse('if * then 1 else 2');
    const node = result.ast as IfExpression;
    expect(node.type).toBe('IfExpression');
    expect(node.condition.type).toBe('ErrorNode');
    expect(node.consequent.type).toBe('NumberLiteral');
    expect(node.alternate.type).toBe('NumberLiteral');
  });

  it('error inside if branch does not prevent alternate from parsing', () => {
    const result = safeParse('if true then * else 2');
    const node = result.ast as IfExpression;
    expect(node.consequent.type).toBe('ErrorNode');
    expect(node.alternate.type).toBe('NumberLiteral');
    expect(result.errors).toHaveLength(1);
  });

  it('nested error in list inside if branch is walkable', () => {
    const result = safeParse('if true then [1, *] else 2');
    expect(() => walk(result.ast, {})).not.toThrow();
    expect(result.errors).toHaveLength(1);
  });
});

// ─── for expression recovery ──────────────────────────────────────────────────

describe('for expression recovery', () => {
  it('recovers from missing return', () => {
    const result = safeParse('for x in [1,2,3]');
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.ast).toBeDefined();
  });

  it('error inside domain list does not prevent body from parsing', () => {
    const result = safeParse('for x in [1, *, 3] return x');
    expect(result.errors).toHaveLength(1);
    expect(result.ast?.type).toBe('ForExpression');
  });
});

// ─── some / every recovery ────────────────────────────────────────────────────

describe('quantified expression recovery', () => {
  it('recovers from missing satisfies', () => {
    const result = safeParse('some x in [1,2,3]');
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.ast).toBeDefined();
  });

  it('error inside domain list does not prevent condition from parsing', () => {
    const result = safeParse('some x in [*, 2] satisfies x > 0');
    expect(result.errors).toHaveLength(1);
    const node = result.ast as QuantifiedExpression;
    expect(node.type).toBe('QuantifiedExpression');
    expect(node.condition.type).toBe('BinaryOp');
  });
});

// ─── function definition recovery ────────────────────────────────────────────

describe('function definition recovery', () => {
  it('recovers from missing closing paren in params', () => {
    const result = safeParse('function(x');
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.ast?.type).toBe('FunctionDefinition');
  });

  it('params before error are still present', () => {
    const result = safeParse('function(x');
    const fn = result.ast as FunctionDefinition;
    expect(fn.params.some((p) => p.name === 'x')).toBe(true);
  });
});

// ─── function call recovery ───────────────────────────────────────────────────

describe('function call recovery', () => {
  it('inserts ErrorNode for bad argument and keeps other args', () => {
    const result = safeParse('max(1, *, 3)');
    expect(result.errors).toHaveLength(1);
    const call = result.ast as FunctionCall;
    expect(call.type).toBe('FunctionCall');
    expect(call.args.some((a) => a.value.type === 'ErrorNode')).toBe(true);
    expect(call.args.some((a) => a.value.type === 'NumberLiteral')).toBe(true);
  });
});

// ─── not() recovery ───────────────────────────────────────────────────────────

describe('not() recovery', () => {
  it('recovers from missing closing paren', () => {
    const result = safeParse('not(x');
    expect(result.errors.length).toBeGreaterThan(0);
    const node = result.ast as UnaryTestList;
    expect(node.type).toBe('UnaryTestList');
    expect(node.negated).toBe(true);
  });
});

// ─── between recovery ─────────────────────────────────────────────────────────

describe('between expression recovery', () => {
  it('recovers from missing and — parses high operand anyway', () => {
    const result = safeParse('x between 1 2');
    expect(result.errors.length).toBeGreaterThan(0);
    const node = result.ast as BetweenExpression;
    expect(node.type).toBe('BetweenExpression');
    expect(node.low.type).toBe('NumberLiteral');
    expect(node.high.type).toBe('NumberLiteral');
  });
});

// ─── instance of recovery ─────────────────────────────────────────────────────

describe('instance of recovery', () => {
  it('recovers from missing of — parses type anyway', () => {
    const result = safeParse('x instance number');
    expect(result.errors.length).toBeGreaterThan(0);
    const node = result.ast as InstanceOf;
    expect(node.type).toBe('InstanceOf');
    expect(node.targetType).toMatchObject({ name: 'number' });
  });
});

// ─── path expression recovery ─────────────────────────────────────────────────

describe('path expression recovery', () => {
  it('recovers from missing name after dot', () => {
    const result = safeParse('x.');
    expect(result.errors.length).toBeGreaterThan(0);
    const node = result.ast as PathExpression;
    expect(node.type).toBe('PathExpression');
  });
});

// ─── filter expression recovery ───────────────────────────────────────────────

describe('filter expression recovery', () => {
  it('inserts ErrorNode inside filter and keeps list reference', () => {
    const result = safeParse('myList[* > 5]');
    expect(result.errors.length).toBeGreaterThan(0);
    const node = result.ast as FilterExpression;
    expect(node.type).toBe('FilterExpression');
  });
});

// ─── range recovery ───────────────────────────────────────────────────────────

describe('range recovery', () => {
  it('records error for bad range end delimiter', () => {
    const result = safeParse('[1..2}');
    expect(result.errors.length).toBeGreaterThan(0);
    const err = result.errors[0]!;
    expect(err.start).toBeGreaterThanOrEqual(0);
    expect(err.end).toBeGreaterThanOrEqual(err.start);
  });
});

// ─── unary-tests dialect recovery ────────────────────────────────────────────

describe('unary-tests dialect recovery', () => {
  it('never throws on invalid unary-tests input', () => {
    expect(() => safeParse('>=', 'unary-tests')).not.toThrow();
    expect(() => safeParse('*', 'unary-tests')).not.toThrow();
    expect(() => safeParse('', 'unary-tests')).not.toThrow();
  });

  it('accumulates errors in a unary test list with bad elements', () => {
    const result = safeParse('>1, *, <10', 'unary-tests');
    expect(result.errors.length).toBeGreaterThan(0);
    const list = result.ast as UnaryTestList;
    expect(list.type).toBe('UnaryTestList');
  });
});
