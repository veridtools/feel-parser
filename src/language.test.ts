/**
 * Comprehensive parse-only coverage of FEEL language features.
 * Each expression is verified to parse without throwing.
 * Evaluation correctness is tested in @veridtools/feel-runner.
 */
import { describe, expect, it } from 'vitest';
import { parse } from './index.js';

function expr(source: string, knownNames: string[] = []) {
  expect(() => parse(source, 'expression', new Set(knownNames))).not.toThrow();
}

function unary(source: string) {
  expect(() => parse(source, 'unary-tests', new Set())).not.toThrow();
}

// ── arithmetic ────────────────────────────────────────────────────────────────

describe('arithmetic — basic', () => {
  it('integer ops', () => {
    expr('1 + 2');
    expr('0 + 0');
    expr('-1 + 1');
    expr('1000000 + 999999');
    expr('10 - 3');
    expr('0 - 5');
    expr('-3 - -2');
    expr('4 * 5');
    expr('-3 * 4');
    expr('0 * 999');
    expr('10 / 4');
    expr('1 / 3');
    expr('-10 / 2');
    expr('2 ** 10');
    expr('2 ** 0');
    expr('2 ** -1');
    expr('9 ** 0.5');
    expr('-5');
    expr('- -5');
    expr('-(3 + 2)');
  });

  it('precedence chains', () => {
    expr('2 + 3 * 4');
    expr('10 - 2 * 3');
    expr('2 ** 3 + 1');
    expr('6 / 2 + 1');
    expr('(2 + 3) * 4');
    expr('(10 - 2) * (3 + 1)');
    expr('2 + 3 * 4 - 8 / 2 ** 2');
    expr('1 + -2');
    expr('5 * -3');
    expr('10 / -2');
    expr('-2 ** 3');
    expr('- -5');
  });

  it('decimal precision', () => {
    expr('0.1 + 0.2');
    expr('0.1 + 0.2 = 0.3');
    expr('0.1 + 0.2 + 0.3');
    expr('1.005 * 100');
    expr('0.7 + 0.1 = 0.8');
    expr('1.1 + 2.2 = 3.3');
    expr('10 / 3 * 3');
    expr('9999999999999999 + 1');
    expr('1 - 0.9');
    expr('0.9 - 0.8');
  });

  it('null propagation', () => {
    expr('null + 1');
    expr('1 + null');
    expr('null - 1');
    expr('null * 2');
    expr('null / 2');
    expr('null ** 2');
    expr('x + 1', ['x']);
    expr('-null');
  });

  it('division edge cases', () => {
    expr('1 / 0');
    expr('0 / 0');
    expr('-5 / 0');
    expr('0 ** 0');
    expr('5 / 0');
    expr('10 ** 30');
    expr('0.0 / 0.0');
    expr('1.0 / 0.0');
    expr('-1.0 / 0.0');
  });
});

describe('arithmetic — comparisons', () => {
  it('numeric', () => {
    expr('3 > 2');
    expr('2 > 3');
    expr('2 > 2');
    expr('2 >= 2');
    expr('3 >= 2');
    expr('1 >= 2');
    expr('1 < 2');
    expr('2 < 1');
    expr('2 < 2');
    expr('2 <= 2');
    expr('1 <= 2');
    expr('3 <= 2');
    expr('2 = 2');
    expr('2 = 3');
    expr('2 != 3');
    expr('2 != 2');
  });

  it('null equality', () => {
    expr('null = null');
    expr('null = 1');
    expr('1 = null');
    expr('null != null');
    expr('null != 1');
    expr('null > 1');
    expr('null < 1');
    expr('null >= 1');
    expr('null <= 1');
  });

  it('cross-type', () => {
    expr('1 = 1.0');
    expr('1 < "a"');
    expr('"a" > 1');
    expr('true < 1');
    expr('false > 0');
    expr('"a" < "b"');
    expr('"b" > "a"');
    expr('"abc" = "abc"');
    expr('"abc" != "xyz"');
    expr('true = true');
    expr('false != true');
  });

  it('string concat', () => {
    expr('"hello" + " " + "world"');
    expr('"hello" + null');
    expr('x + y', ['x', 'y']);
    expr('x * y + z', ['x', 'y', 'z']);
  });

  it('with context variables', () => {
    expr('2 + 3 > 4');
    expr('2 * 3 = 6');
    expr('not true and false or true');
  });
});

describe('arithmetic — temporal', () => {
  it('date arithmetic', () => {
    expr('date("2024-01-15") + duration("P1D")');
    expr('date("2024-01-15") - duration("P1D")');
    expr('date("2024-01-15") + duration("P1M")');
    expr('date("2024-01-15") + duration("P1Y")');
    expr('date("2024-03-01") - date("2024-01-01")');
    expr('date("2024-01-15") < date("2024-01-16")');
    expr('date("2024-01-15") = date("2024-01-15")');
  });

  it('date and time arithmetic', () => {
    expr('date and time("2024-01-15T10:00:00") + duration("PT2H")');
    expr('date and time("2024-01-15T10:00:00") - duration("P1D")');
    expr('time("10:00:00") + duration("PT30M")');
    expr('time("10:00:00") < time("11:00:00")');
  });

  it('duration arithmetic', () => {
    expr('duration("P1Y") + duration("P6M")');
    expr('duration("P1Y") - duration("P6M")');
    expr('duration("P1D") * 3');
    expr('3 * duration("P1D")');
    expr('duration("P6D") / 2');
    expr('duration("P3D") / duration("P1D")');
  });
});

// ── logic ─────────────────────────────────────────────────────────────────────

describe('logic — three-valued', () => {
  it('and', () => {
    expr('true and true');
    expr('true and false');
    expr('false and true');
    expr('false and false');
    expr('true and null');
    expr('null and true');
    expr('false and null');
    expr('null and false');
    expr('null and null');
    expr('true and null and false');
    expr('false and null and true');
    expr('true and null and true');
    expr('true and true and true');
  });

  it('or', () => {
    expr('true or true');
    expr('true or false');
    expr('false or true');
    expr('false or false');
    expr('true or null');
    expr('null or true');
    expr('false or null');
    expr('null or false');
    expr('null or null');
    expr('false or null or true');
    expr('false or null or false');
    expr('false or false or false');
  });

  it('not', () => {
    expr('not(true)');
    expr('not(false)');
    expr('not(null)');
    expr('not(false) and true');
    expr('not(true) or false');
  });

  it('chained logic', () => {
    expr('A and B', ['A', 'B']);
    expr('A or B', ['A', 'B']);
    expr('not(A)', ['A']);
    expr('A and B and C', ['A', 'B', 'C']);
    expr('A or B or C', ['A', 'B', 'C']);
    expr('not(A and B)', ['A', 'B']);
  });
});

describe('logic — if-then-else', () => {
  it('basic', () => {
    expr('if true then "yes" else "no"');
    expr('if false then "yes" else "no"');
    expr('if null then "yes" else "no"');
    expr('if null = null then "ok" else "fail"');
    expr('if 1 > 0 then "pos" else "neg"');
  });

  it('nested', () => {
    expr('if x > 100 then "high" else if x > 50 then "medium" else "low"', ['x']);
    expr('if score >= 90 then "A" else if score >= 80 then "B" else "C"', ['score']);
    expr('if 1 > 0 then if 2 > 1 then "a" else "b" else "c"');
    expr(
      'if score >= 700 and employment = "employed" then "approved" else if score >= 600 or employment = "employed" then "manual review" else "rejected"',
      ['score', 'employment'],
    );
  });
});

