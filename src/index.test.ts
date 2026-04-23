/**
 * TCK coverage — parse-only.
 *
 * Each case is a FEEL string (input) that must parse without throwing.
 * Strings are drawn from OMG TCK groups (compliance-level-2 and 3).
 * No files are read at runtime — all cases are hardcoded here.
 *
 * Groups comprehensively covered by language.test.ts have been removed;
 * this file focuses on patterns unique to DMN decision table usage,
 * named-parameter calls, edge cases, and structural variants.
 *
 * Evaluation correctness is tested in @veridtools/feel-runner.
 */
import { describe, expect, it } from 'vitest';
import { parse } from './index.js';

function ok(
  expression: string,
  knownNames: string[] = [],
  dialect: 'expression' | 'unary-tests' = 'expression',
) {
  expect(() => parse(expression, dialect, new Set(knownNames))).not.toThrow();
}

// ── Input data / string (0001) ────────────────────────────────────────────
describe('input data — string', () => {
  it('"Hello " + Full Name', () => ok('"Hello " + Full Name', ['Full Name']));
  it('string concatenation with variable', () => ok('"Dear " + Name', ['Name']));
});

// ── Input data — number (0002) ────────────────────────────────────────────
describe('input data — number', () => {
  it('Monthly Salary * 12', () => ok('Monthly Salary * 12', ['Monthly Salary']));
  it('arithmetic on two inputs', () => ok('a + b', ['a', 'b']));
});

// ── String allowed values (0003) ──────────────────────────────────────────
describe('string allowed values', () => {
  it('unary: "Declined","Approved"', () => ok('"Declined","Approved"', [], 'unary-tests'));
  it('unary: not("Declined")', () => ok('not("Declined")', [], 'unary-tests'));
});

// ── Simple tables — unary test patterns (0004–0007) ───────────────────────
describe('decision table — unary test input entries', () => {
  it('>=18', () => ok('>=18', ['Age'], 'unary-tests'));
  it('<18', () => ok('<18', ['Age'], 'unary-tests'));
  it('-', () => ok('-', [], 'unary-tests'));
  it('"Medium","Low"', () => ok('"Medium","Low"', [], 'unary-tests'));
  it('true', () => ok('true', [], 'unary-tests'));
  it('false', () => ok('false', [], 'unary-tests'));
  it('"High"', () => ok('"High"', [], 'unary-tests'));
  it('[18..65]', () => ok('[18..65]', [], 'unary-tests'));
  it('(0..100]', () => ok('(0..100]', [], 'unary-tests'));
  it('>=0, <=100', () => ok('>=0, <=100', [], 'unary-tests'));
  it('not("High","Medium")', () => ok('not("High","Medium")', [], 'unary-tests'));
  it('null', () => ok('null', [], 'unary-tests'));
  it('42', () => ok('42', [], 'unary-tests'));
});

// ── Filter / path (level-3 0001) ──────────────────────────────────────────
describe('filter and path expressions', () => {
  it('Employees[dept = 20].name', () => ok('Employees[dept = 20].name', ['Employees']));
  it('items[item > 0]', () => ok('items[item > 0]', ['items']));
  it('[1,2,3][1]', () => ok('[1,2,3][1]'));
  it('list[item = "a"]', () => ok('list[item = "a"]', ['list']));
  it('null.b', () => ok('null.b'));
  it('person.name', () => ok('person.name', ['person']));
  it('order.lines.amount', () => ok('order.lines.amount', ['order']));
});

// ── Properties / path (level-3 0074) ─────────────────────────────────────
describe('path properties', () => {
  it('date("2024-06-15").year', () => ok('date("2024-06-15").year'));
  it('date("2024-06-15").month', () => ok('date("2024-06-15").month'));
  it('date("2024-06-15").day', () => ok('date("2024-06-15").day'));
  it('time("10:30:00").hour', () => ok('time("10:30:00").hour'));
  it('duration("P1Y2M").years', () => ok('duration("P1Y2M").years'));
  it('duration("P1DT2H").days', () => ok('duration("P1DT2H").days'));
});

