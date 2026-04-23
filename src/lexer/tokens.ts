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

export const KEYWORDS: Record<string, TokenType> = {
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