describe('logic — between / in', () => {
  it('between', () => {
    expr('5 between 1 and 10');
    expr('1 between 1 and 10');
    expr('10 between 1 and 10');
    expr('0 between 1 and 10');
    expr('11 between 1 and 10');
    expr('null between 1 and 10');
    expr('5 between null and 10');
    expr('"b" between "a" and "c"');
    expr('"d" between "a" and "c"');
    expr('"c" between "a" and "z"');
    expr('"A" between "a" and "z"');
    expr('x between low and high', ['x', 'low', 'high']);
    expr('1 between "a" and "z"');
    expr('date("2024-06-15") between date("2024-01-01") and date("2024-12-31")');
  });

  it('in', () => {
    expr('1 in [1, 2, 3]');
    expr('5 in [1, 2, 3]');
    expr('5 in [1..10]');
    expr('0 in [1..10]');
    expr('5 in 5');
    expr('5 in 6');
    expr('null in [1, 2, null]');
    expr('"a" in ["a", "b", "c"]');
    expr('"z" in ["a", "b", "c"]');
    expr('1 in (1..5]');
    expr('2 in (1..5]');
    expr('null in [1, 2]');
    expr('null in [null, 2, 3]');
    expr('null in [1..10]');
  });
});

describe('logic — quantifiers', () => {
  it('some / every', () => {
    expr('some x in [1, 2, 3] satisfies x > 2');
    expr('some x in [1, 2, 3] satisfies x > 5');
    expr('every x in [1, 2, 3] satisfies x > 0');
    expr('every x in [1, 2, 3] satisfies x > 1');
    expr('some x in [null, 2, 3] satisfies x > 1');
    expr('some x in [1, 2], y in [2, 3] satisfies x = y');
    expr('every x in [2, 4, 6], y in [1, 2] satisfies x > y');
    expr('every x in [2, 4, 6], y in [1, 2] satisfies x > 0');
    expr('some x in ["hello","world"] satisfies starts with(x, "w")');
    expr('every x in [2, 4, 6] satisfies even(x)');
    expr('some x in [], y in [3, 4] satisfies x + y = 5');
    expr('every x in [1, 2], y in [3, 4] satisfies x + y > 3');
    expr('some x in [1, 2], y in [1, 2] satisfies x + y > 3');
  });
});

// ── strings ───────────────────────────────────────────────────────────────────

describe('string operations', () => {
  it('basics', () => {
    expr('"hello"');
    expr('"hello" + " " + "world"');
    expr('"foo" = "foo"');
    expr('"foo" = "bar"');
    expr('"a" < "b"');
    expr('"a" + null');
    expr('null + "a"');
  });

  it('string length', () => {
    expr('string length("hello")');
    expr('string length("")');
    expr('string length("a")');
    expr('string length("😀")');
    expr('string length("café")');
    expr('string length(null)');
  });

  it('substring', () => {
    expr('substring("hello", 1)');
    expr('substring("hello", 2)');
    expr('substring("hello", 5)');
    expr('substring("hello", -2)');
    expr('substring("hello", -3)');
    expr('substring("hello", 1, 3)');
    expr('substring("hello", 2, 3)');
    expr('substring("hello", 3, 10)');
    expr('substring("hello", 1, 0)');
    expr('substring("hello", 10)');
    expr('substring("hello", 2, 100)');
    expr('substring("café", 2)');
    expr('substring(null, 1)');
    expr('substring("hello", null)');
    expr('substring("abcdef", -3, 2)');
  });

  it('case', () => {
    expr('upper case("hello")');
    expr('upper case("Hello World")');
    expr('upper case("")');
    expr('lower case("HELLO")');
    expr('lower case("Hello World")');
    expr('upper case(null)');
    expr('lower case(null)');
  });

  it('before / after', () => {
    expr('substring before("hello", "l")');
    expr('substring before("foobar", "bar")');
    expr('substring before("foobar", "xyz")');
    expr('substring before("foobar", "foo")');
    expr('substring after("hello", "l")');
    expr('substring after("foobar", "foo")');
    expr('substring after("foobar", "xyz")');
    expr('substring before(null, "bar")');
    expr('substring after("foo", null)');
  });

  it('contains / starts with / ends with', () => {
    expr('contains("hello", "ell")');
    expr('contains("foobar", "bar")');
    expr('contains("foobar", "")');
    expr('contains("hello", "xyz")');
    expr('contains("foobar", "FOO")');
    expr('contains(null, "foo")');
    expr('contains("foo", null)');
    expr('starts with("hello", "he")');
    expr('starts with("hello", "lo")');
    expr('starts with("foobar", "")');
    expr('ends with("hello", "lo")');
    expr('ends with("hello", "he")');
    expr('ends with("foobar", "")');
    expr('starts with(null, "foo")');
    expr('ends with("foo", null)');
  });

  it('matches', () => {
    expr('matches("foo123", "[a-z]+\\d+")');
    expr('matches("foo", "\\d+")');
    expr('matches("hello", "h.*o")');
    expr('matches("hello", "^hello$")');
    expr('matches("HELLO", "hello", "i")');
    expr('matches("ab", "a b", "x")');
    expr('matches("a b", "a b", "x")');
    expr('matches("hello\\nworld", "hello.world", "s")');
    expr('matches("abc", "^abc$")');
    expr('matches("xabc", "^abc$")');
    expr('matches("a\\nb", "a.b")');
    expr('matches("first\\nsecond", "^second", "m")');
    expr('matches(null, ".")');
    expr('matches("hello", null)');
    expr('matches("foo", "[invalid")');
  });

  it('replace', () => {
    expr('replace("hello world", "o", "0")');
    expr('replace("aaa", "a", "b")');
    expr('replace("abc", "(a)", "$1$1")');
    expr('replace("Hello World", "hello", "Hi", "i")');
    expr('replace("hello", "xyz", "Z")');
    expr('replace("Hello World", "[a-z]+", "X", "i")');
    expr('replace(null, "a", "b")');
    expr('replace("a", null, "b")');
    expr('replace("a", "a", null)');
    expr('replace("abc", "", "-")');
    expr('replace("abc", "b*", "X")');
  });

  it('split', () => {
    expr('split("a,b,c", ",")');
    expr('split("a1b2c", "\\d")');
    expr('split("a,,b", ",")');
    expr('split("abc", "")');
    expr('split(null, ",")');
  });

  it('trim', () => {
    expr('trim("  hello  ")');
    expr('trim("hello")');
    expr('trim("  ")');
    expr('trim(null)');
  });

  it('extract', () => {
    expr('extract("foo bar", "[a-z]+")');
    expr('extract("2024-01-15", "(\\d{4})-(\\d{2})-(\\d{2})")');
    expr('extract("hello", "\\d+")');
    expr('extract("aaa", "a*")');
    expr('extract(null, "[a-z]+")');
    expr('extract("foo", null)');
    expr('extract("foo", "[invalid")');
  });

  it('pad left / pad right', () => {
    expr('pad left("abc", 6)');
    expr('pad left("", 3)');
    expr('pad left("abc", 6, "0")');
    expr('pad left("5", 4, "0")');
    expr('pad left("hello", 5)');
    expr('pad left("hello", 3)');
    expr('pad left("abc", 5, "xy")');
    expr('pad left(null, 5)');
    expr('pad left("abc", null)');
    expr('pad left("abc", 5, 42)');
    expr('pad right("abc", 6)');
    expr('pad right("", 3)');
    expr('pad right("abc", 6, "-")');
    expr('pad right("hello", 5)');
    expr('pad right("hello", 3)');
    expr('pad right(null, 5)');
    expr('pad right("abc", null)');
    expr('pad left("abc", -1)');
    expr('pad left("abc", 5.9)');
    expr('pad left("x", 3, "")');
  });

  it('encode / decode for URI', () => {
    expr('encode for URI("hello world")');
    expr('encode for URI("a=b&c=d")');
    expr('encode for URI("abc123")');
    expr('encode for URI("")');
    expr('encode for URI(null)');
    expr('encode for URI("café")');
    expr('decode for URI("hello%20world")');
    expr('decode for URI("a%3Db%26c%3Dd")');
    expr('decode for URI("abc123")');
    expr('decode for URI(null)');
    expr('decode for URI("%zz")');
    expr('decode for URI(encode for URI("hello world & more"))');
  });

  it('string join', () => {
    expr('string join(["a", "b", "c"], "-")');
    expr('string join(["a", "b", "c"], "-", "[", "]")');
    expr('string join(["a", null, "c"], ",")');
    expr('string join(["a", "b", "c"])');
    expr('string join([null, null], ",")');
    expr('string join("hello", "-")');
    expr('string join(["a","b"], ",", "[")');
    expr('string join(["a","b"], 5)');
  });

  it('unicode edge cases', () => {
    expr('string length("日本語")');
    expr('string length("🎉")');
    expr('"šomeÚnicodeŠtriňg"');
    expr('"café" = "café"');
    expr('upper case("αβγ")');
    expr('string length("横綱")');
  });
});