// ── Exponent / ** (level-3 0075) ──────────────────────────────────────────
describe('exponentiation', () => {
  it('2 ** 10', () => ok('2 ** 10'));
  it('2 ** 0', () => ok('2 ** 0'));
  it('2 ** -1', () => ok('2 ** -1'));
  it('2 ** 3 ** 2', () => ok('2 ** 3 ** 2'));
  it('(2 ** 3) ** 2', () => ok('(2 ** 3) ** 2'));
  it('(-2) ** 3', () => ok('(-2) ** 3'));
});

// ── NaN / infinity edge cases (0077–0078) ─────────────────────────────────
describe('numeric edge cases', () => {
  it('0.0 / 0.0', () => ok('0.0 / 0.0'));
  it('1.0 / 0.0', () => ok('1.0 / 0.0'));
  it('-1.0 / 0.0', () => ok('-1.0 / 0.0'));
});

// ── get value / get entries — variant forms (0080–0081) ───────────────────
describe('context access functions', () => {
  it('get value({a: "foo"}, "a")', () => ok('get value({a: "foo"}, "a")'));
  it('get value(m: {a: "foo"}, key: "a")', () => ok('get value(m: {a: "foo"}, key: "a")'));
  it('get entries({a: 1, b: 2})', () => ok('get entries({a: 1, b: 2})'));
});

// ── Unicode (0083) ────────────────────────────────────────────────────────
describe('unicode', () => {
  it('string length("€£¥")', () => ok('string length("€£¥")'));
  it('"Ångström" = "Ångström"', () => ok('"Ångström" = "Ångström"'));
  it('lower case("ÄÖÜ")', () => ok('lower case("ÄÖÜ")'));
});

// ── Arithmetic negation (0099) ────────────────────────────────────────────
describe('arithmetic negation', () => {
  it('-1', () => ok('-1'));
  it('-(1)', () => ok('-(1)'));
  it('-(-1)', () => ok('-(-1)'));
  it('-(1 + 2)', () => ok('-(1 + 2)'));
  it('-duration("P1D")', () => ok('-duration("P1D")'));
});

// ── Range literals as expression-dialect values (1156) ───────────────────
describe('range literals and range function', () => {
  it('[1..10] as expression', () => ok('[1..10]'));
  it('(1..10) as expression', () => ok('(1..10)'));
  it('[1..10) as expression', () => ok('[1..10)'));
  it('(1..10] as expression', () => ok('(1..10]'));
  it('range("[") — range() builtin', () => ok('range("[")'));
  it('before([1..5], [6..10]) — range-range', () => ok('before([1..5], [6..10])'));
  it('after([6..10], [1..5]) — range-range', () => ok('after([6..10], [1..5])'));
  it('within([2..8], [1..10]) — range inside range', () => ok('within([2..8], [1..10])'));
  it('includes([1..10], [3..7]) — range contains range', () => ok('includes([1..10], [3..7])'));
  it('starts with([1..10], [1..5]) — range-range', () => ok('starts with([1..10], [1..5])'));
  it('ends with([1..10], [5..10]) — range-range', () => ok('ends with([1..10], [5..10])'));
});

// ── Lambda / function definitions (0092) ─────────────────────────────────
describe('lambda expressions', () => {
  it('function(a: number) 1 + a', () => ok('function(a: number) 1 + a'));
  it('function(a, b) a * b', () => ok('function(a, b) a * b'));
  it('IIFE with two args', () => ok('(function(a, b, c) a + b + c)(1, 2, 3)'));
});

// ── Pipeline (|>) ─────────────────────────────────────────────────────────
describe('pipeline expressions', () => {
  it('[1,2,3] |> count(?)', () => ok('[1,2,3] |> count(?)'));
  it('"hello" |> upper case(?)', () => ok('"hello" |> upper case(?)'));
  it('[1,-2,3] |> abs(?) |> string(?)', () => ok('[1,-2,3] |> abs(?) |> string(?)'));
});

