export enum TokenType {
  // Literals
  Number = 'Number',
  String = 'String',
  Name = 'Name',
  TemporalLiteral = 'TemporalLiteral', // @"..."

  // Keywords
  True = 'true',
  False = 'false',
  Null = 'null',
  If = 'if',
  Then = 'then',
  Else = 'else',
  For = 'for',
  In = 'in',
  Return = 'return',
  Some = 'some',
  Every = 'every',
  Satisfies = 'satisfies',
  Function = 'function',
  External = 'external',
  Instance = 'instance',
  Of = 'of',
  And = 'and',
  Or = 'or',
  Not = 'not',
  Between = 'between',
  Let = 'let',

  // Operators
  Plus = '+',
  Minus = '-',
  Star = '*',
  Slash = '/',
  StarStar = '**',
  Eq = '=',
  NEq = '!=',
  Lt = '<',
  Gt = '>',
  LtEq = '<=',
  GtEq = '>=',
  DotDot = '..',
  Dot = '.',
  Arrow = '->',
  Pipe = '|>',

  // Punctuation
  LParen = '(',
  RParen = ')',
  LBracket = '[',
  RBracket = ']',
  LBrace = '{',
  RBrace = '}',
  Comma = ',',
  Colon = ':',
  Semicolon = ';',
  Question = '?',

  // Special
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

const KEYWORDS: Record<string, TokenType> = {
  true: TokenType.True,
  false: TokenType.False,
  null: TokenType.Null,
  if: TokenType.If,
  // biome-ignore lint/suspicious/noThenProperty: FEEL keyword
  then: TokenType.Then,
  else: TokenType.Else,
  for: TokenType.For,
  in: TokenType.In,
  return: TokenType.Return,
  some: TokenType.Some,
  every: TokenType.Every,
  satisfies: TokenType.Satisfies,
  function: TokenType.Function,
  external: TokenType.External,
  instance: TokenType.Instance,
  of: TokenType.Of,
  and: TokenType.And,
  or: TokenType.Or,
  not: TokenType.Not,
  between: TokenType.Between,
  let: TokenType.Let,
};

export class Lexer {
  private pos = 0;
  private readonly src: string;

  constructor(src: string) {
    this.src = src;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.pos < this.src.length) {
      this.skipWhitespace();
      if (this.pos >= this.src.length) break;
      const tok = this.nextToken();
      tokens.push(tok);
    }
    tokens.push({ type: TokenType.EOF, value: '', start: this.pos, end: this.pos });
    return tokens;
  }

  private skipWhitespace(): void {
    while (this.pos < this.src.length) {
      if (/\s/.test(this.src[this.pos]!)) {
        this.pos++;
      } else if (this.src[this.pos] === '/' && this.src[this.pos + 1] === '/') {
        // End-of-line comment
        while (this.pos < this.src.length && this.src[this.pos] !== '\n') this.pos++;
      } else if (this.src[this.pos] === '/' && this.src[this.pos + 1] === '*') {
        // Block comment
        this.pos += 2;
        while (
          this.pos < this.src.length &&
          !(this.src[this.pos] === '*' && this.src[this.pos + 1] === '/')
        )
          this.pos++;
        this.pos += 2;
      } else {
        break;
      }
    }
  }

  private nextToken(): Token {
    const start = this.pos;
    const ch = this.src[this.pos]!;

    // Temporal literal @"..."
    if (ch === '@' && this.src[this.pos + 1] === '"') {
      this.pos++; // skip @
      const str = this.readString();
      return { type: TokenType.TemporalLiteral, value: str, start, end: this.pos };
    }

    // String literal "..."
    if (ch === '"') {
      const str = this.readString();
      return { type: TokenType.String, value: str, start, end: this.pos };
    }

    // Number
    if (ch >= '0' && ch <= '9') {
      return this.readNumber(start);
    }

    // Operators and punctuation
    switch (ch) {
      case '+':
        this.pos++;
        return { type: TokenType.Plus, value: '+', start, end: this.pos };
      case '*':
        if (this.src[this.pos + 1] === '*') {
          this.pos += 2;
          return { type: TokenType.StarStar, value: '**', start, end: this.pos };
        }
        this.pos++;
        return { type: TokenType.Star, value: '*', start, end: this.pos };
      case '/':
        this.pos++;
        return { type: TokenType.Slash, value: '/', start, end: this.pos };
      case '(':
        this.pos++;
        return { type: TokenType.LParen, value: '(', start, end: this.pos };
      case ')':
        this.pos++;
        return { type: TokenType.RParen, value: ')', start, end: this.pos };
      case '[':
        this.pos++;
        return { type: TokenType.LBracket, value: '[', start, end: this.pos };
      case ']':
        this.pos++;
        return { type: TokenType.RBracket, value: ']', start, end: this.pos };
      case '{':
        this.pos++;
        return { type: TokenType.LBrace, value: '{', start, end: this.pos };
      case '}':
        this.pos++;
        return { type: TokenType.RBrace, value: '}', start, end: this.pos };
      case ',':
        this.pos++;
        return { type: TokenType.Comma, value: ',', start, end: this.pos };
      case ':':
        this.pos++;
        return { type: TokenType.Colon, value: ':', start, end: this.pos };
      case ';':
        this.pos++;
        return { type: TokenType.Semicolon, value: ';', start, end: this.pos };
      case '?':
        this.pos++;
        return { type: TokenType.Question, value: '?', start, end: this.pos };
      case '=':
        this.pos++;
        return { type: TokenType.Eq, value: '=', start, end: this.pos };
      case '.': {
        if (this.src[this.pos + 1] === '.') {
          this.pos += 2;
          return { type: TokenType.DotDot, value: '..', start, end: this.pos };
        }
        // .digit → number literal like .872
        const nextCh = this.src[this.pos + 1] ?? '';
        if (nextCh >= '0' && nextCh <= '9') {
          return this.readNumber(start);
        }
        this.pos++;
        return { type: TokenType.Dot, value: '.', start, end: this.pos };
      }
      case '!':
        if (this.src[this.pos + 1] === '=') {
          this.pos += 2;
          return { type: TokenType.NEq, value: '!=', start, end: this.pos };
        }
        break;
      case '<':
        if (this.src[this.pos + 1] === '=') {
          this.pos += 2;
          return { type: TokenType.LtEq, value: '<=', start, end: this.pos };
        }
        this.pos++;
        return { type: TokenType.Lt, value: '<', start, end: this.pos };
      case '>':
        if (this.src[this.pos + 1] === '=') {
          this.pos += 2;
          return { type: TokenType.GtEq, value: '>=', start, end: this.pos };
        }
        this.pos++;
        return { type: TokenType.Gt, value: '>', start, end: this.pos };
      case '-':
        if (this.src[this.pos + 1] === '>') {
          this.pos += 2;
          return { type: TokenType.Arrow, value: '->', start, end: this.pos };
        }
        this.pos++;
        return { type: TokenType.Minus, value: '-', start, end: this.pos };
      case '|':
        if (this.src[this.pos + 1] === '>') {
          this.pos += 2;
          return { type: TokenType.Pipe, value: '|>', start, end: this.pos };
        }
        this.pos++;
        return { type: TokenType.Name, value: '|', start, end: this.pos };
    }

    // Name (identifier, possibly with spaces — FEEL allows multi-word names)
    if (isNameStart(ch)) {
      return this.readName(start);
    }

    // Unknown — skip
    this.pos++;
    return { type: TokenType.Name, value: ch, start, end: this.pos };
  }