// ── numeric builtins ──────────────────────────────────────────────────────────

describe('numeric builtins', () => {
  it('decimal', () => {
    expr('decimal(1.115, 2)');
    expr('decimal(1.145, 2)');
    expr('decimal(1.125, 2)');
    expr('decimal(2.5, 0)');
    expr('decimal(3.5, 0)');
    expr('decimal(123.456, -1)');
    expr('decimal(125, -2)');
    expr('decimal(1.5, 0)');
    expr('decimal(1/3, 2.5)');
    expr('decimal(null, 2)');
    expr('decimal(1.5, null)');
    expr('decimal(1.23456789, 4)');
    expr('decimal(1234, -3)');
    expr('decimal(42, 0)');
  });

  it('floor / ceiling with scale', () => {
    expr('floor(1.7)');
    expr('floor(1.0)');
    expr('floor(0.9)');
    expr('floor(-1.7)');
    expr('floor(-1.0)');
    expr('floor(1.675, 2)');
    expr('floor(-1.675, 2)');
    expr('floor(1.23, 1)');
    expr('floor(1, null)');
    expr('floor(null)');
    expr('ceiling(1.2)');
    expr('ceiling(1.0)');
    expr('ceiling(0.1)');
    expr('ceiling(-1.2)');
    expr('ceiling(-1.7)');
    expr('ceiling(1.675, 2)');
    expr('ceiling(-1.675, 2)');
    expr('ceiling(1, null)');
  });

  it('round variants', () => {
    expr('round up(1.5, 0)');
    expr('round up(-1.5, 0)');
    expr('round up(1.1, 0)');
    expr('round up(-1.1, 0)');
    expr('round up(1.235, 2)');
    expr('round up(-1.235, 2)');
    expr('round up(null, 2)');
    expr('round up(1.5, null)');
    expr('round down(1.5, 0)');
    expr('round down(-1.5, 0)');
    expr('round down(1.9, 0)');
    expr('round down(-1.9, 0)');
    expr('round down(null, 2)');
    expr('round half up(1.5, 0)');
    expr('round half up(2.5, 0)');
    expr('round half up(1.4, 0)');
    expr('round half up(-1.5, 0)');
    expr('round half up(null, 2)');
    expr('round half down(1.5, 0)');
    expr('round half down(2.5, 0)');
    expr('round half down(1.6, 0)');
    expr('round half down(-1.5, 0)');
  });

  it('abs', () => {
    expr('abs(5)');
    expr('abs(0)');
    expr('abs(0.5)');
    expr('abs(-5)');
    expr('abs(-0.5)');
    expr('abs(duration("-P1D"))');
    expr('abs(duration("P1Y"))');
    expr('abs(duration("-P2Y3M"))');
    expr('abs(duration("P5D"))');
    expr('abs(null)');
    expr('abs(n: -1)');
  });

  it('modulo', () => {
    expr('modulo(10, 3)');
    expr('modulo(-10, 3)');
    expr('modulo(10, -3)');
    expr('modulo(-10, -3)');
    expr('modulo(10, 0)');
    expr('modulo(null, 3)');
    expr('modulo(10, null)');
    expr('modulo(10, 10)');
    expr('modulo(0, 5)');
    expr('modulo(1.5, 0.4)');
  });

  it('sqrt / log / exp', () => {
    expr('sqrt(9)');
    expr('sqrt(4)');
    expr('sqrt(0)');
    expr('sqrt(1)');
    expr('sqrt(2)');
    expr('sqrt(-1)');
    expr('sqrt(null)');
    expr('log(1)');
    expr('log(4)');
    expr('log(0)');
    expr('log(-1)');
    expr('log(null)');
    expr('exp(0)');
    expr('exp(4)');
    expr('exp(-1)');
    expr('exp(null)');
    expr('log(exp(1))');
    expr('exp(100)');
    expr('exp(-100)');
    expr('log(0.0001)');
    expr('sqrt(2)');
  });

  it('odd / even', () => {
    expr('odd(1)');
    expr('odd(3)');
    expr('odd(-1)');
    expr('odd(0)');
    expr('odd(2)');
    expr('even(0)');
    expr('even(2)');
    expr('even(-2)');
    expr('even(1)');
    expr('even(3)');
    expr('odd(1.5)');
    expr('even(1.5)');
    expr('odd(null)');
    expr('even(null)');
    expr('odd(9999999)');
    expr('even(9999998)');
  });

  it('random number', () => {
    expr('random number()');
  });
});

// ── list operations ───────────────────────────────────────────────────────────