// ── Let expressions ───────────────────────────────────────────────────────
describe('let expressions', () => {
  it('let tax = 0.2 in 100 * (1 + tax)', () => ok('let tax = 0.2 in 100 * (1 + tax)'));
  it('let items = [1,2,3,4] in sum(items[item > 2])', () =>
    ok('let items = [1,2,3,4] in sum(items[item > 2])'));
  it('let base = 100 in let discount = 0.1 in base * (1 - discount)', () =>
    ok('let base = 100 in let discount = 0.1 in base * (1 - discount)'));
});

// ── Boxed expression types (1150–1154, 1161) ──────────────────────────────
describe('boxed expressions', () => {
  it('if condition then "yes" else "no"', () =>
    ok('if condition then "yes" else "no"', ['condition']));
  it('items[price > 10]', () => ok('items[price > 10]', ['items']));
  it('for x in list return x * 2', () => ok('for x in list return x * 2', ['list']));
  it('some x in list satisfies x > 0', () => ok('some x in list satisfies x > 0', ['list']));
  it('every x in list satisfies x > 0', () => ok('every x in list satisfies x > 0', ['list']));
});

// ── context() — list-of-entries form (1145) ───────────────────────────────
describe('context() function', () => {
  it('context([{"key": "a", "value": 1}])', () => ok('context([{"key": "a", "value": 1}])'));
  it('context([{"key": "x", "value": [1,2,3]}, {"key": "y", "value": true}])', () =>
    ok('context([{"key": "x", "value": [1,2,3]}, {"key": "y", "value": true}])'));
  it('context put(context: {}, key: ["nested", "path"], value: 42)', () =>
    ok('context put(context: {}, key: ["nested", "path"], value: 42)'));
});

// ── Level-2 gaps ──────────────────────────────────────────────────────────

describe('number literals — edge cases (0101–0102, 0105)', () => {
  it('.872 — leading decimal point', () => ok('.872'));
  it('-.872 — negative leading decimal', () => ok('-.872'));
  it('125.4321987654 — extended precision', () => ok('125.4321987654'));
  it('-125.4321987654', () => ok('-125.4321987654'));
  it('1.2*10**3 — scientific via exponent', () => ok('1.2*10**3'));
  it('10+5 — no spaces', () => ok('10+5'));
  it('-10*-5', () => ok('-10*-5'));
  it('-10+-5', () => ok('-10+-5'));
  it('-10--5', () => ok('-10--5'));
  it('-10/-5', () => ok('-10/-5'));
  it('10**-5 — exponent with negation', () => ok('10**-5'));
  it('5+2**(5+3)', () => ok('5+2**(5+3)'));
  it('(10+20)/0', () => ok('(10+20)/0'));
});

describe('string literals — edge cases (0102)', () => {
  it('"foo bar" — space in string', () => ok('"foo bar"'));
  it('"šomeÚnicodeŠtriňg" — unicode chars', () => ok('"šomeÚnicodeŠtriňg"'));
  it('very long string', () =>
    ok(
      '"thisIsSomeLongStringThatMustBeProcessedSoHopefullyThisTestPassWithItAndIMustWriteSomethingMoreSoItIsLongerAndLongerAndLongerAndLongerAndLongerTillItIsReallyLong"',
    ));
  it('"col1\\tcol2" — tab escape', () => ok('"col1\tcol2"'));
  it('"line1\\nline2" — newline escape', () => ok('"line1\nline2"'));
  it('"say \\"hi\\"" — escaped quotes', () => ok('"say \\"hi\\""'));
  it('"\\u0041" — unicode escape', () => ok('"\\u0041"'));
});

