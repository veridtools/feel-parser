import { tokenize } from '../lexer/index.js';
import type { FeelDialect } from '../types.js';
import { type AstNode, ParseSyntaxError } from './ast.js';
import { Parser } from './parser.js';

export type { AstNode, FeelType } from './ast.js';
export { ParseSyntaxError } from './ast.js';

export function parse(
  src: string,
  dialect: FeelDialect = 'expression',
  knownNames?: Set<string>,
): AstNode {
  const tokens = tokenize(src);
  const parser = new Parser(tokens, knownNames);
  const ast = dialect === 'unary-tests' ? parser.parseUnaryTests() : parser.parseExpr();
  if (parser.errors.length > 0) {
    const e = parser.errors[0]!;
    throw new ParseSyntaxError(e.message, e.start, e.end);
  }
  return ast;
}

export function safeParse(
  src: string,
  dialect: FeelDialect = 'expression',
  knownNames?: Set<string>,
): { ast: AstNode; errors: ParseSyntaxError[] } {
  const tokens = tokenize(src);
  const parser = new Parser(tokens, knownNames);
  const ast = dialect === 'unary-tests' ? parser.parseUnaryTests() : parser.parseExpr();
  return { ast, errors: parser.errors };
}