describe('list operations', () => {
  it('basics', () => {
    expr('[1, 2, 3]');
    expr('[10, 20, 30][2]');
    expr('[10, 20, 30][-1]');
    expr('count([1, 2, 3])');
    expr('count([])');
    expr('count([null, null])');
    expr('count(null)');
    expr('count(42)');
    expr('[1, 2, 3, 4, 5][item > 3]');
    expr('for x in [1, 2, 3] return x * 2');
  });

  it('min / max', () => {
    expr('min([3, 1, 4, 1, 5])');
    expr('min([1])');
    expr('min(3, 1, 4)');
    expr('max([3, 1, 4, 1, 5])');
    expr('max(3, 1, 4)');
    expr('min([])');
    expr('max([])');
    expr('min(["b", "a", "c"])');
    expr('max(["b", "a", "c"])');
  });

  it('sum / mean / median / product', () => {
    expr('sum([1, 2, 3])');
    expr('sum(1, 2, 3)');
    expr('sum([])');
    expr('sum([0.1, 0.2])');
    expr('sum([1, null, 3])');
    expr('mean([1, 2, 3])');
    expr('mean(1, 2, 3)');
    expr('mean([1, 2])');
    expr('mean([])');
    expr('mean([1, null, 3])');
    expr('median([1, 2, 3])');
    expr('median([5, 3, 1])');
    expr('median([1, 2, 3, 4])');
    expr('median([42])');
    expr('median([])');
    expr('product([1, 2, 3, 4])');
    expr('product(2, 3, 4)');
    expr('product([])');
    expr('product([2, null, 3])');
  });

  it('all / any', () => {
    expr('all([true, true, true])');
    expr('all([true, false, true])');
    expr('all([true, null, true])');
    expr('all([false, null])');
    expr('any([false, true, false])');
    expr('any([false, false])');
    expr('any([false, null])');
    expr('any([true, null])');
    expr('all([true])');
    expr('any([false])');
    expr('all([])');
    expr('any([])');
  });

  it('append / concatenate / reverse / flatten', () => {
    expr('append([1, 2], 3)');
    expr('append([1], 2, 3)');
    expr('append([1], null)');
    expr('concatenate([1, 2], [3, 4])');
    expr('concatenate([1], [2], [3])');
    expr('concatenate([1, 2], 3)');
    expr('reverse([1, 2, 3])');
    expr('reverse([])');
    expr('reverse(null)');
    expr('flatten([[1, 2], [3, [4, 5]]])');
    expr('flatten([1, 2, 3])');
    expr('flatten([[[]]])');
    expr('flatten([[[1]], [[2]]])');
    expr('flatten([null, [1, null]])');
  });

  it('insert before / remove', () => {
    expr('insert before([1, 2, 3], 2, 10)');
    expr('insert before([1, 2, 3], 1, 10)');
    expr('insert before([1, 2, 3], -1, 10)');
    expr('insert before([1,2,3], 0, 10)');
    expr('insert before([1,2,3], 10, 99)');
    expr('remove([1, 2, 3], 2)');
    expr('remove([1, 2, 3], 1)');
    expr('remove([1, 2, 3], -1)');
    expr('remove([1,2,3], 0)');
    expr('remove([1,2,3], 10)');
  });

  it('index of / union / distinct / duplicate', () => {
    expr('index of([1, 2, 3, 2], 2)');
    expr('index of([1, 2, 3], 5)');
    expr('index of([1, null, 3], null)');
    expr('index of([], 1)');
    expr('index of([1,2,1,2,1], 1)');
    expr('union([1, 2], [2, 3])');
    expr('union([1], [1], [1])');
    expr('distinct values([1, 2, 1, 3])');
    expr('distinct values([3, 1, 2, 1])');
    expr('distinct values([42])');
    expr('distinct values([1, null, 1, null])');
    expr('distinct values(["a","b","a"])');
    expr('duplicate values([1, 2, 1, 3, 2])');
    expr('duplicate values([1, 2, 3])');
    expr('duplicate values([5, 5, 5])');
    expr('duplicate values([])');
    expr('duplicate values(null)');
  });

  it('sublist', () => {
    expr('sublist([1, 2, 3, 4], 2)');
    expr('sublist([1, 2, 3, 4], 2, 2)');
    expr('sublist([1, 2, 3, 4], -2)');
    expr('sublist([1,2,3], 1, 0)');
    expr('sublist([1,2,3], 10)');
    expr('sublist([1,2,3], 2, 100)');
  });

  it('sort', () => {
    expr('sort([3, 1, 2], function(x, y) x < y)');
    expr('sort([3, 1, 2], function(x, y) x > y)');
    expr('sort([3, 1, 2])');
    expr('sort(null)');
    expr('sort([], function(a,b) a < b)');
    expr('sort([42])');
    expr('sort(["banana","apple","cherry"])');
    expr('sort([3,1,2], function(a,b) a < b)');
  });

  it('list replace', () => {
    expr('list replace([1, 2, 3], 2, 20)');
    expr('list replace([1, 2, 3], function(item, replacement) item = 2, 20)');
    expr('list replace([1, 2, 3], -1, 30)');
    expr('list replace(null, 1, 5)');
  });

  it('mode / stddev', () => {
    expr('mode([1, 2, 2, 3])');
    expr('mode([1, 2, 1, 2, 3])');
    expr('mode([5, 5, 5])');
    expr('mode([1, 2, 3])');
    expr('mode([])');
    expr('mode([1, null, 2])');
    expr('stddev([2, 4, 6, 8])');
    expr('stddev([1, 1])');
    expr('stddev([1])');
    expr('stddev([1, null])');
    expr('stddev([1, 2, 3])');
    expr('stddev([-1, -2, -3])');
  });

  it('filter edge cases', () => {
    expr('[1, 2, 3, 4, 5][item > 3]');
    expr('[{a:1},{a:2},{a:3}][a > 1]');
    expr('[1, 2, 3][item > 10]');
    expr('[1, 2, 3][item > 0]');
    expr('["a","bb","ccc"][string length(item) = 2]');
    expr('[{a:1,b:2},{a:3,b:4},{a:1,b:9}][a = 1 and b > 5]');
    expr('["a","bb","ccc"][string length(item) > 1]');
    expr('[{a:1,b:2},{a:3,b:4}][a > 1]');
    expr('[1, 2, 3][item > 0]');
    expr('[true, 1, "hello", null][item instance of boolean]');
    expr('[1, "two", 3, "four", 5][item instance of number]');
  });

  it('nested / for', () => {
    expr('for x in [1, 2, 3], y in [1, 2] return x + y');
    expr('for x in 3..1 return x');
    expr('some x in [] satisfies x > 0');
    expr('every x in [] satisfies x > 0');
    expr('some x in [1, null, 3] satisfies x > 2');
    expr('some x in [1, null, 2] satisfies x > 2');
    expr('every x in [1, null, 3] satisfies x > 0');
    expr('[1,2,3][0]');
    expr('[1,2,3][5]');
  });

  it('chained list builtins', () => {
    expr('sublist(sort([5, 3, 1, 4, 2], function(a, b) a < b), 1, 3)');
    expr('sort(distinct values(flatten([[3,1],[2,1],[3]])), function(a, b) a < b)');
    expr('count([1,2,3,4,5][item > 2]) * 10');
    expr('flatten(for x in [1, 2, 3] return [x, x * 2])');
    expr('for s in ["hello", "world"] return upper case(s)');
    expr('["hi", "bye", "hello", "ok"][string length(item) > 2]');
  });
});

// ── contexts ──────────────────────────────────────────────────────────────────

describe('context operations', () => {
  it('basics', () => {
    expr('{a: 1, b: 2}');
    expr('{a: 1}.a');
    expr('{a: {b: 42}}.a.b');
    expr('x.name', ['x']);
    expr('{a: 1}.z');
    expr('{a: null}.a');
    expr('context equality: {a: 1} = {a: 1}');
  });

  it('get / put / merge / entries', () => {
    expr('get value({a: 1}, "a")');
    expr('get value({a: 42}, "a")');
    expr('get value({a: 1}, "z")');
    expr('get value(null, "a")');
    expr('get entries({a: 1, b: 2})');
    expr('get entries({})');
    expr('get entries({a: 1})');
    expr('context put({a: 1}, "b", 2)');
    expr('context put({a: 1, b: 2}, "a", 99)');
    expr('context put({}, "a", 1)');
    expr('context put(null, "a", 1)');
    expr('context merge([{a: 1}, {b: 2}])');
    expr('context merge([{a: 1, b: 2}, {b: 99}])');
    expr('context merge([])');
    expr('context merge([{x: 5}])');
  });

  it('computed keys', () => {
    expr('{ ["ab"]: 1 }.ab');
    expr('{ ["x" + "y"]: 99 }.xy');
    expr('{ [upper case("key")]: 7 }.KEY');
    expr('{ [1]: "a" }');
    expr('{ [null]: "a" }');
  });

  it('path on lists', () => {
    expr('[{a:1},{a:2},{a:3}].a');
    expr('[{a:1},{b:2}].a');
    expr('{a: {b: {c: 42}}}.a.b.c');
    expr('[{x:1},{x:2},{x:3}].x');
    expr('[{x:1},{y:2}].x');
    expr('[{a:{b:1}},{a:{b:2}},{a:{b:3}}].a.b');
    expr('[{a:1,b:2},{a:3,b:4}][a > 1]');
  });

  it('path edge cases', () => {
    expr('{a: 1, b: 2}.a');
    expr('{a: {b: 42}}.a.b');
    expr('"string".length');
    expr('"hello".missing');
    expr('{a: 1, b: 2} = {a: 1, b: 2}');
    expr('{a: 1} = {a: 1}');
    expr('{a: 1} = {a: 2}');
  });

  it('recursive / closure', () => {
    expr('{double: function(x) x * 2, result: double(3)}.result');
    expr('{f: function(x) x + 1}.f(5)');
    expr('{fact: function(n) if n <= 1 then 1 else n * fact(n - 1), result: fact(5)}.result');
    expr('{fib: function(n) if n <= 1 then n else fib(n-1) + fib(n-2), result: fib(7)}.result');
    expr('{add: function(x) function(y) x + y, add5: add(5), result: add5(3)}.result');
    expr('{ fib: function(n) if n <= 1 then n else fib(n-1) + fib(n-2) }.fib(8)');
    expr(
      '{ rsum: function(lst, i) if i > count(lst) then 0 else lst[i] + rsum(lst, i+1) }.rsum([1,2,3,4,5], 1)',
    );
    expr('{ fact: function(n) if n <= 1 then 1 else n * fact(n-1) }.fact(6)');
    expr('{ f: function(x) x * base, result: f(3) }.result', ['base']);
  });

  it('context in combinations', () => {
    expr('for x in [1, 2, 3] return context put({}, "double", x * 2)');
    expr('for x in [1, 2] return context merge([{base: 10}, {val: x}])');
    expr('every item in [{score: 90}, {score: 85}, {score: 72}] satisfies item.score >= 70');
    expr('some item in [{score: 90}, {score: 50}] satisfies item.score < 60');
    expr('every x in [{v:1},{v:2},{v:3}][item.v > 1] satisfies x.v > 1');
    expr(
      'every x in [{items:[1,2,3]},{items:[4,5,6]}] satisfies every n in x.items satisfies n > 0',
    );
  });
});