describe('invocation arithmetic (0008–0009)', () => {
  it('complex mortgage formula', () =>
    ok('(loan.principal*loan.rate/12)/(1-(1+loan.rate/12)**-loan.termMonths)', ['loan']));
  it('function result + variable', () =>
    ok('PMT(Loan.amount, Loan.rate, Loan.term) + fee', ['Loan', 'fee']));
  it('12 * Monthly Salary', () => ok('12 * Monthly Salary', ['Monthly Salary']));
  it('Monthly Salary / 12', () => ok('Monthly Salary / 12', ['Monthly Salary']));
});

// ── Named parameter function calls ────────────────────────────────────────

describe('named parameter function calls', () => {
  it('contains(string: "foobar", match: "b")', () => ok('contains(string: "foobar", match: "b")'));
  it('substring(string: "hello", start position: 2)', () =>
    ok('substring(string: "hello", start position: 2)'));
  it('substring(string: "hello", start position: 2, length: 2)', () =>
    ok('substring(string: "hello", start position: 2, length: 2)'));
  it('ceiling(n: 1.5, scale: 1)', () => ok('ceiling(n: 1.5, scale: 1)'));
  it('floor(n: 1.5, scale: 1)', () => ok('floor(n: 1.5, scale: 1)'));
  it('decimal(n: 1.115, scale: 2)', () => ok('decimal(n: 1.115, scale: 2)'));
  it('round up(n: 1.5, scale: 0)', () => ok('round up(n: 1.5, scale: 0)'));
  it('round down(n: 1.5, scale: 0)', () => ok('round down(n: 1.5, scale: 0)'));
  it('round half up(n: 1.5, scale: 0)', () => ok('round half up(n: 1.5, scale: 0)'));
  it('round half down(n: 1.5, scale: 0)', () => ok('round half down(n: 1.5, scale: 0)'));
  it('abs(n: -1)', () => ok('abs(n: -1)'));
  it('modulo(dividend: 10, divisor: 3)', () => ok('modulo(dividend: 10, divisor: 3)'));
  it('get value(m: {a: 1}, key: "a")', () => ok('get value(m: {a: 1}, key: "a")'));
  it('get entries(m: {a: 1})', () => ok('get entries(m: {a: 1})'));
  it('context put(context: {}, key: "a", value: 1)', () =>
    ok('context put(context: {}, key: "a", value: 1)'));
  it('context put(context: {}, key: ["y","a"], value: 2)', () =>
    ok('context put(context: {}, key: ["y","a"], value: 2)'));
  it('context merge(contexts: [{a: 1}, {b: 2}])', () =>
    ok('context merge(contexts: [{a: 1}, {b: 2}])'));
  it('years and months duration(from: date("2011-12-22"), to: date("2013-08-24"))', () =>
    ok('years and months duration(from: date("2011-12-22"), to: date("2013-08-24"))'));
  it('string join(list: ["a","b"], delimiter: ",")', () =>
    ok('string join(list: ["a","b"], delimiter: ",")'));
  it('split(string: "a,b,c", delimiter: ",")', () => ok('split(string: "a,b,c", delimiter: ",")'));
  it('sort(list: [3,1,2], precedes: function(x,y) x < y)', () =>
    ok('sort(list: [3,1,2], precedes: function(x,y) x < y)'));
  it('is(x: null, y: null)', () => ok('is(x: null, y: null)'));
  it('list replace(list: [1,2,3], position: 2, newItem: 9)', () =>
    ok('list replace(list: [1,2,3], position: 2, newItem: 9)'));
  it('day of year(date: date("2024-01-15"))', () => ok('day of year(date: date("2024-01-15"))'));
  it('week of year(date: date("2024-01-15"))', () => ok('week of year(date: date("2024-01-15"))'));
});

// ── In expression with unary test right-hand side ─────────────────────────

