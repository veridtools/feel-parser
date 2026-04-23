import { tokenize } from '../lexer/index.js';
import type { FeelDialect } from '../types.js';
import type { AstNode, ParseError } from './ast.js';
import { Parser } from './parser.js';

export type { AstNode, FeelType } from './ast.js';

export function parse(
  src: string,
  dialect: FeelDialect = 'expression',
  knownNames?: Set<string>,
): AstNode {
  const tokens = tokenize(src);
  const parser = new Parser(tokens, knownNames);
  if (dialect === 'unary-tests') {
    return parser.parseUnaryTests();
  }
  return parser.parseExpr();
}

export function safeParse(
  src: string,
  dialect: FeelDialect = 'expression',
  knownNames?: Set<string>,
): { ast: AstNode | null; errors: ParseError[] } {
  try {
    const ast = parse(src, dialect, knownNames);
    return { ast, errors: [] };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const spanMatch = /at (\d+)\.\.(\d+)/.exec(message);
    const start = spanMatch?.[1] ? parseInt(spanMatch[1], 10) : 0;
    const end = spanMatch?.[2] ? parseInt(spanMatch[2], 10) : start;
    return { ast: null, errors: [{ message, start, end }] };
  }
}