// ── functions ─────────────────────────────────────────────────────────────────

describe('function definitions and calls', () => {
  it('invocation', () => {
    expr('(function(x) x * 2)(5)');
    expr('(function(x, y) x + y)(3, 4)');
    expr('(function(a, b, c) a + b + c)(1, 2, 3)');
    expr('(function(x: number) x + 1)(5)');
    expr('(function(x: number) x + 1)("a")');
    expr('(function(a, b) a - b)(b: 1, a: 5)');
  });

  it('named params', () => {
    expr('substring(string: "hello", start position: 2, length: 3)');
    expr('floor(n: 3.7)');
    expr('ceiling(n: 1.5, scale: 1)');
    expr('(function(a, b) a + b)(a: 1, c: 2)');
    expr('list replace(list: [1,2,3], position: 2, newItem: 9)');
  });

  it('higher-order', () => {
    expr('sort([3,1,2], function(a,b) a < b)');
    expr('list replace([1,2,3,4], function(e, r) e > 2, 99)');
    expr('(function(x) x + base)(5)', ['base']);
    expr('f(function(a) a * 2, function(b) b + 1)');
    expr('f(function(a: string, b: string) if a = "x" then true else false)');
  });

  it('IIFE patterns', () => {
    expr('(function(x) x * 2)(3)');
    expr('"abs"(-1)');
    expr('non_existing_function()');
  });
});

// ── instance of ───────────────────────────────────────────────────────────────

describe('instance of', () => {
  it('primitives', () => {
    expr('1 instance of number');
    expr('1.5 instance of number');
    expr('-42 instance of number');
    expr('"hello" instance of number');
    expr('true instance of number');
    expr('null instance of number');
    expr('"hello" instance of string');
    expr('"" instance of string');
    expr('1 instance of string');
    expr('null instance of string');
    expr('true instance of boolean');
    expr('false instance of boolean');
    expr('1 instance of boolean');
    expr('null instance of boolean');
  });

  it('temporal', () => {
    expr('date("2023-01-15") instance of date');
    expr('"2023-01-15" instance of date');
    expr('null instance of date');
    expr('time("10:30:00") instance of time');
    expr('null instance of time');
    expr('date and time("2023-01-15T10:30:00") instance of date and time');
    expr('null instance of date and time');
    expr('duration("P1Y") instance of years and months duration');
    expr('duration("P1D") instance of days and time duration');
    expr('duration("P1Y") instance of days and time duration');
    expr('duration("P1D") instance of years and months duration');
    expr('duration("P1Y") instance of duration');
    expr('duration("P1D") instance of duration');
    expr('date and time("2024-01-15T10:00:00") instance of date');
    expr('date("2024-01-15") instance of date and time');
    expr('time("10:00:00") instance of date');
  });

  it('collections', () => {
    expr('[1, 2, 3] instance of list');
    expr('[] instance of list');
    expr('1 instance of list');
    expr('null instance of list');
    expr('[1, 2, 3] instance of list<number>');
    expr('[1, "a", 3] instance of list<number>');
    expr('{a: 1} instance of context');
    expr('1 instance of context');
    expr('null instance of context');
    expr('[1,2,3] instance of context');
    expr('{a:1} instance of list');
    expr('[1, 2, 3] instance of list');
    expr('[] instance of list<number>');
    expr('[] instance of list<string>');
    expr('["a","b"] instance of list<string>');
    expr('[1,"b"] instance of list<string>');
    expr('[true,false] instance of list<boolean>');
    expr('[true,1] instance of list<boolean>');
    expr('[1,null,3] instance of list<number>');
    expr('[date("2024-01-01")] instance of list<date>');
    expr('{a: 1} instance of context<a: number>');
    expr('{a: "x"} instance of context<a: number>');
  });

  it('Any / Null / function / range', () => {
    expr('1 instance of Any');
    expr('"hello" instance of Any');
    expr('true instance of Any');
    expr('null instance of Any');
    expr('null instance of Null');
    expr('1 instance of Null');
    expr('(function(x) x) instance of function');
    expr('(function(x) x) instance of Any');
    expr('[1..5] instance of range');
    expr('(1..5) instance of range');
  });

  it('in filter', () => {
    expr('every x in [1, 2, 3] satisfies x instance of number');
    expr('every x in [1, 2, 3] satisfies x > 0');
    expr('some x in [1, 2, 3] satisfies x > 0');
  });
});

// ── temporal builtins ─────────────────────────────────────────────────────────

describe('temporal literals — @ syntax', () => {
  it('date', () => {
    expr('@"2024-01-15"');
    expr('@"2024-12-31"');
    expr('@"2000-01-01"');
    expr('@"2024-01-15" instance of date');
    expr('@"2024-01-15" + duration("P1D")');
    expr('@"2024-01-15" = date("2024-01-15")');
  });

  it('time', () => {
    expr('@"10:30:00"');
    expr('@"00:00:00"');
    expr('@"23:59:59"');
    expr('@"10:30:00+02:00"');
    expr('@"10:30:00@Europe/Paris"');
    expr('@"10:30:00" instance of time');
  });

  it('date and time', () => {
    expr('@"2024-01-15T10:30:00"');
    expr('@"2024-01-15T10:30:00+01:00"');
    expr('@"2024-01-15T10:30:00@UTC"');
    expr('@"2024-01-15T10:30:00" instance of date and time');
    expr('@"2024-01-15T10:30:00" + duration("PT1H")');
  });

  it('duration', () => {
    expr('@"P1Y2M"');
    expr('@"P1DT2H30M"');
    expr('@"-P1Y"');
    expr('@"PT0S"');
    expr('@"P1Y2M" instance of years and months duration');
    expr('@"P1DT2H" instance of days and time duration');
    expr('@"P1Y" + @"P6M"');
  });
});

describe('comments', () => {
  it('single-line //', () => {
    expr('1 + 2 // this is a comment');
    expr('// full line comment\n1 + 2');
    expr('true // inline');
    expr('"hello" // string with comment');
    expr('x * 2 // multiply', ['x']);
  });

  it('multi-line /* */', () => {
    expr('/* comment */ 1 + 2');
    expr('1 /* middle */ + 2');
    expr('1 + 2 /* trailing */');
    expr('/* multi\n   line\n   comment */ true');
    expr('/* a */ x /* b */ + 1', ['x']);
  });
});