describe('in expression — unary test as right-hand side', () => {
  it('1 in < 10', () => ok('1 in < 10'));
  it('1 in > 0', () => ok('1 in > 0'));
  it('1 in >= 1', () => ok('1 in >= 1'));
  it('1 in <= 10', () => ok('1 in <= 10'));
  it('1 in != 5', () => ok('1 in != 5'));
  it('"a" in < "b"', () => ok('"a" in < "b"'));
  it('"a" in >= "b"', () => ok('"a" in >= "b"'));
  it('"a" in = "b"', () => ok('"a" in = "b"'));
  it('"a" in != "b"', () => ok('"a" in != "b"'));
  it('x in < 10, > 5', () => ok('x in < 10, > 5', ['x']));
  it('"b" in [["f".."h"], ["a".."c"]]', () => ok('"b" in [["f".."h"], ["a".."c"]]'));
  it('null in [1..10]', () => ok('null in [1..10]'));
});

// ── Ranges with null endpoints ────────────────────────────────────────────

describe('ranges with null endpoints', () => {
  it('5 in (null..10]', () => ok('5 in (null..10]'));
  it('5 in [null..10]', () => ok('5 in [null..10]'));
  it('5 in [1..null)', () => ok('5 in [1..null)'));
  it('5 in [null..null]', () => ok('5 in [null..null]'));
  it('(< 10) = (null..10)', () => ok('(< 10) = (null..10)'));
  it('(> 10) = (10..null)', () => ok('(> 10) = (10..null)'));
});

// ── Type coercion — parser must accept, evaluator handles semantics ────────

describe('type coercion expressions (parser accepts all)', () => {
  it('"10" * "10"', () => ok('"10" * "10"'));
  it('"10" + 10', () => ok('"10" + 10'));
  it('"10" - 10', () => ok('"10" - 10'));
  it('"10" / 10', () => ok('"10" / 10'));
  it('"10" ** 10', () => ok('"10" ** 10'));
  it('10 * "10"', () => ok('10 * "10"'));
  it('10 + "10"', () => ok('10 + "10"'));
  it('"10" + @"2021-01-01"', () => ok('"10" + @"2021-01-01"'));
  it('1.5 * @"P4DT1H"', () => ok('1.5 * @"P4DT1H"'));
  it('10 * @"-P1D"', () => ok('10 * @"-P1D"'));
});

// ── Temporal literals in arithmetic ──────────────────────────────────────

describe('temporal literals in arithmetic', () => {
  it('-@"P1D" — negated duration', () => ok('-@"P1D"'));
  it('-@"P1Y" — negated year-month duration', () => ok('-@"P1Y"'));
  it('@"P1D" + @"P2D"', () => ok('@"P1D" + @"P2D"'));
  it('@"2024-01-15" - @"2024-01-10"', () => ok('@"2024-01-15" - @"2024-01-10"'));
  it('@"2024-01-01" + @"P1D"', () => ok('@"2024-01-01" + @"P1D"'));
  it('10 * @"P1D"', () => ok('10 * @"P1D"'));
  it('@"P2D" / 2', () => ok('@"P2D" / 2'));
});

// ── Temporal functions — extreme / edge case inputs ───────────────────────

describe('date and time — extreme and edge case inputs', () => {
  it('date and time("+99999-12-01T11:22:33")', () => ok('date and time("+99999-12-01T11:22:33")'));
  it('date and time("-2017-12-31T11:22:33")', () => ok('date and time("-2017-12-31T11:22:33")'));
  it('date and time("2017-12-31T11:22:33.456+01:35")', () =>
    ok('date and time("2017-12-31T11:22:33.456+01:35")'));
  it('date and time("2011-12-03T10:15:30+01:00@Europe/Paris")', () =>
    ok('date and time("2011-12-03T10:15:30+01:00@Europe/Paris")'));
  it('date and time("") — empty string', () => ok('date and time("")'));
  it('date and time("11:00:00") — time only', () => ok('date and time("11:00:00")'));
  it('date and time("2012-12-24") — date only', () => ok('date and time("2012-12-24")'));
  it('date and time("2017-00-10T11:22:33") — month=0', () =>
    ok('date and time("2017-00-10T11:22:33")'));
});