  private readString(): string {
    this.pos++; // skip opening "
    let result = '';
    while (this.pos < this.src.length && this.src[this.pos] !== '"') {
      if (this.src[this.pos] === '\\') {
        this.pos++;
        const esc = this.src[this.pos];
        switch (esc) {
          case 'n':
            result += '\n';
            break;
          case 't':
            result += '\t';
            break;
          case 'r':
            result += '\r';
            break;
          case '"':
            result += '"';
            break;
          case '\\':
            result += '\\';
            break;
          case 'u': {
            const hex = this.src.slice(this.pos + 1, this.pos + 5);
            result += String.fromCharCode(parseInt(hex, 16));
            this.pos += 4;
            break;
          }
          case 'U': {
            // 6-digit supplementary Unicode escape: \U0XXXXX
            const hex6 = this.src.slice(this.pos + 1, this.pos + 7);
            const cp = parseInt(hex6, 16);
            result += String.fromCodePoint(cp);
            this.pos += 6;
            break;
          }
          default:
            result += `\\${esc ?? ''}`;
        }
      } else {
        result += this.src[this.pos];
      }
      this.pos++;
    }
    if (this.pos >= this.src.length) {
      throw new Error('Unterminated string literal');
    }
    this.pos++; // skip closing "
    return result;
  }

  private readNumber(start: number): Token {
    while (this.pos < this.src.length && this.src[this.pos]! >= '0' && this.src[this.pos]! <= '9') {
      this.pos++;
    }
    // Only consume decimal point if NOT followed by another dot (range operator ..)
    if (this.src[this.pos] === '.' && this.src[this.pos + 1] !== '.') {
      this.pos++;
      while (
        this.pos < this.src.length &&
        this.src[this.pos]! >= '0' &&
        this.src[this.pos]! <= '9'
      ) {
        this.pos++;
      }
    }
    // Scientific notation: e/E followed by optional +/- and digits
    if (this.src[this.pos] === 'e' || this.src[this.pos] === 'E') {
      const next = this.src[this.pos + 1];
      if (next === '+' || next === '-' || (next !== undefined && next >= '0' && next <= '9')) {
        this.pos++;
        if (this.src[this.pos] === '+' || this.src[this.pos] === '-') this.pos++;
        while (
          this.pos < this.src.length &&
          this.src[this.pos]! >= '0' &&
          this.src[this.pos]! <= '9'
        ) {
          this.pos++;
        }
      }
    }
    return {
      type: TokenType.Number,
      value: this.src.slice(start, this.pos),
      start,
      end: this.pos,
    };
  }

  private readName(start: number): Token {
    while (this.pos < this.src.length && isNamePart(this.src[this.pos]!)) {
      this.pos++;
    }
    const value = this.src.slice(start, this.pos);
    const kw = KEYWORDS[value];
    return { type: kw ?? TokenType.Name, value, start, end: this.pos };
  }
}

function isNameStart(ch: string): boolean {
  if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') return true;
  // Allow non-ASCII Unicode letters (including emoji high surrogates)
  const code = ch.charCodeAt(0);
  return code > 127;
}

function isNamePart(ch: string): boolean {
  return isNameStart(ch) || (ch >= '0' && ch <= '9') || ch === "'" || ch === '\u2019';
}

export function tokenize(src: string): Token[] {
  return new Lexer(src).tokenize();
}