describe('temporal builtins', () => {
  it('date()', () => {
    expr('date("2024-01-15")');
    expr('date("2024-12-31")');
    expr('date(2024, 1, 15)');
    expr('date(date and time("2024-01-15T10:30:00"))');
    expr('date("invalid")');
    expr('day of week(date("2024-01-15"))');
    expr('month of year(date("2024-03-15"))');
    expr('years and months duration(date("2020-01-01"), date("2024-06-01"))');
  });

  it('time()', () => {
    expr('time("10:30:00")');
    expr('time("00:00:00")');
    expr('time(10, 30, 0)');
    expr('time(date and time("2024-01-15T10:30:00"))');
    expr('time("10:30:00+02:00")');
  });

  it('date and time()', () => {
    expr('date and time("2024-01-15T10:30:00")');
    expr('date and time(date("2024-01-15"), time("10:30:00"))');
    expr('date and time("2024-01-15T10:30:00+01:00")');
    expr('date and time("2024-01-15T10:30:00@Europe/Paris")');
  });

  it('duration()', () => {
    expr('duration("P1Y2M")');
    expr('duration("P1DT2H3M4S")');
    expr('duration("P1Y")');
    expr('duration("P1D")');
    expr('duration("-P1D")');
    expr('duration("-P2Y3M")');
  });

  it('temporal functions', () => {
    expr('day of year(date("2024-01-15"))');
    expr('day of week(date("2024-01-15"))');
    expr('month of year(date("2024-01-15"))');
    expr('week of year(date("2024-01-15"))');
    expr('years and months duration(date("2011-12-22"), date("2013-08-24"))');
    expr('today()');
    expr('now()');
    expr('is(date("2024-01-01"), date("2024-01-01"))');
    expr('is(null, null)');
    expr('is(1, 1)');
  });

  it('temporal arithmetic', () => {
    expr('date("2024-01-01") + duration("P1Y")');
    expr('date("2024-01-15") > date("2024-01-01")');
    expr('date("2024-01-01") = date("2024-01-01")');
    expr('for d in [date("2024-01-01"), date("2024-01-15")] return d + duration("P7D")');
    expr(
      'for d in [date("2024-01-01"), date("2024-01-08"), date("2024-01-15")] return string(d + duration("P1D"))',
    );
    expr('for d in dates return day of week(date(d))', ['dates']);
    expr(
      'overlaps([date("2024-01-01")..date("2024-01-31")], [date("2024-01-15")..date("2024-02-15")])',
    );
    expr(
      'before([date("2024-01-01")..date("2024-01-31")], [date("2024-02-01")..date("2024-02-28")])',
    );
    expr('includes([date("2024-01-01")..date("2024-12-31")], date("2024-06-15"))');
    expr(
      'sort([date("2024-03-01"), date("2024-01-01"), date("2024-02-01")], function(a, b) a < b)',
    );
  });

  it('range comparison functions', () => {
    expr('meets([1..3], [3..5])');
    expr('met by([3..5], [1..3])');
    expr('overlaps([1..3], [2..5])');
    expr('overlaps before([1..3], [2..5])');
    expr('overlaps after([3..5], [1..3])');
    expr('finishes(5, [1..5])');
    expr('finished by([1..5], 5)');
    expr('starts(1, [1..5])');
    expr('started by([1..5], 1)');
    expr('coincides([1..5], [1..5])');
    expr('during(3, [1..5])');
    expr('includes([1..5], 3)');
    expr('before(1, [2..10])');
    expr('after(11, [1..10])');
    expr('within(5, [1..10])');
  });
});

// ── conversion functions ──────────────────────────────────────────────────────

describe('conversion functions', () => {
  it('number() — basic', () => {
    expr('number("1.5")');
    expr('number("-42")');
    expr('number("0")');
    expr('number(null)');
    expr('number("abc")');
  });

  it('number() — locale separators', () => {
    expr('number("1.500,99", ".", ",")');
    expr('number("1,500.99", ",", ".")');
    expr('number("1 500,99", " ", ",")');
    expr('number("1500", "", ".")');
    expr('number("1.500,99", ".", "")');
    expr('number(null, ".", ",")');
    expr('number("1.500,99", null, ",")');
  });

  it('string() conversions', () => {
    expr('string(1)');
    expr('string(1.5)');
    expr('string(true)');
    expr('string(false)');
    expr('string(null)');
    expr('string(date("2024-01-15"))');
    expr('string(duration("P1Y"))');
    expr('string([1, 2, 3])');
    expr('string({a: 1})');
  });
});

// ── temporal accessor functions ───────────────────────────────────────────────

describe('temporal accessor functions', () => {
  it('date component functions', () => {
    expr('year(date("2024-01-15"))');
    expr('month(date("2024-06-30"))');
    expr('day(date("2024-12-31"))');
    expr('year(date and time("2024-01-15T10:30:00"))');
    expr('month(date and time("2024-06-30T00:00:00"))');
    expr('day(date and time("2024-12-31T23:59:59"))');
    expr('year(null)');
    expr('month(null)');
    expr('day(null)');
  });

  it('time component functions', () => {
    expr('hour(time("10:30:45"))');
    expr('minute(time("10:30:45"))');
    expr('second(time("10:30:45"))');
    expr('time offset(time("10:30:00+02:00"))');
    expr('timezone(time("10:30:00@Europe/Paris"))');
    expr('hour(date and time("2024-01-15T10:30:45"))');
    expr('minute(date and time("2024-01-15T10:30:45"))');
    expr('second(date and time("2024-01-15T10:30:45"))');
    expr('hour(null)');
  });

  it('duration component functions', () => {
    expr('years(duration("P2Y3M"))');
    expr('months(duration("P2Y3M"))');
    expr('days(duration("P5DT2H30M"))');
    expr('hours(duration("P5DT2H30M"))');
    expr('minutes(duration("P5DT2H30M"))');
    expr('seconds(duration("P5DT2H30M10S"))');
    expr('years(null)');
    expr('months(null)');
    expr('days(null)');
  });
});

// ── phase C: format functions ─────────────────────────────────────────────────

describe('phase C — date/time with custom format', () => {
  it('date(str, format)', () => {
    expr('date("18.01.2024", "dd.MM.yyyy")');
    expr('date("26/08/2024", "dd/MM/yyyy")');
    expr('date("01-18-2024", "MM-dd-yyyy")');
    expr('date("5/3/2024", "d/M/yyyy")');
    expr('date("18.01.24", "dd.MM.yy")');
    expr('date("18.01.75", "dd.MM.yy")');
    expr('date(s, "d MMMM yyyy")', ['s']);
    expr('date(s, "d MMM yyyy")', ['s']);
    expr("date(s, \"dd 'de' MMMM 'de' yyyy\")", ['s']);
    expr('date("not-a-date", "dd.MM.yyyy")');
    expr('date("2024-01-18")');
    expr('date("01/01/50", "dd/MM/yy")');
    expr('date("01/01/49", "dd/MM/yy")');
    expr('date("18.01.2024", "dd/MM/yyyy")');
    expr('date("18/01", "dd/MM")');
    expr('date("15 Enero 2024", "dd MMMM yyyy")');
    expr('date("18 Januar 2024", "dd MMMM yyyy")');
    expr('date("30/02/2024", "dd/MM/yyyy")');
    expr('date("31/04/2024", "dd/MM/yyyy")');
  });

  it('time(str, format)', () => {
    expr('time("14h30", "HH\'h\'mm")');
    expr('time("09:30:45", "HH:mm:ss")');
    expr('time("9:30 AM", "h:mm a")');
    expr('time("2:30 PM", "h:mm a")');
    expr('time("12:00 AM", "hh:mm a")');
    expr('time("12:00 PM", "hh:mm a")');
    expr('time("12:30 AM", "hh:mm a")');
  });

  it('date and time(str, format)', () => {
    expr('date and time("26/08/2024 14:30", "dd/MM/yyyy HH:mm")');
    expr('date and time("2024-01-18T10:30:00")');
  });
});