// ── Complex filter expressions ────────────────────────────────────────────

describe('complex filter expressions', () => {
  it('[1,2,3,4][item > 2]', () => ok('[1,2,3,4][item > 2]'));
  it('[{x:1},{x:2},{x:3}][x > 1]', () => ok('[{x:1},{x:2},{x:3}][x > 1]'));
  it('[{x:1,y:2},{x:null,y:3}][x < 2]', () => ok('[{x:1,y:2},{x:null,y:3}][x < 2]'));
  it('[{x:1}][y > 1] — filter on missing property', () => ok('[{x:1}][y > 1]'));
  it('items[item.qty > 0].amount', () => ok('items[item.qty > 0].amount', ['items']));
  it('[1,2,3][item > 1][1]', () => ok('[1,2,3][item > 1][1]'));
});

// ── Comparison of unary test / range expressions ──────────────────────────

describe('comparison of unary test and range expressions', () => {
  it('(< 10) = (< 10)', () => ok('(< 10) = (< 10)'));
  it('(!= 10) = (!= 10)', () => ok('(!= 10) = (!= 10)'));
  it('(= 10) = (= 10)', () => ok('(= 10) = (= 10)'));
  it('[1..10] = [1..10]', () => ok('[1..10] = [1..10]'));
  it('[1..10] != [1..5]', () => ok('[1..10] != [1..5]'));
});

// ── Function calls with function as argument ──────────────────────────────

describe('function as argument', () => {
  it('sort by field: sort([{a:3},{a:1}], function(x,y) x.a < y.a)', () =>
    ok('sort([{a:3},{a:1},{a:2}], function(x,y) x.a < y.a)'));
  it('sort by string length', () =>
    ok('sort(["banana","apple","cherry"], function(a,b) string length(a) < string length(b))'));
  it('g(function(x: number, y: number) x ** y)', () =>
    ok('g(function(x: number, y: number) x ** y)'));
});

// ── dmn-fixtures gaps ─────────────────────────────────────────────────────

describe('dmn-fixtures — additional patterns', () => {
  it('hours(duration("P1DT2H"))', () => ok('hours(duration("P1DT2H"))'));
  it('minutes(duration("PT90M"))', () => ok('minutes(duration("PT90M"))'));
  it('seconds(duration("PT90S"))', () => ok('seconds(duration("PT90S"))'));
  it('years(duration("P1Y2M"))', () => ok('years(duration("P1Y2M"))'));
  it('months(duration("P1Y2M"))', () => ok('months(duration("P1Y2M"))'));
  it('sublist([1,2,3,4], 2)', () => ok('sublist([1,2,3,4], 2)'));
  it('sublist([1,2,3,4], 2, 2)', () => ok('sublist([1,2,3,4], 2, 2)'));
  it('duplicate values([1,2,2,3])', () => ok('duplicate values([1,2,2,3])'));
  it('{ month: month(a), day: day(a) }', () => ok('{ month: month(a), day: day(a) }', ['a']));
  it('{ f: function(x) x * base, result: f(3) }.result', () =>
    ok('{ f: function(x) x * base, result: f(3) }.result', ['base']));
  it('string(date("2024-01-15"))', () => ok('string(date("2024-01-15"))'));
  it('number("1.5", ".", ",")', () => ok('number("1.5", ".", ",")'));
});

// ── Spacing variations ────────────────────────────────────────────────────

describe('spacing / formatting variations', () => {
  it('[ 1 , 2 , 3 ]', () => ok('[ 1 , 2 , 3 ]'));
  it('{ a : 1 , b : 2 }', () => ok('{ a : 1 , b : 2 }'));
  it('( 1 + 2 ) * 3', () => ok('( 1 + 2 ) * 3'));
  it('-( -1 )', () => ok('-( -1 )'));
  it('[ 1 .. 10 ]', () => ok('[ 1 .. 10 ]'));
  it('if  true  then  1  else  2', () => ok('if  true  then  1  else  2'));
});
