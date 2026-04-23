import { describe, expect, it } from 'vitest';
import { TokenType, tokenize } from '../index.js';

function types(src: string): TokenType[] {
  return tokenize(src).map((t) => t.type);
}

function values(src: string): string[] {
  return tokenize(src).map((t) => t.value);
}

describe('lexer', () => {
  describe('number literals', () => {
    it('integer', () => {
      const [tok] = tokenize('42');
      expect(tok?.type).toBe(TokenType.Number);
      expect(tok?.value).toBe('42');
    });

    it('decimal', () => {
      const [tok] = tokenize('3.14');
      expect(tok?.type).toBe(TokenType.Number);
      expect(tok?.value).toBe('3.14');
    });

    it('zero', () => {
      const [tok] = tokenize('0');
      expect(tok?.type).toBe(TokenType.Number);
    });

    it('large number', () => {
      const [tok] = tokenize('999999999999');
      expect(tok?.type).toBe(TokenType.Number);
      expect(tok?.value).toBe('999999999999');
    });

    it('decimal starting with dot', () => {
      const [tok] = tokenize('.5');
      expect(tok?.type).toBe(TokenType.Number);
      expect(tok?.value).toBe('.5');
    });
  });

  describe('string literals', () => {
    it('double-quoted string', () => {
      const [tok] = tokenize('"hello"');
      expect(tok?.type).toBe(TokenType.String);
      expect(tok?.value).toBe('hello');
    });

    it('empty string', () => {
      const [tok] = tokenize('""');
      expect(tok?.type).toBe(TokenType.String);
      expect(tok?.value).toBe('');
    });

    it('string with escape', () => {
      const [tok] = tokenize('"say \\"hi\\""');
      expect(tok?.type).toBe(TokenType.String);
      expect(tok?.value).toBe('say "hi"');
    });

    it('string with unicode escape', () => {
      const [tok] = tokenize('"\\u0041"');
      expect(tok?.type).toBe(TokenType.String);
      expect(tok?.value).toBe('A');
    });
  });

  describe('keywords', () => {
    it('true / false / null', () => {
      expect(types('true false null')).toEqual([
        TokenType.True,
        TokenType.False,
        TokenType.Null,
        TokenType.EOF,
      ]);
    });

    it('if / then / else', () => {
      expect(types('if then else')).toEqual([
        TokenType.If,
        TokenType.Then,
        TokenType.Else,
        TokenType.EOF,
      ]);
    });

    it('for / in / return', () => {
      expect(types('for in return')).toEqual([
        TokenType.For,
        TokenType.In,
        TokenType.Return,
        TokenType.EOF,
      ]);
    });

    it('some / every / satisfies', () => {
      expect(types('some every satisfies')).toEqual([
        TokenType.Some,
        TokenType.Every,
        TokenType.Satisfies,
        TokenType.EOF,
      ]);
    });

    it('function / external', () => {
      expect(types('function external')).toEqual([
        TokenType.Function,
        TokenType.External,
        TokenType.EOF,
      ]);
    });

    it('instance / of', () => {
      expect(types('instance of')).toEqual([TokenType.Instance, TokenType.Of, TokenType.EOF]);
    });

    it('and / or / not', () => {
      expect(types('and or not')).toEqual([
        TokenType.And,
        TokenType.Or,
        TokenType.Not,
        TokenType.EOF,
      ]);
    });

    it('between / let', () => {
      expect(types('between let')).toEqual([TokenType.Between, TokenType.Let, TokenType.EOF]);
    });
  });

  describe('operators', () => {
    it('arithmetic operators', () => {
      expect(types('+ - * / **')).toEqual([
        TokenType.Plus,
        TokenType.Minus,
        TokenType.Star,
        TokenType.Slash,
        TokenType.StarStar,
        TokenType.EOF,
      ]);
    });

    it('comparison operators', () => {
      expect(types('= != < > <= >=')).toEqual([
        TokenType.Eq,
        TokenType.NEq,
        TokenType.Lt,
        TokenType.Gt,
        TokenType.LtEq,
        TokenType.GtEq,
        TokenType.EOF,
      ]);
    });

    it('range operator', () => {
      expect(types('..')).toEqual([TokenType.DotDot, TokenType.EOF]);
    });

    it('dot operator', () => {
      expect(types('.')).toEqual([TokenType.Dot, TokenType.EOF]);
    });

    it('arrow operator', () => {
      expect(types('->')).toEqual([TokenType.Arrow, TokenType.EOF]);
    });

    it('pipeline operator', () => {
      expect(types('|>')).toEqual([TokenType.Pipe, TokenType.EOF]);
    });
  });

  describe('punctuation', () => {
    it('parentheses', () => {
      expect(types('()')).toEqual([TokenType.LParen, TokenType.RParen, TokenType.EOF]);
    });

    it('brackets', () => {
      expect(types('[]')).toEqual([TokenType.LBracket, TokenType.RBracket, TokenType.EOF]);
    });

    it('braces', () => {
      expect(types('{}')).toEqual([TokenType.LBrace, TokenType.RBrace, TokenType.EOF]);
    });

    it('comma, colon, semicolon, question', () => {
      expect(types(', : ; ?')).toEqual([
        TokenType.Comma,
        TokenType.Colon,
        TokenType.Semicolon,
        TokenType.Question,
        TokenType.EOF,
      ]);
    });
  });

  describe('identifiers / names', () => {
    it('simple name', () => {
      const [tok] = tokenize('myVar');
      expect(tok?.type).toBe(TokenType.Name);
      expect(tok?.value).toBe('myVar');
    });

    it('multi-word names are separate tokens at lexer level', () => {
      // The lexer emits each word as a separate Name token;
      // the parser assembles them into a single multi-word identifier.
      const toks = tokenize('Full Name');
      expect(toks[0]?.type).toBe(TokenType.Name);
      expect(toks[0]?.value).toBe('Full');
      expect(toks[1]?.type).toBe(TokenType.Name);
      expect(toks[1]?.value).toBe('Name');
    });

    it('name with underscore', () => {
      const [tok] = tokenize('my_var');
      expect(tok?.type).toBe(TokenType.Name);
      expect(tok?.value).toBe('my_var');
    });

    it('keyword prefix is not consumed as name', () => {
      const toks = tokenize('iffy');
      expect(toks[0]?.type).toBe(TokenType.Name);
      expect(toks[0]?.value).toBe('iffy');
    });
  });

  describe('temporal literals', () => {
    it('@"..." syntax', () => {
      const [tok] = tokenize('@"2024-01-15"');
      expect(tok?.type).toBe(TokenType.TemporalLiteral);
      expect(tok?.value).toBe('2024-01-15');
    });

    it('@"..." with time', () => {
      const [tok] = tokenize('@"10:30:00"');
      expect(tok?.type).toBe(TokenType.TemporalLiteral);
      expect(tok?.value).toBe('10:30:00');
    });
  });

  describe('whitespace handling', () => {
    it('ignores leading/trailing whitespace', () => {
      expect(types('  42  ')).toEqual([TokenType.Number, TokenType.EOF]);
    });

    it('ignores newlines', () => {
      expect(types('1\n+\n2')).toEqual([
        TokenType.Number,
        TokenType.Plus,
        TokenType.Number,
        TokenType.EOF,
      ]);
    });
  });

  describe('token positions', () => {
    it('start and end are correct', () => {
      const toks = tokenize('1 + 2');
      const [one, plus, two] = toks;
      expect(one?.start).toBe(0);
      expect(one?.end).toBe(1);
      expect(plus?.start).toBe(2);
      expect(plus?.end).toBe(3);
      expect(two?.start).toBe(4);
      expect(two?.end).toBe(5);
    });
  });

  describe('compound expressions', () => {
    it('arithmetic expression tokens', () => {
      expect(types('1 + 2 * 3')).toEqual([
        TokenType.Number,
        TokenType.Plus,
        TokenType.Number,
        TokenType.Star,
        TokenType.Number,
        TokenType.EOF,
      ]);
    });

    it('function call tokens', () => {
      expect(types('count(items)')).toEqual([
        TokenType.Name,
        TokenType.LParen,
        TokenType.Name,
        TokenType.RParen,
        TokenType.EOF,
      ]);
    });

    it('list literal tokens', () => {
      expect(types('[1, 2, 3]')).toEqual([
        TokenType.LBracket,
        TokenType.Number,
        TokenType.Comma,
        TokenType.Number,
        TokenType.Comma,
        TokenType.Number,
        TokenType.RBracket,
        TokenType.EOF,
      ]);
    });

    it('context literal tokens', () => {
      expect(types('{a: 1}')).toEqual([
        TokenType.LBrace,
        TokenType.Name,
        TokenType.Colon,
        TokenType.Number,
        TokenType.RBrace,
        TokenType.EOF,
      ]);
    });

    it('range tokens', () => {
      expect(types('[1..10]')).toEqual([
        TokenType.LBracket,
        TokenType.Number,
        TokenType.DotDot,
        TokenType.Number,
        TokenType.RBracket,
        TokenType.EOF,
      ]);
    });

    it('string values are correctly extracted', () => {
      // EOF token has empty value string
      expect(values('"hello" + " " + "world"')).toEqual(['hello', '+', ' ', '+', 'world', '']);
    });
  });
});