describe('phase C — format number / date / time', () => {
  it('format number', () => {
    expr('format number(1234.56, "#,##0.00")');
    expr('format number(42, "000")');
    expr('format number(1234567.89, "#,##0.00", "pt-BR")');
    expr('format number(1234.56, "#,##0.00", "de")');
    expr('format number(1234.56, "#,##0.00", "en-US")');
    expr('format number(1234.56, "$#,##0.00")');
    expr('format number(0.1234, "0.00%")');
    expr('format number(null, "#,##0")');
    expr('format number(42, null)');
    expr('format number(-1234.56, "#,##0.00")');
    expr('format number(0, "0.##")');
    expr('format number(1, "0%")');
    expr('format number(1000000, "#,##0")');
    expr('format number(42.7, "0")');
    expr('format number(-1234.56, "#,##0.00", "pt-BR")');
  });

  it('format date', () => {
    expr('format date(date("2024-01-18"), "dd/MM/yyyy")');
    expr('format date(date("2024-01-05"), "d/M/yyyy")');
    expr('format date(date("2024-01-18"), "MMMM d, yyyy")');
    expr('format date(date("2024-01-18"), "MMM dd, yyyy")');
    expr('format date(date("2024-01-18"), "dd \'de\' MMMM \'de\' yyyy", "pt-BR")');
    expr('format date(date("2024-01-18"), "dd. MMMM yyyy", "de")');
    expr('format date(date and time("2024-03-15T10:30:00"), "dd/MM/yyyy")');
    expr('format date(null, "dd/MM/yyyy")');
    expr('format date(date("2024-02-29"), "dd/MM/yyyy")');
    expr('format date(date("2024-06-15"), "dd/MM/yy")');
  });

  it('format time', () => {
    expr('format time(time("14:30:00"), "HH:mm")');
    expr('format time(time("14:30:00"), "h:mm a")');
    expr('format time(time("09:05:00"), "h:mm a")');
    expr('format time(time("09:05:03"), "HH:mm:ss")');
    expr('format time(time("00:00:00"), "hh:mm a")');
    expr('format time(time("12:00:00"), "hh:mm a")');
    expr('format time(time("23:59:00"), "h:mm a")');
  });

  it('format date and time', () => {
    expr('format date and time(date and time("2024-08-26T14:30:00"), "dd/MM/yyyy HH:mm")');
    expr(
      'format date and time(date and time("2024-01-18T14:30:00"), "MMMM d, yyyy \'at\' h:mm a")',
    );
    expr('format date and time(date and time("2024-01-18T00:30:00"), "dd/MM/yyyy hh:mm a")');
  });
});

// ── phase D: let / pipeline ───────────────────────────────────────────────────

describe('phase D — let expressions', () => {
  it('basic', () => {
    expr('let x = 5 in x + 1');
    expr('let rate = 0.1 in rate * 1000');
    expr('let x = 3 in let y = 4 in x + y');
    expr('let a = 10 in let b = a * 2 in a + b');
    expr('let greeting = "Hello" in greeting + " World"');
    expr('let nums = [1,2,3] in count(nums)');
    expr('let x = 10 in if x > 5 then "big" else "small"');
    expr('let monthly = annual / 12 in monthly * 3', ['annual']);
    expr('let base = 100 in let tax = base * 0.1 in base + tax');
  });

  it('in for / nested', () => {
    expr('for i in [1,2,3] return let doubled = i * 2 in doubled');
    expr('for i in [1,2,3] return let sq = i * i in sq + 1');
    expr('let x = 1 in let x = 2 in x');
    expr('let x = null in if x = null then "yes" else "no"');
    expr('let double = function(a) a * 2 in double(5)');
    expr('let x = 1 + 2 * 3 in x');
    expr('let a = 2 in let b = a * 3 in let c = b + a in c');
    expr('let result = (3 in [1,2,3]) in result');
    expr('let x = 5 in x * 2');
    expr('let tax = price * 0.1 in let total = price + tax in total', ['price']);
  });
});

describe('phase D — pipeline |>', () => {
  it('basic', () => {
    expr('"hello" |> upper case');
    expr('[1,2,3] |> count');
    expr('"WORLD" |> lower case');
    expr('"Hello" |> upper case |> lower case');
    expr('"hello world" |> substring(?, 1, 5)');
    expr('"world" |> string length(?)');
    expr('[1,2,3] |> reverse');
    expr('[1,2,3,4] |> sum');
    expr('[[1,2],[3,4]] |> flatten');
    expr('name |> upper case', ['name']);
    expr('"  spaces  " |> trim');
    expr('"hello" |> upper case |> substring(?, 1, 3)');
  });

  it('with ? slot', () => {
    expr('"feel" |> upper case(?)');
    expr('"hello world" |> contains(?, "world")');
    expr('"hello" |> starts with(?, "he")');
    expr('1 + 2 |> string');
    expr('items |> sum', ['items']);
    expr('"hello world" |> substring(?, 1, 5)');
    expr('[1,-2,3] |> abs(?) |> string(?)');
    expr('"  Hello  " |> trim |> lower case |> upper case');
    expr('null |> upper case');
    expr('[1,2,3] |> count');
  });
});

// ── unary tests ───────────────────────────────────────────────────────────────

describe('unary tests', () => {
  it('values and ranges', () => {
    unary('5');
    unary('"hello"');
    unary('[1..10]');
    unary('(1..10)');
    unary('[1..10)');
    unary('(1..10]');
    unary('> 5');
    unary('>= 5');
    unary('< 5');
    unary('<= 5');
    unary('= 5');
    unary('= "abc"');
    unary('!= 5');
    unary('-');
    unary('null');
    unary('true');
    unary('false');
  });

  it('disjunctions', () => {
    unary('1, 2, 3');
    unary('1, [5..10], 20');
    unary('"Medium","Low"');
    unary('"High","Low","Medium"');
    unary('"UNEMPLOYED","EMPLOYED","SELF-EMPLOYED","STUDENT"');
    unary('< 5, > 10');
    unary('>=0, <=100');
    unary('"Declined","Approved"');
  });

  it('negation', () => {
    unary('not(5)');
    unary('not([1..5])');
    unary('not(1, 2, 3)');
    unary('not([5..10])');
    unary('not(1, 2, 3)');
    unary('not([1..5])');
    unary('not("High","Medium")');
    unary('not("Declined")');
    unary('not("STUDENT","UNEMPLOYED")');
  });

  it('with context variable', () => {
    unary('[date("2024-01-01")..date("2024-12-31")]');
    unary('> threshold');
    unary('[numB..numC]');
  });

  it('type mismatch cases', () => {
    unary('5');
    unary('"abc"');
    unary('[1..10]');
  });
});

// ── standard FEEL — DMN 1.5 completeness ─────────────────────────────────────

describe('standard FEEL — DMN 1.5 completeness', () => {
  it('list contains', () => {
    expr('list contains([1, 2, 3], 2)');
    expr('list contains([1, 2, 3], 5)');
    expr('list contains([], 1)');
    expr('list contains([null, 1], null)');
    expr('list contains(null, 1)');
  });

  it('is defined', () => {
    expr('is defined(x)', ['x']);
    expr('is defined(null)');
    expr('is defined(1)');
    expr('is defined("hello")');
    expr('if is defined(x) then x else 0', ['x']);
    expr('is defined(x) and x > 0', ['x']);
  });

  it('context() constructor', () => {
    expr('context([{"key": "a", "value": 1}])');
    expr('context([])');
    expr('context(null)');
    expr('context(entries)', ['entries']);
  });

  it('range() constructor', () => {
    expr('range("[1..5]")');
    expr('range("(1..10)")');
    expr('range("[0..100]")');
    expr('range(null)');
  });
});

