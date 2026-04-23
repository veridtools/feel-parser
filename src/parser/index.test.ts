import { describe, expect, it } from 'vitest';
import type { AstNode } from '../index.js';
import { parse } from '../index.js';

function expr(src: string, knownNames?: Set<string>): AstNode {
  return parse(src, 'expression', knownNames ?? new Set());
}

function unary(src: string): AstNode {
  return parse(src, 'unary-tests', new Set(['?']));
}

describe('parser — AST structure', () => {
  describe('literals', () => {
    it('number literal', () => {
      expect(expr('42')).toMatchObject({ type: 'NumberLiteral', value: '42' });
    });

    it('negative number', () => {
      expect(expr('-7')).toMatchObject({
        type: 'UnaryMinus',
        operand: { type: 'NumberLiteral', value: '7' },
      });
    });

    it('decimal literal', () => {
      expect(expr('3.14')).toMatchObject({ type: 'NumberLiteral', value: '3.14' });
    });

    it('string literal', () => {
      expect(expr('"hello"')).toMatchObject({ type: 'StringLiteral', value: 'hello' });
    });

    it('true literal', () => {
      expect(expr('true')).toMatchObject({ type: 'BooleanLiteral', value: true });
    });

    it('false literal', () => {
      expect(expr('false')).toMatchObject({ type: 'BooleanLiteral', value: false });
    });

    it('null literal', () => {
      expect(expr('null')).toMatchObject({ type: 'NullLiteral' });
    });

    it('temporal literal @"..."', () => {
      expect(expr('@"2024-01-15"')).toMatchObject({ type: 'TemporalLiteral', value: '2024-01-15' });
    });
  });

  describe('identifiers', () => {
    it('simple identifier', () => {
      expect(expr('x', new Set(['x']))).toMatchObject({ type: 'Identifier', name: 'x' });
    });

    it('multi-word name', () => {
      expect(expr('Full Name', new Set(['Full Name']))).toMatchObject({
        type: 'Identifier',
        name: 'Full Name',
      });
    });
  });

  describe('arithmetic', () => {
    it('addition', () => {
      expect(expr('1 + 2')).toMatchObject({
        type: 'BinaryOp',
        op: '+',
        left: { type: 'NumberLiteral', value: '1' },
        right: { type: 'NumberLiteral', value: '2' },
      });
    });

    it('subtraction', () => {
      expect(expr('10 - 3')).toMatchObject({ type: 'BinaryOp', op: '-' });
    });

    it('multiplication', () => {
      expect(expr('4 * 5')).toMatchObject({ type: 'BinaryOp', op: '*' });
    });

    it('division', () => {
      expect(expr('10 / 2')).toMatchObject({ type: 'BinaryOp', op: '/' });
    });

    it('exponentiation', () => {
      expect(expr('2 ** 8')).toMatchObject({ type: 'BinaryOp', op: '**' });
    });

    it('operator precedence: * before +', () => {
      const ast = expr('1 + 2 * 3');
      expect(ast).toMatchObject({
        type: 'BinaryOp',
        op: '+',
        right: { type: 'BinaryOp', op: '*' },
      });
    });

    it('parentheses override precedence', () => {
      const ast = expr('(1 + 2) * 3');
      expect(ast).toMatchObject({
        type: 'BinaryOp',
        op: '*',
        left: { type: 'BinaryOp', op: '+' },
      });
    });

    it('exponentiation is left-associative', () => {
      // 2 ** 3 ** 2 = (2 ** 3) ** 2 = 64 (FEEL §10.3.2.3)
      const ast = expr('2 ** 3 ** 2');
      expect(ast).toMatchObject({
        type: 'BinaryOp',
        op: '**',
        left: { type: 'BinaryOp', op: '**' },
      });
    });

    it('unary minus', () => {
      expect(expr('-5')).toMatchObject({
        type: 'UnaryMinus',
        operand: { type: 'NumberLiteral', value: '5' },
      });
    });
  });

  describe('comparison', () => {
    it('equality', () => {
      expect(expr('a = b', new Set(['a', 'b']))).toMatchObject({ type: 'BinaryOp', op: '=' });
    });

    it('inequality', () => {
      expect(expr('a != b', new Set(['a', 'b']))).toMatchObject({ type: 'BinaryOp', op: '!=' });
    });

    it('less than', () => {
      expect(expr('1 < 2')).toMatchObject({ type: 'BinaryOp', op: '<' });
    });

    it('greater than', () => {
      expect(expr('1 > 2')).toMatchObject({ type: 'BinaryOp', op: '>' });
    });

    it('less than or equal', () => {
      expect(expr('1 <= 2')).toMatchObject({ type: 'BinaryOp', op: '<=' });
    });

    it('greater than or equal', () => {
      expect(expr('1 >= 2')).toMatchObject({ type: 'BinaryOp', op: '>=' });
    });
  });

  describe('logical operators', () => {
    it('and', () => {
      expect(expr('true and false')).toMatchObject({ type: 'BinaryOp', op: 'and' });
    });

    it('or', () => {
      expect(expr('true or false')).toMatchObject({ type: 'BinaryOp', op: 'or' });
    });

    it('and has higher precedence than or', () => {
      const ast = expr('a or b and c', new Set(['a', 'b', 'c']));
      expect(ast).toMatchObject({
        type: 'BinaryOp',
        op: 'or',
        right: { type: 'BinaryOp', op: 'and' },
      });
    });
  });

  describe('if expression', () => {
    it('basic if-then-else', () => {
      expect(expr('if true then 1 else 2')).toMatchObject({
        type: 'IfExpression',
        condition: { type: 'BooleanLiteral', value: true },
        consequent: { type: 'NumberLiteral', value: '1' },
        alternate: { type: 'NumberLiteral', value: '2' },
      });
    });

    it('nested if', () => {
      const ast = expr('if a then if b then 1 else 2 else 3', new Set(['a', 'b']));
      expect(ast).toMatchObject({
        type: 'IfExpression',
        consequent: { type: 'IfExpression' },
      });
    });
  });

  describe('for expression', () => {
    it('simple for', () => {
      expect(expr('for x in [1,2,3] return x * 2')).toMatchObject({
        type: 'ForExpression',
        bindings: [{ name: 'x', domain: { type: 'ListLiteral' } }],
        body: { type: 'BinaryOp', op: '*' },
      });
    });

    it('for with range', () => {
      expect(expr('for i in 1..5 return i')).toMatchObject({
        type: 'ForExpression',
        bindings: [{ name: 'i', domain: { type: 'RangeLiteral' } }],
      });
    });

    it('nested for (two bindings)', () => {
      const ast = expr('for x in [1,2], y in [3,4] return x + y');
      expect(ast).toMatchObject({
        type: 'ForExpression',
        bindings: [{ name: 'x' }, { name: 'y' }],
      });
    });
  });

  describe('quantified expressions', () => {
    it('some', () => {
      expect(expr('some x in [1,2,3] satisfies x > 2')).toMatchObject({
        type: 'QuantifiedExpression',
        quantifier: 'some',
        bindings: [{ name: 'x' }],
        condition: { type: 'BinaryOp', op: '>' },
      });
    });

    it('every', () => {
      expect(expr('every x in [1,2,3] satisfies x > 0')).toMatchObject({
        type: 'QuantifiedExpression',
        quantifier: 'every',
      });
    });
  });

  describe('function definition', () => {
    it('simple function', () => {
      expect(expr('function(x) x + 1')).toMatchObject({
        type: 'FunctionDefinition',
        params: [{ name: 'x' }],
        body: { type: 'BinaryOp', op: '+' },
        external: false,
      });
    });

    it('multiple params', () => {
      expect(expr('function(a, b) a + b')).toMatchObject({
        type: 'FunctionDefinition',
        params: [{ name: 'a' }, { name: 'b' }],
      });
    });

    it('no params', () => {
      expect(expr('function() 42')).toMatchObject({
        type: 'FunctionDefinition',
        params: [],
      });
    });

    it('external function with body placeholder', () => {
      // external functions still parse a body expression after the `external` keyword
      expect(expr('function(x) external { "java.class": "com.example.Foo" }')).toMatchObject({
        type: 'FunctionDefinition',
        external: true,
        params: [{ name: 'x' }],
      });
    });

    it('typed param annotation is captured as string', () => {
      expect(expr('function(x: number) x * 2')).toMatchObject({
        type: 'FunctionDefinition',
        params: [{ name: 'x', type: 'number' }],
      });
    });
  });

  describe('function call', () => {
    it('simple call', () => {
      expect(expr('count([1,2,3])')).toMatchObject({
        type: 'FunctionCall',
        callee: { type: 'Identifier', name: 'count' },
        args: [{ value: { type: 'ListLiteral' } }],
      });
    });

    it('named argument', () => {
      expect(expr('substring(string: "hello", start position: 2)')).toMatchObject({
        type: 'FunctionCall',
        args: [{ name: 'string' }, { name: 'start position' }],
      });
    });

    it('multiple positional args', () => {
      expect(expr('string(1.23, 2)')).toMatchObject({
        type: 'FunctionCall',
        args: [{ value: { type: 'NumberLiteral' } }, { value: { type: 'NumberLiteral' } }],
      });
    });
  });

  describe('path expression', () => {
    it('simple path', () => {
      expect(expr('person.name', new Set(['person']))).toMatchObject({
        type: 'PathExpression',
        object: { type: 'Identifier', name: 'person' },
        path: 'name',
      });
    });

    it('chained path', () => {
      expect(expr('a.b.c', new Set(['a']))).toMatchObject({
        type: 'PathExpression',
        object: { type: 'PathExpression', path: 'b' },
        path: 'c',
      });
    });

    it('quoted path key (dot + string)', () => {
      expect(expr('ctx."my key"', new Set(['ctx']))).toMatchObject({
        type: 'PathExpression',
        path: 'my key',
      });
    });
  });

  describe('filter expression', () => {
    it('filter by value', () => {
      expect(expr('items[item > 0]', new Set(['items']))).toMatchObject({
        type: 'FilterExpression',
        list: { type: 'Identifier', name: 'items' },
        filter: { type: 'BinaryOp', op: '>' },
      });
    });

    it('filter by index', () => {
      expect(expr('[1,2,3][1]')).toMatchObject({
        type: 'FilterExpression',
        list: { type: 'ListLiteral' },
        filter: { type: 'NumberLiteral', value: '1' },
      });
    });
  });

  describe('range literal', () => {
    it('inclusive-inclusive [a..b]', () => {
      expect(expr('[1..10]')).toMatchObject({
        type: 'RangeLiteral',
        startIncluded: true,
        endIncluded: true,
        start: { type: 'NumberLiteral', value: '1' },
        end: { type: 'NumberLiteral', value: '10' },
      });
    });

    it('exclusive-inclusive (a..b]', () => {
      expect(expr('(1..10]')).toMatchObject({
        type: 'RangeLiteral',
        startIncluded: false,
        endIncluded: true,
      });
    });

    it('inclusive-exclusive [a..b)', () => {
      expect(expr('[1..10)')).toMatchObject({
        type: 'RangeLiteral',
        startIncluded: true,
        endIncluded: false,
      });
    });

    it('exclusive-exclusive (a..b)', () => {
      expect(expr('(1..10)')).toMatchObject({
        type: 'RangeLiteral',
        startIncluded: false,
        endIncluded: false,
      });
    });
  });

  describe('list literal', () => {
    it('empty list', () => {
      expect(expr('[]')).toMatchObject({ type: 'ListLiteral', elements: [] });
    });

    it('single element', () => {
      expect(expr('[1]')).toMatchObject({
        type: 'ListLiteral',
        elements: [{ type: 'NumberLiteral', value: '1' }],
      });
    });

    it('multiple elements', () => {
      expect(expr('[1, 2, 3]')).toMatchObject({
        type: 'ListLiteral',
        elements: [
          { type: 'NumberLiteral', value: '1' },
          { type: 'NumberLiteral', value: '2' },
          { type: 'NumberLiteral', value: '3' },
        ],
      });
    });

    it('mixed types', () => {
      expect(expr('[1, "a", true]')).toMatchObject({
        type: 'ListLiteral',
        elements: [
          { type: 'NumberLiteral' },
          { type: 'StringLiteral' },
          { type: 'BooleanLiteral' },
        ],
      });
    });
  });

  describe('context literal', () => {
    it('empty context', () => {
      expect(expr('{}')).toMatchObject({ type: 'ContextLiteral', entries: [] });
    });

    it('single entry', () => {
      expect(expr('{a: 1}')).toMatchObject({
        type: 'ContextLiteral',
        entries: [{ key: 'a', value: { type: 'NumberLiteral', value: '1' } }],
      });
    });

    it('multiple entries', () => {
      expect(expr('{a: 1, b: "hello"}')).toMatchObject({
        type: 'ContextLiteral',
        entries: [{ key: 'a' }, { key: 'b' }],
      });
    });

    it('string key', () => {
      expect(expr('{"my key": 42}')).toMatchObject({
        type: 'ContextLiteral',
        entries: [{ key: 'my key' }],
      });
    });

    it('nested context', () => {
      expect(expr('{a: {b: 1}}')).toMatchObject({
        type: 'ContextLiteral',
        entries: [{ value: { type: 'ContextLiteral' } }],
      });
    });
  });

  describe('instance of', () => {
    it('number', () => {
      expect(expr('1 instance of number')).toMatchObject({
        type: 'InstanceOf',
        value: { type: 'NumberLiteral' },
        targetType: { name: 'number' },
      });
    });

    it('string', () => {
      expect(expr('"x" instance of string')).toMatchObject({
        type: 'InstanceOf',
        targetType: { name: 'string' },
      });
    });

    it('boolean', () => {
      expect(expr('true instance of boolean')).toMatchObject({
        type: 'InstanceOf',
        targetType: { name: 'boolean' },
      });
    });

    it('date', () => {
      expect(expr('@"2024-01-01" instance of date')).toMatchObject({
        type: 'InstanceOf',
        targetType: { name: 'date' },
      });
    });

    it('list type', () => {
      expect(expr('[1] instance of list<number>')).toMatchObject({
        type: 'InstanceOf',
        targetType: { name: 'list', elementType: { name: 'number' } },
      });
    });

    it('context type', () => {
      expect(expr('{} instance of context')).toMatchObject({
        type: 'InstanceOf',
        targetType: { name: 'context' },
      });
    });

    it('Any type', () => {
      expect(expr('1 instance of Any')).toMatchObject({
        type: 'InstanceOf',
        targetType: { name: 'Any' },
      });
    });
  });

  describe('in expression', () => {
    it('in list', () => {
      expect(expr('1 in [1, 2, 3]')).toMatchObject({
        type: 'InExpression',
        value: { type: 'NumberLiteral', value: '1' },
        test: { type: 'ListLiteral' },
      });
    });

    it('in range', () => {
      expect(expr('5 in [1..10]')).toMatchObject({
        type: 'InExpression',
        test: { type: 'RangeLiteral' },
      });
    });
  });

  describe('between expression', () => {
    it('basic between', () => {
      expect(expr('5 between 1 and 10')).toMatchObject({
        type: 'BetweenExpression',
        value: { type: 'NumberLiteral', value: '5' },
        low: { type: 'NumberLiteral', value: '1' },
        high: { type: 'NumberLiteral', value: '10' },
      });
    });
  });

  describe('let expression', () => {
    it('basic let', () => {
      expect(expr('let x = 5 in x + 1')).toMatchObject({
        type: 'LetExpression',
        name: 'x',
        value: { type: 'NumberLiteral', value: '5' },
        body: { type: 'BinaryOp', op: '+' },
      });
    });
  });

  describe('pipeline expression', () => {
    it('basic pipeline', () => {
      expect(expr('[1,2,3] |> count(?)')).toMatchObject({
        type: 'PipelineExpression',
        left: { type: 'ListLiteral' },
        right: { type: 'FunctionCall' },
      });
    });
  });

  describe('unary test list', () => {
    it('single value', () => {
      const ast = unary('"A"');
      expect(ast).toMatchObject({
        type: 'UnaryTestList',
        tests: [{ type: 'StringLiteral', value: 'A' }],
        negated: false,
      });
    });

    it('comma-separated values', () => {
      const ast = unary('"A", "B", "C"');
      expect(ast).toMatchObject({
        type: 'UnaryTestList',
        tests: [{ type: 'StringLiteral' }, { type: 'StringLiteral' }, { type: 'StringLiteral' }],
      });
    });

    it('comparison test', () => {
      const ast = unary('> 10');
      expect(ast).toMatchObject({
        type: 'UnaryTestList',
        tests: [{ type: 'BinaryOp', op: '>' }],
      });
    });

    it('negated test (not(...))', () => {
      // The outer UnaryTestList wraps the inner negated one
      const ast = unary('not("A")');
      expect(ast).toMatchObject({
        type: 'UnaryTestList',
        negated: false,
        tests: [
          { type: 'UnaryTestList', negated: true, tests: [{ type: 'StringLiteral', value: 'A' }] },
        ],
      });
    });

    it('wildcard -', () => {
      // Wildcard matches everything; represented as an empty test list
      const ast = unary('-');
      expect(ast).toMatchObject({
        type: 'UnaryTestList',
        tests: [],
      });
    });

    it('range test', () => {
      const ast = unary('[1..10]');
      expect(ast).toMatchObject({
        type: 'UnaryTestList',
        tests: [{ type: 'RangeLiteral' }],
      });
    });
  });

  describe('complex expressions', () => {
    it('nested function calls', () => {
      expect(expr('string(count([1,2,3]))')).toMatchObject({
        type: 'FunctionCall',
        callee: { type: 'Identifier', name: 'string' },
        args: [{ value: { type: 'FunctionCall', callee: { name: 'count' } } }],
      });
    });

    it('path on function result', () => {
      expect(expr('today().year')).toMatchObject({
        type: 'PathExpression',
        object: { type: 'FunctionCall' },
        path: 'year',
      });
    });

    it('filter on function result', () => {
      expect(expr('items(ctx)[item > 0]', new Set(['ctx']))).toMatchObject({
        type: 'FilterExpression',
        list: { type: 'FunctionCall' },
      });
    });

    it('chained path and filter', () => {
      expect(expr('order.items[item.qty > 0]', new Set(['order']))).toMatchObject({
        type: 'FilterExpression',
        list: { type: 'PathExpression' },
      });
    });

    it('filter result then path — Employees[dept=20].name', () => {
      expect(expr('Employees[dept = 20].name', new Set(['Employees']))).toMatchObject({
        type: 'PathExpression',
        object: { type: 'FilterExpression' },
        path: 'name',
      });
    });

    it('null navigation — null.b returns PathExpression', () => {
      expect(expr('null.b')).toMatchObject({
        type: 'PathExpression',
        object: { type: 'NullLiteral' },
        path: 'b',
      });
    });
  });

  // ── knownNames behavior ────────────────────────────────────────────────────
  describe('knownNames — multi-word name resolution', () => {
    it('with knownNames: "Full Name" parses as single identifier', () => {
      expect(expr('Full Name', new Set(['Full Name']))).toMatchObject({
        type: 'Identifier',
        name: 'Full Name',
      });
    });

    it('without knownNames: "Full" is parsed as the identifier', () => {
      // Parser stops at the first word when the multi-word name is not declared
      const ast = expr('Full', new Set());
      expect(ast).toMatchObject({ type: 'Identifier', name: 'Full' });
    });

    it('multi-word name used in expression', () => {
      expect(expr('"Hello " + Full Name', new Set(['Full Name']))).toMatchObject({
        type: 'BinaryOp',
        op: '+',
        right: { type: 'Identifier', name: 'Full Name' },
      });
    });

    it('multiple multi-word names', () => {
      expect(
        expr('Order Date + Shipping Days', new Set(['Order Date', 'Shipping Days'])),
      ).toMatchObject({
        type: 'BinaryOp',
        op: '+',
        left: { type: 'Identifier', name: 'Order Date' },
        right: { type: 'Identifier', name: 'Shipping Days' },
      });
    });
  });

  // ── All FeelType variants in instance of ──────────────────────────────────
  describe('instance of — all FeelType variants', () => {
    it('time', () => {
      expect(expr('"foo" instance of time')).toMatchObject({
        type: 'InstanceOf',
        targetType: { name: 'time' },
      });
    });

    it('date and time', () => {
      expect(expr('"foo" instance of date and time')).toMatchObject({
        type: 'InstanceOf',
        targetType: { name: 'date and time' },
      });
    });

    it('days and time duration', () => {
      expect(expr('"foo" instance of days and time duration')).toMatchObject({
        type: 'InstanceOf',
        targetType: { name: 'days and time duration' },
      });
    });

    it('years and months duration', () => {
      expect(expr('"foo" instance of years and months duration')).toMatchObject({
        type: 'InstanceOf',
        targetType: { name: 'years and months duration' },
      });
    });

    it('Null', () => {
      expect(expr('null instance of Null')).toMatchObject({
        type: 'InstanceOf',
        targetType: { name: 'Null' },
      });
    });

    it('list<Any>', () => {
      expect(expr('[1] instance of list<Any>')).toMatchObject({
        type: 'InstanceOf',
        targetType: { name: 'list', elementType: { name: 'Any' } },
      });
    });

    it('list<string>', () => {
      expect(expr('["a"] instance of list<string>')).toMatchObject({
        type: 'InstanceOf',
        targetType: { name: 'list', elementType: { name: 'string' } },
      });
    });

    it('context<>', () => {
      expect(expr('{} instance of context<>')).toMatchObject({
        type: 'InstanceOf',
        targetType: { name: 'context' },
      });
    });

    it('function<>->Any', () => {
      expect(expr('(function() "foo") instance of function<>->Any')).toMatchObject({
        type: 'InstanceOf',
        targetType: { name: 'function', returnType: { name: 'Any' } },
      });
    });

    it('function<>->string', () => {
      expect(expr('(function() "foo") instance of function<>->string')).toMatchObject({
        type: 'InstanceOf',
        targetType: { name: 'function', returnType: { name: 'string' } },
      });
    });

    it('function<string, number>->string', () => {
      expect(
        expr('(function(a: string, b: number) "foo") instance of function<string, number>->string'),
      ).toMatchObject({
        type: 'InstanceOf',
        targetType: {
          name: 'function',
          paramTypes: [{ name: 'string' }, { name: 'number' }],
          returnType: { name: 'string' },
        },
      });
    });

    it('user-defined type ref (Unknown)', () => {
      expect(expr('"foo" instance of tFooBar')).toMatchObject({
        type: 'InstanceOf',
        targetType: { name: 'Unknown', ref: 'tFooBar' },
      });
    });
  });

  // ── Temporal literals (@ syntax) ─────────────────────────────────────────
  describe('temporal literals (@-syntax) variants', () => {
    it('date', () => {
      expect(expr('@"2019-03-31"')).toMatchObject({
        type: 'TemporalLiteral',
        value: '2019-03-31',
      });
    });

    it('date-time (no timezone)', () => {
      expect(expr('@"2018-12-08T10:30:11"')).toMatchObject({
        type: 'TemporalLiteral',
        value: '2018-12-08T10:30:11',
      });
    });

    it('date-time with IANA timezone', () => {
      expect(expr('@"2018-12-08T10:30:11@Australia/Melbourne"')).toMatchObject({
        type: 'TemporalLiteral',
        value: '2018-12-08T10:30:11@Australia/Melbourne',
      });
    });

    it('date-time with UTC offset', () => {
      expect(expr('@"2018-12-08T10:30:11+11:00"')).toMatchObject({
        type: 'TemporalLiteral',
        value: '2018-12-08T10:30:11+11:00',
      });
    });

    it('time', () => {
      expect(expr('@"10:30:11"')).toMatchObject({
        type: 'TemporalLiteral',
        value: '10:30:11',
      });
    });

    it('time with UTC offset', () => {
      expect(expr('@"10:30:11+05:00"')).toMatchObject({
        type: 'TemporalLiteral',
        value: '10:30:11+05:00',
      });
    });

    it('days and time duration', () => {
      expect(expr('@"P10D"')).toMatchObject({ type: 'TemporalLiteral', value: 'P10D' });
    });

    it('years and months duration', () => {
      expect(expr('@"P10Y"')).toMatchObject({ type: 'TemporalLiteral', value: 'P10Y' });
    });

    it('@-literal used in instance of', () => {
      expect(expr('@"2019-03-31" instance of date')).toMatchObject({
        type: 'InstanceOf',
        value: { type: 'TemporalLiteral' },
        targetType: { name: 'date' },
      });
    });

    it('@-literal passed to function call', () => {
      expect(expr('string(@"2018-12-08T10:30:11@Australia/Melbourne")')).toMatchObject({
        type: 'FunctionCall',
        args: [{ value: { type: 'TemporalLiteral' } }],
      });
    });
  });

  // ── For expression — TCK variants ─────────────────────────────────────────
  describe('for expression — TCK variants', () => {
    it('descending numeric range', () => {
      expect(expr('for i in 4..2 return i')).toMatchObject({
        type: 'ForExpression',
        bindings: [{ name: 'i', domain: { type: 'RangeLiteral' } }],
      });
    });

    it('negative range', () => {
      expect(expr('for i in -1..1 return i')).toMatchObject({
        type: 'ForExpression',
      });
    });

    it('partial results reference', () => {
      expect(expr('for i in 0..4 return if i = 0 then 1 else i * partial[-1]')).toMatchObject({
        type: 'ForExpression',
        body: { type: 'IfExpression' },
      });
    });

    it('date range', () => {
      expect(expr('for i in @"1980-01-01"..@"1980-01-03" return i')).toMatchObject({
        type: 'ForExpression',
        bindings: [
          {
            name: 'i',
            domain: {
              type: 'RangeLiteral',
              start: { type: 'TemporalLiteral' },
              end: { type: 'TemporalLiteral' },
            },
          },
        ],
      });
    });

    it('empty list iteration', () => {
      expect(expr('for i in [] return i')).toMatchObject({
        type: 'ForExpression',
        bindings: [{ name: 'i', domain: { type: 'ListLiteral', elements: [] } }],
      });
    });

    it('nested for: for x in [[1,2],[3,4]], y in x return y', () => {
      expect(expr('for x in [[1,2],[3,4]], y in x return y')).toMatchObject({
        type: 'ForExpression',
        bindings: [{ name: 'x' }, { name: 'y' }],
      });
    });

    it('range with computed bounds: 1+1..1+3', () => {
      expect(expr('for i in 1+1..1+3 return i')).toMatchObject({
        type: 'ForExpression',
        bindings: [
          { name: 'i', domain: { type: 'RangeLiteral', start: { type: 'BinaryOp', op: '+' } } },
        ],
      });
    });
  });

  // ── Context — special/edge cases ─────────────────────────────────────────
  describe('context — edge cases', () => {
    it('string key with special characters', () => {
      expect(expr('{"foo+bar((!!],foo": "foo"}')).toMatchObject({
        type: 'ContextLiteral',
        entries: [{ key: 'foo+bar((!!],foo' }],
      });
    });

    it('empty string key', () => {
      expect(expr('{"": "foo"}')).toMatchObject({
        type: 'ContextLiteral',
        entries: [{ key: '' }],
      });
    });

    it('deeply nested context', () => {
      expect(expr('{a: "foo", b: {c: "bar", d: {e: "baz"}}}')).toMatchObject({
        type: 'ContextLiteral',
        entries: [
          { key: 'a' },
          {
            key: 'b',
            value: {
              type: 'ContextLiteral',
              entries: [{ key: 'c' }, { key: 'd', value: { type: 'ContextLiteral' } }],
            },
          },
        ],
      });
    });

    it('forward reference: b uses a', () => {
      expect(expr('{a: 1 + 2, b: a + 3}')).toMatchObject({
        type: 'ContextLiteral',
        entries: [
          { key: 'a' },
          {
            key: 'b',
            value: { type: 'BinaryOp', op: '+', left: { type: 'Identifier', name: 'a' } },
          },
        ],
      });
    });

    it('property access on literal: { a: 1 }.a', () => {
      expect(expr('{ a: 1 }.a')).toMatchObject({
        type: 'PathExpression',
        object: { type: 'ContextLiteral' },
        path: 'a',
      });
    });
  });

  // ── Quantified expressions — path variants ────────────────────────────────
  describe('quantified expressions — path variants', () => {
    it('every with path in domain', () => {
      expect(
        expr('every i in priceTable satisfies i.price > 10', new Set(['priceTable'])),
      ).toMatchObject({
        type: 'QuantifiedExpression',
        quantifier: 'every',
        bindings: [{ name: 'i' }],
        condition: {
          type: 'BinaryOp',
          op: '>',
          left: { type: 'PathExpression', path: 'price' },
        },
      });
    });

    it('some with function call in condition', () => {
      expect(expr('some i in items satisfies i.qty > 0', new Set(['items']))).toMatchObject({
        type: 'QuantifiedExpression',
        quantifier: 'some',
        condition: { type: 'BinaryOp', op: '>' },
      });
    });
  });

  // ── Unary test list — TCK decision table patterns ─────────────────────────
  describe('unary test list — decision table input entry patterns', () => {
    it('comparison: >=18', () => {
      const ast = unary('>=18');
      expect(ast).toMatchObject({
        type: 'UnaryTestList',
        tests: [{ type: 'BinaryOp', op: '>=' }],
      });
    });

    it('comparison: <18', () => {
      const ast = unary('<18');
      expect(ast).toMatchObject({ type: 'UnaryTestList', tests: [{ type: 'BinaryOp', op: '<' }] });
    });

    it('comma-separated strings: "Medium","Low"', () => {
      const ast = unary('"Medium","Low"');
      expect(ast).toMatchObject({
        type: 'UnaryTestList',
        tests: [
          { type: 'StringLiteral', value: 'Medium' },
          { type: 'StringLiteral', value: 'Low' },
        ],
      });
    });

    it('boolean literal: true', () => {
      const ast = unary('true');
      expect(ast).toMatchObject({
        type: 'UnaryTestList',
        tests: [{ type: 'BooleanLiteral', value: true }],
      });
    });

    it('boolean literal: false', () => {
      const ast = unary('false');
      expect(ast).toMatchObject({
        type: 'UnaryTestList',
        tests: [{ type: 'BooleanLiteral', value: false }],
      });
    });

    it('single string value: "High"', () => {
      const ast = unary('"High"');
      expect(ast).toMatchObject({
        type: 'UnaryTestList',
        tests: [{ type: 'StringLiteral', value: 'High' }],
      });
    });

    it('range: [1..10]', () => {
      const ast = unary('[1..10]');
      expect(ast).toMatchObject({
        type: 'UnaryTestList',
        tests: [{ type: 'RangeLiteral', startIncluded: true, endIncluded: true }],
      });
    });

    it('exclusive range: (1..10)', () => {
      const ast = unary('(1..10)');
      expect(ast).toMatchObject({
        type: 'UnaryTestList',
        tests: [{ type: 'RangeLiteral', startIncluded: false, endIncluded: false }],
      });
    });

    it('not with string list: not("A","B")', () => {
      const ast = unary('not("A","B")');
      expect(ast).toMatchObject({
        type: 'UnaryTestList',
        tests: [{ type: 'UnaryTestList', negated: true }],
      });
    });

    it('mixed: >=10, <20', () => {
      const ast = unary('>=10, <20');
      expect(ast).toMatchObject({
        type: 'UnaryTestList',
        tests: [
          { type: 'BinaryOp', op: '>=' },
          { type: 'BinaryOp', op: '<' },
        ],
      });
    });

    it('number literal', () => {
      const ast = unary('42');
      expect(ast).toMatchObject({
        type: 'UnaryTestList',
        tests: [{ type: 'NumberLiteral', value: '42' }],
      });
    });
  });

  // ── Function call edge cases ──────────────────────────────────────────────
  describe('function call — edge cases', () => {
    it('no arguments', () => {
      expect(expr('today()')).toMatchObject({
        type: 'FunctionCall',
        callee: { type: 'Identifier', name: 'today' },
        args: [],
      });
    });

    it('named arguments with multi-word name', () => {
      expect(
        expr('years and months duration(from: d1, to: d2)', new Set(['d1', 'd2'])),
      ).toMatchObject({
        type: 'FunctionCall',
        args: [{ name: 'from' }, { name: 'to' }],
      });
    });

    it('function on path result: today().year', () => {
      expect(expr('today().year')).toMatchObject({
        type: 'PathExpression',
        object: { type: 'FunctionCall', callee: { name: 'today' } },
        path: 'year',
      });
    });

    it('non-identifier callee: "abs"(-1)', () => {
      // Calling a string as a function — valid FEEL syntax at parse level
      expect(expr('"abs"(-1)')).toMatchObject({
        type: 'FunctionCall',
        callee: { type: 'StringLiteral', value: 'abs' },
      });
    });
  });

  // ── Pipeline expression ───────────────────────────────────────────────────
  describe('pipeline expression', () => {
    it('list |> count', () => {
      expect(expr('[1,2,3] |> count(?)')).toMatchObject({
        type: 'PipelineExpression',
        left: { type: 'ListLiteral' },
        right: { type: 'FunctionCall', callee: { name: 'count' } },
      });
    });

    it('chained pipeline', () => {
      expect(expr('[1,-2,3] |> abs(?) |> string(?)')).toMatchObject({
        type: 'PipelineExpression',
        left: {
          type: 'PipelineExpression',
          left: { type: 'ListLiteral' },
        },
        right: { type: 'FunctionCall', callee: { name: 'string' } },
      });
    });
  });

  // ── Let expression ────────────────────────────────────────────────────────
  describe('let expression — variants', () => {
    it('let with complex body', () => {
      expect(expr('let x = 5 in if x > 3 then "big" else "small"')).toMatchObject({
        type: 'LetExpression',
        name: 'x',
        body: { type: 'IfExpression' },
      });
    });

    it('let with function call body', () => {
      expect(expr('let result = count([1,2,3]) in result * 2')).toMatchObject({
        type: 'LetExpression',
        name: 'result',
        value: { type: 'FunctionCall' },
        body: { type: 'BinaryOp', op: '*' },
      });
    });
  });
});