// ── vendor extensions (not part of DMN spec) ──────────────────────────────────

describe('vendor extensions — string utilities', () => {
  it('is blank / is empty', () => {
    expr('is blank("")');
    expr('is blank("hello")');
    expr('is blank("  ")');
    expr('is blank(null)');
    expr('is empty([])');
    expr('is empty([1, 2, 3])');
    expr('is empty(null)');
    expr('is empty("")');
  });

  it('to base64 / from base64', () => {
    expr('to base64("hello")');
    expr('to base64("")');
    expr('to base64(null)');
    expr('from base64("aGVsbG8=")');
    expr('from base64("")');
    expr('from base64(null)');
    expr('from base64(to base64("round trip"))');
  });

  it('string format', () => {
    expr('string format("Hello %s", "World")');
    expr('string format("%d items", 5)');
    expr('string format("%.2f", 3.14159)');
    expr('string format("%s and %s", "foo", "bar")');
    expr('string format(null, "x")');
    expr('string format("no args")');
  });

  it('to json / from json', () => {
    expr('to json({a: 1, b: "hello"})');
    expr('to json([1, 2, 3])');
    expr('to json(null)');
    expr('to json(42)');
    expr('to json(true)');
    expr('from json("[1, 2, 3]")');
    expr('from json("42")');
    expr('from json("true")');
    expr('from json("null")');
    expr('from json(null)');
    expr('from json("invalid json")');
  });
});

describe('vendor extensions — context utilities', () => {
  it('get or else', () => {
    expr('get or else({a: 1}, "a", 0)');
    expr('get or else({a: 1}, "b", 0)');
    expr('get or else({a: 1}, "b", "default")');
    expr('get or else(null, "a", "fallback")');
    expr('get or else({}, "key", null)');
    expr('get or else(ctx, "missing", -1)', ['ctx']);
  });
});

describe('vendor extensions — utilities', () => {
  it('assert', () => {
    expr('assert(true, "should be true")');
    expr('assert(x > 0, "x must be positive")', ['x']);
    expr('assert(null, "null is falsy")');
    expr('assert(false, "always fails")');
  });

  it('error', () => {
    expr('error("something went wrong")');
    expr('error(null)');
    expr('if x < 0 then error("negative") else x', ['x']);
  });

  it('partition', () => {
    expr('partition([1, 2, 3, 4, 5], 2)');
    expr('partition([1, 2, 3], 1)');
    expr('partition([], 3)');
    expr('partition(null, 2)');
    expr('partition([1, 2, 3, 4], 4)');
  });

  it('uuid', () => {
    expr('uuid()');
  });
});

describe('vendor extensions — temporal utilities', () => {
  it('last day of month', () => {
    expr('last day of month(date("2024-01-15"))');
    expr('last day of month(date("2024-02-01"))');
    expr('last day of month(date("2024-02-29"))');
    expr('last day of month(date and time("2024-03-15T10:00:00"))');
    expr('last day of month(null)');
  });

  it('from unix timestamp / to unix timestamp', () => {
    expr('from unix timestamp(1705312800)');
    expr('from unix timestamp(0)');
    expr('from unix timestamp(null)');
    expr('to unix timestamp(date("2024-01-15"))');
    expr('to unix timestamp(date and time("2024-01-15T10:30:00"))');
    expr('to unix timestamp(null)');
    expr('from unix timestamp(to unix timestamp(date("2024-06-01")))');
  });
});

// ── combinations ──────────────────────────────────────────────────────────────

describe('combinations', () => {
  it('for + temporal', () => {
    expr('for d in dates return day of week(date(d))', ['dates']);
    expr('for d in [date("2024-01-01"), date("2024-01-15")] return d + duration("P7D")');
    expr(
      'for d in [date("2024-01-01"), date("2024-01-08"), date("2024-01-15")] return string(d + duration("P1D"))',
    );
  });

  it('quantifiers + context', () => {
    expr('every item in [{score: 90}, {score: 85}, {score: 72}] satisfies item.score >= 70');
    expr('some item in [{score: 90}, {score: 50}] satisfies item.score < 60');
    expr('every x in [{v:1},{v:2},{v:3}][item.v > 1] satisfies x.v > 1');
    expr(
      'every x in [{items:[1,2,3]},{items:[4,5,6]}] satisfies every n in x.items satisfies n > 0',
    );
  });

  it('string + quantifiers', () => {
    expr('every s in ["foo@bar.com", "baz@qux.io"] satisfies matches(s, ".+@.+")');
    expr('some s in ["hello world", "goodbye"] satisfies starts with(s, "hello")');
    expr('for s in ["hello", "world"] return upper case(s)');
    expr('["hi", "bye", "hello", "ok"][string length(item) > 2]');
  });

  it('range + temporal', () => {
    expr(
      'overlaps([date("2024-01-01")..date("2024-01-31")], [date("2024-01-15")..date("2024-02-15")])',
    );
    expr(
      'before([date("2024-01-01")..date("2024-01-31")], [date("2024-02-01")..date("2024-02-28")])',
    );
    expr('includes([date("2024-01-01")..date("2024-12-31")], date("2024-06-15"))');
  });

  it('context + for + arithmetic', () => {
    expr('for x in [1, 2, 3] return context put({}, "double", x * 2)');
    expr('for x in [1, 2] return context merge([{base: 10}, {val: x}])');
    expr('[{a:{b:1}},{a:{b:2}},{a:{b:3}}].a.b');
  });

  it('instance of + filter', () => {
    expr('[1, "two", 3, "four", 5][item instance of number]');
    expr('every x in [1, 2, 3] satisfies x instance of number');
    expr('[true, 1, "hello", null][item instance of boolean]');
  });

  it('recursion', () => {
    expr('{fact: function(n) if n <= 1 then 1 else n * fact(n - 1), result: fact(5)}.result');
    expr('{fib: function(n) if n <= 1 then n else fib(n-1) + fib(n-2), result: fib(7)}.result');
    expr('{ fib: function(n) if n <= 1 then n else fib(n-1) + fib(n-2) }.fib(8)');
    expr(
      '{ rsum: function(lst, i) if i > count(lst) then 0 else lst[i] + rsum(lst, i+1) }.rsum([1,2,3,4,5], 1)',
    );
    expr('{ fact: function(n) if n <= 1 then 1 else n * fact(n-1) }.fact(6)');
  });

  it('nested quantifiers', () => {
    expr('some x in [1, 2, 3], y in [4, 5, 6] satisfies x + y = 6');
    expr('every x in [1, 2], y in [3, 4] satisfies x + y > 3');
    expr('every x in [1, 2], y in [1, 2] satisfies x + y > 3');
  });

  it('chained list builtins', () => {
    expr('sublist(sort([5, 3, 1, 4, 2], function(a, b) a < b), 1, 3)');
    expr('sort(distinct values(flatten([[3,1],[2,1],[3]])), function(a, b) a < b)');
    expr('count([1,2,3,4,5][item > 2]) * 10');
    expr('flatten(for x in [1, 2, 3] return [x, x * 2])');
  });

  it('conversion + arithmetic', () => {
    expr('for s in ["1", "2", "3"] return number(s) * 10');
    expr('if string length("hello") > 3 then upper case("hello") else lower case("WORLD")');
  });

  it('complex decisions', () => {
    expr(
      'if score >= 700 and employment = "employed" then "approved" else if score >= 600 or employment = "employed" then "manual review" else "rejected"',
      ['score', 'employment'],
    );
    expr(
      'for qty in [1, 5, 10, 20] return if qty >= 20 then qty * 0.8 else if qty >= 10 then qty * 0.9 else if qty >= 5 then qty * 0.95 else qty',
    );
    expr('sum(for x in [1,2,3,4,5,6,7,8,9,10] return if modulo(x, 2) = 0 then x * x else 0)');
  });
});
