import type { Token } from '../lexer/index.js';
import { TokenType } from '../lexer/index.js';
import {
  type AstNode,
  type ContextEntry,
  type FeelType,
  type Loc,
  ParseSyntaxError,
} from './ast.js';
import {
  BP,
  KNOWN_NAME_PREFIXES,
  KNOWN_NAMES,
  MULTI_WORD_PATH_CONTINUATIONS,
} from './constants.js';

export { ParseSyntaxError } from './ast.js';

export class Parser {
  private tokens: Token[];
  private pos = 0;
  private inRangeEnd = false;
  private inLetValue = false;
  private knownNames: Set<string> = new Set();
  public errors: ParseSyntaxError[] = [];

  constructor(tokens: Token[], knownNames?: Set<string>) {
    this.tokens = tokens;
    if (knownNames) this.knownNames = knownNames;
  }

  private peek(): Token {
    return this.tokens[this.pos] ?? { type: TokenType.EOF, value: '', start: 0, end: 0 };
  }

  private advance(): Token {
    const tok = this.tokens[this.pos] ?? { type: TokenType.EOF, value: '', start: 0, end: 0 };
    this.pos++;
    return tok;
  }

  private addError(message: string, start: number, end: number): void {
    this.errors.push(new ParseSyntaxError(message, start, end));
  }

  private synchronize(): void {
    while (!this.check(TokenType.EOF)) {
      const t = this.peek().type;
      if (
        t === TokenType.Comma ||
        t === TokenType.RParen ||
        t === TokenType.RBracket ||
        t === TokenType.RBrace
      )
        break;
      this.advance();
    }
  }

  private expect(type: TokenType): Token {
    const tok = this.peek();
    if (tok.type !== type) {
      this.addError(`Expected ${type} but got ${tok.type} (${tok.value})`, tok.start, tok.end);
      return { type, value: '', start: tok.start, end: tok.start };
    }
    return this.advance();
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private checkValue(value: string): boolean {
    return this.peek().value === value;
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private buildLoc(start: number): Loc {
    const last = this.tokens[this.pos - 1];
    return { start, end: last ? last.end : start };
  }

  parseExpr(minBP = BP.None): AstNode {
    let left = this.parsePrefix();
    while (true) {
      const bp = this.infixBP();
      if (bp <= minBP) break;
      left = this.parseInfix(left, bp);
    }
    return left;
  }

  private parsePrefix(): AstNode {
    const tok = this.peek();

    switch (tok.type) {
      case TokenType.Number:
        this.advance();
        return { type: 'NumberLiteral', value: tok.value, loc: { start: tok.start, end: tok.end } };

      case TokenType.String:
        this.advance();
        return { type: 'StringLiteral', value: tok.value, loc: { start: tok.start, end: tok.end } };

      case TokenType.True:
        this.advance();
        return { type: 'BooleanLiteral', value: true, loc: { start: tok.start, end: tok.end } };

      case TokenType.False:
        this.advance();
        return { type: 'BooleanLiteral', value: false, loc: { start: tok.start, end: tok.end } };

      case TokenType.Null:
        this.advance();
        return { type: 'NullLiteral', loc: { start: tok.start, end: tok.end } };

      case TokenType.TemporalLiteral:
        this.advance();
        return {
          type: 'TemporalLiteral',
          value: tok.value,
          loc: { start: tok.start, end: tok.end },
        };

      case TokenType.Minus: {
        this.advance();
        const operand = this.parseExpr(BP.Unary);
        return { type: 'UnaryMinus', operand, loc: { start: tok.start, end: operand.loc.end } };
      }

      case TokenType.LParen: {
        const parenStart = tok.start;
        this.advance();
        const savedLV = this.inLetValue;
        this.inLetValue = false;
        const result = this.parseParenOrOpenRange(parenStart);
        this.inLetValue = savedLV;
        return result;
      }

      // European/ISO 31-11 open-range start: ]1..10] = (1..10]
      case TokenType.RBracket: {
        const start = tok.start;
        this.advance();
        if (this.check(TokenType.DotDot)) {
          this.advance();
          const end = this.parseRangeEnd();
          return {
            type: 'RangeLiteral',
            startIncluded: false,
            endIncluded: end.endIncluded,
            start: null,
            end: end.node,
            loc: this.buildLoc(start),
          };
        }
        const rangeStart = this.parseExpr(BP.Range);
        this.expect(TokenType.DotDot);
        const end = this.parseRangeEnd();
        return {
          type: 'RangeLiteral',
          startIncluded: false,
          endIncluded: end.endIncluded,
          start: rangeStart,
          end: end.node,
          loc: this.buildLoc(start),
        };
      }

      case TokenType.LBracket:
        return this.parseList();

      case TokenType.LBrace:
        return this.parseContext();

      case TokenType.If:
        return this.parseIf();

      case TokenType.For:
        return this.parseFor();

      case TokenType.Some:
      case TokenType.Every:
        return this.parseQuantified();

      case TokenType.Function:
        return this.parseFunctionDef();

      case TokenType.Not: {
        const start = tok.start;
        this.advance();
        if (this.check(TokenType.LParen)) {
          // not( expr ) — unary test negation
          this.advance();
          const tests = this.parseUnaryTestList();
          this.expect(TokenType.RParen);
          return { type: 'UnaryTestList', tests, negated: true, loc: this.buildLoc(start) };
        }
        // Logical not
        const operand = this.parseExpr(BP.Unary);
        return {
          type: 'BinaryOp',
          op: '=',
          left: operand,
          right: { type: 'BooleanLiteral', value: false, loc: operand.loc },
          loc: { start, end: operand.loc.end },
        };
      }

      case TokenType.Question:
        this.advance();
        return { type: 'Identifier', name: '?', loc: { start: tok.start, end: tok.end } };

      // Unary comparison tests (for unary-tests dialect and x in =v / !=v)
      case TokenType.Eq:
      case TokenType.NEq:
      case TokenType.Lt:
      case TokenType.Gt:
      case TokenType.LtEq:
      case TokenType.GtEq: {
        const op = tok.type;
        const start = tok.start;
        this.advance();
        const operand = this.parseExpr(BP.Comparison);
        const implicitQ: AstNode = { type: 'Identifier', name: '?', loc: { start, end: start } };
        return {
          type: 'BinaryOp',
          op,
          left: implicitQ,
          right: operand,
          loc: { start, end: operand.loc.end },
        };
      }

      case TokenType.Let: {
        const start = tok.start;
        this.advance();
        const nameTok = this.expect(TokenType.Name);
        this.expect(TokenType.Eq);
        const savedLetValue = this.inLetValue;
        this.inLetValue = true;
        const value = this.parseExpr();
        this.inLetValue = savedLetValue;
        this.expect(TokenType.In);
        const body = this.parseExpr();
        return {
          type: 'LetExpression',
          name: nameTok.value,
          value,
          body,
          loc: this.buildLoc(start),
        };
      }

      case TokenType.Name:
        return this.parseName();

      default: {
        const badTok = this.advance();
        this.addError(
          `Unexpected token: ${badTok.type} (${badTok.value})`,
          badTok.start,
          badTok.end,
        );
        return {
          type: 'ErrorNode',
          message: `Unexpected token: ${badTok.type}`,
          loc: { start: badTok.start, end: badTok.end },
        };
      }
    }
  }

  private infixBP(): number {
    const tok = this.peek();
    switch (tok.type) {
      case TokenType.Or:
        return BP.Or;
      case TokenType.And:
        return BP.And;
      case TokenType.Eq:
      case TokenType.NEq:
      case TokenType.Lt:
      case TokenType.Gt:
      case TokenType.LtEq:
      case TokenType.GtEq:
        return BP.Comparison;
      case TokenType.DotDot:
        return BP.Range;
      case TokenType.Plus:
      case TokenType.Minus:
        return BP.Addition;
      case TokenType.Star:
      case TokenType.Slash:
        return BP.Multiplication;
      case TokenType.StarStar:
        return BP.Exponent;
      case TokenType.Dot:
        return BP.Postfix;
      case TokenType.LBracket:
        return this.inRangeEnd ? BP.None : BP.Postfix;
      case TokenType.LParen:
        return BP.Postfix;
      case TokenType.Instance:
        return BP.Comparison;
      case TokenType.In:
        return this.inLetValue ? BP.None : BP.Comparison;
      case TokenType.Between:
        return BP.Comparison;
      case TokenType.Pipe:
        return BP.Pipeline;
      default:
        return BP.None;
    }
  }

  private parseInfix(left: AstNode, _bp: number): AstNode {
    const tok = this.advance();
    const leftStart = left.loc.start;

    switch (tok.type) {
      case TokenType.Or: {
        const right = this.parseExpr(BP.Or);
        return {
          type: 'BinaryOp',
          op: 'or',
          left,
          right,
          loc: { start: leftStart, end: right.loc.end },
        };
      }
      case TokenType.And: {
        const right = this.parseExpr(BP.And);
        return {
          type: 'BinaryOp',
          op: 'and',
          left,
          right,
          loc: { start: leftStart, end: right.loc.end },
        };
      }
      case TokenType.Eq: {
        const right = this.parseExpr(BP.Comparison);
        return {
          type: 'BinaryOp',
          op: '=',
          left,
          right,
          loc: { start: leftStart, end: right.loc.end },
        };
      }
      case TokenType.NEq: {
        const right = this.parseExpr(BP.Comparison);
        return {
          type: 'BinaryOp',
          op: '!=',
          left,
          right,
          loc: { start: leftStart, end: right.loc.end },
        };
      }
      case TokenType.Lt: {
        const right = this.parseExpr(BP.Comparison);
        return {
          type: 'BinaryOp',
          op: '<',
          left,
          right,
          loc: { start: leftStart, end: right.loc.end },
        };
      }
      case TokenType.Gt: {
        const right = this.parseExpr(BP.Comparison);
        return {
          type: 'BinaryOp',
          op: '>',
          left,
          right,
          loc: { start: leftStart, end: right.loc.end },
        };
      }
      case TokenType.LtEq: {
        const right = this.parseExpr(BP.Comparison);
        return {
          type: 'BinaryOp',
          op: '<=',
          left,
          right,
          loc: { start: leftStart, end: right.loc.end },
        };
      }
      case TokenType.GtEq: {
        const right = this.parseExpr(BP.Comparison);
        return {
          type: 'BinaryOp',
          op: '>=',
          left,
          right,
          loc: { start: leftStart, end: right.loc.end },
        };
      }
      case TokenType.DotDot: {
        // Bare range expression (e.g. in `for i in date1..date2`)
        const right = this.parseExpr(BP.Range);
        return {
          type: 'RangeLiteral',
          startIncluded: true,
          endIncluded: true,
          start: left,
          end: right,
          bare: true,
          loc: { start: leftStart, end: right.loc.end },
        };
      }
      case TokenType.Plus: {
        const right = this.parseExpr(BP.Addition);
        return {
          type: 'BinaryOp',
          op: '+',
          left,
          right,
          loc: { start: leftStart, end: right.loc.end },
        };
      }
      case TokenType.Minus: {
        const right = this.parseExpr(BP.Addition);
        return {
          type: 'BinaryOp',
          op: '-',
          left,
          right,
          loc: { start: leftStart, end: right.loc.end },
        };
      }
      case TokenType.Star: {
        const right = this.parseExpr(BP.Multiplication);
        return {
          type: 'BinaryOp',
          op: '*',
          left,
          right,
          loc: { start: leftStart, end: right.loc.end },
        };
      }
      case TokenType.Slash: {
        const right = this.parseExpr(BP.Multiplication);
        return {
          type: 'BinaryOp',
          op: '/',
          left,
          right,
          loc: { start: leftStart, end: right.loc.end },
        };
      }
      case TokenType.StarStar: {
        const right = this.parseExpr(BP.Exponent);
        return {
          type: 'BinaryOp',
          op: '**',
          left,
          right,
          loc: { start: leftStart, end: right.loc.end },
        };
      }

      case TokenType.Dot: {
        const dotStart = leftStart;
        if (this.check(TokenType.String)) {
          const quoted = this.advance();
          return {
            type: 'PathExpression',
            object: left,
            path: quoted.value,
            loc: this.buildLoc(dotStart),
          };
        }
        const first = this.expect(TokenType.Name);
        let path = first.value;
        while (this.check(TokenType.Name)) {
          const candidate = `${path} ${this.peek().value}`;
          if (
            !MULTI_WORD_PATH_CONTINUATIONS.has(candidate) &&
            !this.knownNames.has(candidate) &&
            ![...this.knownNames].some((n) => n.startsWith(`${candidate} `))
          )
            break;
          path += ` ${this.advance().value}`;
        }
        return { type: 'PathExpression', object: left, path, loc: this.buildLoc(dotStart) };
      }

      case TokenType.LBracket: {
        if (this.check(TokenType.RBracket)) {
          this.advance();
          return {
            type: 'FilterExpression',
            list: left,
            filter: { type: 'NullLiteral', loc: this.buildLoc(leftStart) },
            loc: this.buildLoc(leftStart),
          };
        }
        const filter = this.parseExpr();
        this.expect(TokenType.RBracket);
        return { type: 'FilterExpression', list: left, filter, loc: this.buildLoc(leftStart) };
      }

      case TokenType.LParen:
        return this.parseFunctionCallArgs(left);

      case TokenType.Instance: {
        this.expect(TokenType.Of);
        const targetType = this.parseFeelType();
        return { type: 'InstanceOf', value: left, targetType, loc: this.buildLoc(leftStart) };
      }

      case TokenType.In: {
        let test: AstNode;
        if (this.check(TokenType.LParen)) {
          this.advance();
          if (this.check(TokenType.DotDot)) {
            this.advance();
            const end = this.parseRangeEnd();
            test = {
              type: 'RangeLiteral',
              startIncluded: false,
              endIncluded: end.endIncluded,
              start: null,
              end: end.node,
              loc: this.buildLoc(leftStart),
            };
          } else {
            const first = this.parseExpr(BP.Range);
            if (this.check(TokenType.DotDot)) {
              this.advance();
              if (this.check(TokenType.RBracket) || this.check(TokenType.RParen)) {
                const endIncluded = this.check(TokenType.RBracket);
                this.advance();
                test = {
                  type: 'RangeLiteral',
                  startIncluded: false,
                  endIncluded,
                  start: first,
                  end: null,
                  loc: this.buildLoc(leftStart),
                };
              } else {
                const end = this.parseRangeEnd();
                test = {
                  type: 'RangeLiteral',
                  startIncluded: false,
                  endIncluded: end.endIncluded,
                  start: first,
                  end: end.node,
                  loc: this.buildLoc(leftStart),
                };
              }
            } else if (this.check(TokenType.Comma) || this.check(TokenType.RParen)) {
              const tests: AstNode[] = [first];
              while (this.match(TokenType.Comma)) {
                if (this.check(TokenType.RParen)) break;
                tests.push(this.parseExpr());
              }
              this.expect(TokenType.RParen);
              test =
                tests.length === 1
                  ? tests[0]!
                  : { type: 'UnaryTestList', tests, negated: false, loc: this.buildLoc(leftStart) };
            } else {
              this.expect(TokenType.RParen);
              test = first;
            }
          }
        } else {
          test = this.parseExpr(BP.Comparison);
        }
        return { type: 'InExpression', value: left, test, loc: this.buildLoc(leftStart) };
      }

      case TokenType.Between: {
        const low = this.parseExpr(BP.Addition);
        this.expect(TokenType.And);
        const high = this.parseExpr(BP.Addition);
        return { type: 'BetweenExpression', value: left, low, high, loc: this.buildLoc(leftStart) };
      }

      case TokenType.Pipe: {
        const right = this.parseExpr(BP.Pipeline);
        return {
          type: 'PipelineExpression',
          left,
          right,
          loc: { start: leftStart, end: right.loc.end },
        };
      }

      default: {
        this.addError(`Unexpected infix token: ${tok.type}`, tok.start, tok.end);
        return {
          type: 'ErrorNode',
          message: `Unexpected infix token: ${tok.type}`,
          loc: { start: tok.start, end: tok.end },
        };
      }
    }
  }

  private parseList(): AstNode {
    const start = this.peek().start;
    this.expect(TokenType.LBracket);

    if (this.check(TokenType.RBracket)) {
      this.advance();
      return { type: 'ListLiteral', elements: [], loc: this.buildLoc(start) };
    }

    if (this.check(TokenType.DotDot)) {
      this.advance();
      const end = this.parseRangeEnd();
      return {
        type: 'RangeLiteral',
        startIncluded: true,
        endIncluded: end.endIncluded,
        start: null,
        end: end.node,
        loc: this.buildLoc(start),
      };
    }

    const first = this.parseExpr(BP.Range);

    if (this.check(TokenType.DotDot)) {
      this.advance();
      if (this.check(TokenType.RBracket) || this.check(TokenType.RParen)) {
        const endIncluded = this.check(TokenType.RBracket);
        this.advance();
        return {
          type: 'RangeLiteral',
          startIncluded: true,
          endIncluded,
          start: first,
          end: null,
          loc: this.buildLoc(start),
        };
      }
      const end = this.parseRangeEnd();
      return {
        type: 'RangeLiteral',
        startIncluded: true,
        endIncluded: end.endIncluded,
        start: first,
        end: end.node,
        loc: this.buildLoc(start),
      };
    }

    const elements: AstNode[] = [first];
    while (this.match(TokenType.Comma)) {
      if (this.check(TokenType.RBracket)) break;
      elements.push(this.parseExpr());
    }
    this.expect(TokenType.RBracket);
    return { type: 'ListLiteral', elements, loc: this.buildLoc(start) };
  }

  private parseRangeEnd(): { node: AstNode; endIncluded: boolean } {
    this.inRangeEnd = true;
    const node = this.parseExpr(BP.Range);
    this.inRangeEnd = false;
    if (this.match(TokenType.RBracket)) return { node, endIncluded: true };
    if (this.match(TokenType.RParen)) return { node, endIncluded: false };
    if (this.match(TokenType.LBracket)) return { node, endIncluded: false };
    const badTok = this.peek();
    this.addError(
      `Expected range end delimiter ] ) or [, got ${badTok.type}`,
      badTok.start,
      badTok.end,
    );
    return { node, endIncluded: false };
  }

  private parseParenOrOpenRange(parenStart: number): AstNode {
    if (this.check(TokenType.DotDot)) {
      this.advance();
      const end = this.parseRangeEnd();
      return {
        type: 'RangeLiteral',
        startIncluded: false,
        endIncluded: end.endIncluded,
        start: null,
        end: end.node,
        loc: this.buildLoc(parenStart),
      };
    }

    const rangeStart = this.parseExpr(BP.Range);

    if (this.check(TokenType.DotDot)) {
      this.advance();
      if (this.check(TokenType.RBracket) || this.check(TokenType.RParen)) {
        const endIncluded = this.check(TokenType.RBracket);
        this.advance();
        return {
          type: 'RangeLiteral',
          startIncluded: false,
          endIncluded,
          start: rangeStart,
          end: null,
          loc: this.buildLoc(parenStart),
        };
      }
      const end = this.parseRangeEnd();
      return {
        type: 'RangeLiteral',
        startIncluded: false,
        endIncluded: end.endIncluded,
        start: rangeStart,
        end: end.node,
        loc: this.buildLoc(parenStart),
      };
    }

    let result = rangeStart;
    while (true) {
      const bp = this.infixBP();
      if (bp <= BP.None) break;
      result = this.parseInfix(result, bp);
    }

    this.expect(TokenType.RParen);
    return result;
  }

  private parseContext(): AstNode {
    const start = this.peek().start;
    this.expect(TokenType.LBrace);
    const entries: ContextEntry[] = [];

    if (!this.check(TokenType.RBrace)) {
      do {
        const keyTok = this.peek();
        let key: string | AstNode;

        if (keyTok.type === TokenType.LBracket) {
          this.advance();
          key = this.parseExpr();
          this.expect(TokenType.RBracket);
        } else if (keyTok.type === TokenType.String) {
          this.advance();
          key = keyTok.value;
        } else if (keyTok.type === TokenType.Name) {
          key = this.readMultiWordName();
        } else {
          this.addError(`Expected context key, got ${keyTok.type}`, keyTok.start, keyTok.end);
          this.synchronize();
          continue;
        }

        this.expect(TokenType.Colon);
        const value = this.parseExpr();
        entries.push({ key, value });
      } while (this.match(TokenType.Comma));
    }

    this.expect(TokenType.RBrace);
    return { type: 'ContextLiteral', entries, loc: this.buildLoc(start) };
  }

  private readMultiWordName(): string {
    const seed = this.expect(TokenType.Name).value;
    let name = this.extendName(seed);
    while (
      (this.check(TokenType.Plus) ||
        this.check(TokenType.Minus) ||
        this.check(TokenType.Star) ||
        this.check(TokenType.Slash)) &&
      this.pos + 1 < this.tokens.length &&
      this.tokens[this.pos + 1]?.type === TokenType.Name
    ) {
      const op = this.advance().value;
      name += op + this.advance().value;
      name = this.extendName(name);
    }
    return name;
  }

  private parseIf(): AstNode {
    const start = this.peek().start;
    this.expect(TokenType.If);
    const condition = this.parseExpr();
    this.expect(TokenType.Then);
    const consequent = this.parseExpr();
    this.expect(TokenType.Else);
    const alternate = this.parseExpr();
    return { type: 'IfExpression', condition, consequent, alternate, loc: this.buildLoc(start) };
  }

  private parseFor(): AstNode {
    const start = this.peek().start;
    this.expect(TokenType.For);
    const bindings: Array<{ name: string; domain: AstNode }> = [];

    do {
      const name = this.expect(TokenType.Name).value;
      this.expect(TokenType.In);
      const domain = this.parseExpr();
      bindings.push({ name, domain });
    } while (this.match(TokenType.Comma));

    this.expect(TokenType.Return);
    const body = this.parseExpr();
    return { type: 'ForExpression', bindings, body, loc: this.buildLoc(start) };
  }

  private parseQuantified(): AstNode {
    const start = this.peek().start;
    const isEvery = this.check(TokenType.Every);
    this.advance();
    const quantifier: 'some' | 'every' = isEvery ? 'every' : 'some';
    const bindings: Array<{ name: string; domain: AstNode }> = [];

    do {
      const name = this.expect(TokenType.Name).value;
      this.expect(TokenType.In);
      const domain = this.parseExpr();
      bindings.push({ name, domain });
    } while (this.match(TokenType.Comma));

    this.expect(TokenType.Satisfies);
    const condition = this.parseExpr();
    return {
      type: 'QuantifiedExpression',
      quantifier,
      bindings,
      condition,
      loc: this.buildLoc(start),
    };
  }

  private parseFunctionDef(): AstNode {
    const start = this.peek().start;
    this.expect(TokenType.Function);
    this.expect(TokenType.LParen);

    const params: Array<{ name: string; type?: string }> = [];
    if (!this.check(TokenType.RParen)) {
      do {
        const name = this.expect(TokenType.Name).value;
        let typeAnnotation: string | undefined;
        if (this.match(TokenType.Colon)) {
          const typeParts: string[] = [];
          while (
            !this.check(TokenType.Comma) &&
            !this.check(TokenType.RParen) &&
            !this.check(TokenType.EOF)
          ) {
            typeParts.push(this.advance().value);
          }
          typeAnnotation = typeParts.join(' ').trim() || undefined;
        }
        params.push(typeAnnotation !== undefined ? { name, type: typeAnnotation } : { name });
      } while (this.match(TokenType.Comma));
    }
    this.expect(TokenType.RParen);

    let external = false;
    let body: AstNode;
    if (this.check(TokenType.External)) {
      this.advance();
      external = true;
      body = this.parseExpr();
    } else {
      body = this.parseExpr();
    }

    return { type: 'FunctionDefinition', params, body, external, loc: this.buildLoc(start) };
  }

  private parseFunctionCallArgs(callee: AstNode): AstNode {
    const callStart = callee.loc.start;
    const args: Array<{ name?: string; value: AstNode }> = [];

    if (!this.check(TokenType.RParen)) {
      do {
        const saved = this.pos;
        if (this.check(TokenType.Name)) {
          let paramName = this.advance().value;
          while (true) {
            if (
              this.check(TokenType.Minus) &&
              this.pos + 1 < this.tokens.length &&
              this.tokens[this.pos + 1]?.type === TokenType.Name
            ) {
              this.advance();
              paramName += `-${this.advance().value}`;
            } else if (
              this.check(TokenType.Dot) &&
              this.pos + 1 < this.tokens.length &&
              this.tokens[this.pos + 1]?.type === TokenType.Name
            ) {
              this.advance();
              paramName += `.${this.advance().value}`;
            } else if (this.check(TokenType.Name)) {
              paramName += ` ${this.advance().value}`;
            } else {
              break;
            }
          }
          if (this.check(TokenType.Colon)) {
            this.advance();
            const value = this.parseExpr();
            args.push({ name: paramName, value });
            continue;
          }
          this.pos = saved;
        }
        const value = this.parseExpr();
        args.push({ value });
      } while (this.match(TokenType.Comma));
    }

    this.expect(TokenType.RParen);
    return { type: 'FunctionCall', callee, args, loc: this.buildLoc(callStart) };
  }

  private parseName(): AstNode {
    const tok = this.advance();
    const name = this.extendName(tok.value);
    return { type: 'Identifier', name, loc: this.buildLoc(tok.start) };
  }

  private extendName(seed: string): string {
    let name = seed;

    let collecting = true;
    while (collecting) {
      if (this.check(TokenType.Name) || this.check(TokenType.Number)) {
        name += ` ${this.advance().value}`;
      } else if (this.check(TokenType.Minus) && this.pos + 1 < this.tokens.length) {
        const next = this.tokens[this.pos + 1];
        if (!next || (next.type !== TokenType.Name && next.type !== TokenType.Number)) {
          collecting = false;
          break;
        }
        const candidate = `${name}-${next.value}`;
        if (
          !this.knownNames.has(candidate) &&
          ![...this.knownNames].some(
            (n) => n.startsWith(`${candidate}-`) || n.startsWith(`${candidate} `),
          )
        ) {
          collecting = false;
          break;
        }
        this.advance();
        name = `${name}-${this.advance().value}`;
      } else {
        collecting = false;
      }
    }

    const keywordTypes = [
      TokenType.Of,
      TokenType.And,
      TokenType.In,
      TokenType.Or,
      TokenType.For,
      TokenType.Else,
    ];
    const namePartTokenTypes = new Set([TokenType.Name, TokenType.Number, TokenType.Else]);
    let extended = true;
    while (extended) {
      extended = false;
      for (const kwType of keywordTypes) {
        if (!this.check(kwType)) continue;
        const kwTok = this.peek();
        const kwCandidate = `${name} ${kwTok.value}`;
        const next = this.tokens[this.pos + 1];
        const hasNextName = next && namePartTokenTypes.has(next.type);
        if (KNOWN_NAMES.has(kwCandidate) || this.knownNames.has(kwCandidate)) {
          this.advance();
          name = kwCandidate;
          extended = true;
          break;
        }
        if (!hasNextName) break;
        const candidate = `${kwCandidate} ${next.value}`;
        const isKnown =
          KNOWN_NAME_PREFIXES.has(candidate) ||
          KNOWN_NAMES.has(candidate) ||
          this.knownNames.has(candidate) ||
          [...this.knownNames].some((n) => n.startsWith(`${candidate} `));
        if (!isKnown) break;
        this.advance();
        name = `${kwCandidate} ${this.advance().value}`;
        while (this.check(TokenType.Name) || this.check(TokenType.Number)) {
          name += ` ${this.advance().value}`;
        }
        extended = true;
        break;
      }
    }

    while (this.check(TokenType.Of) && this.pos + 1 < this.tokens.length) {
      const next = this.tokens[this.pos + 1];
      if (!next || (next.type !== TokenType.Name && next.type !== TokenType.Number)) break;
      name += ` ${this.advance().value}`;
      name += ` ${this.advance().value}`;
      while (this.check(TokenType.Name) || this.check(TokenType.Number)) {
        name += ` ${this.advance().value}`;
      }
    }

    return name;
  }

  private parseFeelType(): FeelType {
    const tok = this.peek();

    if (tok.type === TokenType.Function) {
      this.advance();
      if (this.match(TokenType.Lt)) {
        const paramTypes: FeelType[] = [];
        if (!this.check(TokenType.Gt)) {
          do {
            paramTypes.push(this.parseFeelType());
          } while (this.match(TokenType.Comma));
        }
        this.expect(TokenType.Gt);
        let returnType: FeelType | undefined;
        if (this.check(TokenType.Arrow)) {
          this.advance();
          returnType = this.parseFeelType();
        }
        const ft1: FeelType =
          returnType !== undefined
            ? { name: 'function', paramTypes, returnType }
            : { name: 'function', paramTypes };
        return ft1;
      }
      return { name: 'function' };
    }

    if (tok.type === TokenType.Name) {
      const name = tok.value;
      this.advance();

      switch (name) {
        case 'Any':
          return { name: 'Any' };
        case 'Null':
          return { name: 'Null' };
        case 'number':
          return { name: 'number' };
        case 'string':
          return { name: 'string' };
        case 'boolean':
          return { name: 'boolean' };
        case 'date': {
          if (this.check(TokenType.And)) {
            const saved = this.pos;
            this.advance();
            if (this.check(TokenType.Name) && this.peek().value === 'time') {
              this.advance();
              return { name: 'date and time' };
            }
            this.pos = saved;
          }
          return { name: 'date' };
        }
        case 'time':
          return { name: 'time' };
        case 'duration':
          return { name: 'duration' };
        case 'days': {
          if (this.check(TokenType.And)) {
            const saved = this.pos;
            this.advance();
            if (this.check(TokenType.Name) && this.peek().value === 'time') {
              this.advance();
              if (this.check(TokenType.Name) && this.peek().value === 'duration') {
                this.advance();
                return { name: 'days and time duration' };
              }
            }
            this.pos = saved;
          }
          return { name: 'Unknown' };
        }
        case 'years': {
          if (this.check(TokenType.And)) {
            const saved = this.pos;
            this.advance();
            if (this.check(TokenType.Name) && this.peek().value === 'months') {
              this.advance();
              if (this.check(TokenType.Name) && this.peek().value === 'duration') {
                this.advance();
                return { name: 'years and months duration' };
              }
            }
            this.pos = saved;
          }
          return { name: 'Unknown' };
        }
        case 'context': {
          if (this.match(TokenType.Lt)) {
            const properties: Array<{ name: string; type: FeelType }> = [];
            if (!this.check(TokenType.Gt)) {
              do {
                const propName = this.check(TokenType.Name) ? this.advance().value : '';
                this.expect(TokenType.Colon);
                const propType = this.parseFeelType();
                if (propName) properties.push({ name: propName, type: propType });
              } while (this.match(TokenType.Comma));
            }
            this.expect(TokenType.Gt);
            return { name: 'context', properties };
          }
          return { name: 'context' };
        }
        case 'range': {
          if (this.match(TokenType.Lt)) {
            const elementType = this.parseFeelType();
            this.expect(TokenType.Gt);
            return { name: 'range', elementType };
          }
          return { name: 'range' };
        }
        case 'list': {
          if (this.match(TokenType.Lt)) {
            const elementType = this.parseFeelType();
            this.expect(TokenType.Gt);
            return { name: 'list', elementType };
          }
          return { name: 'list' };
        }
        case 'function': {
          if (this.match(TokenType.Lt)) {
            const paramTypes: FeelType[] = [];
            if (!this.check(TokenType.Gt) && !this.checkValue('->')) {
              do {
                paramTypes.push(this.parseFeelType());
              } while (this.match(TokenType.Comma));
            }
            let returnType: FeelType | undefined;
            if (this.check(TokenType.Arrow)) {
              this.advance();
              returnType = this.parseFeelType();
            }
            this.expect(TokenType.Gt);
            const ft2: FeelType =
              returnType !== undefined
                ? { name: 'function', paramTypes, returnType }
                : { name: 'function', paramTypes };
            return ft2;
          }
          return { name: 'function' };
        }
        default:
          return { name: 'Unknown', ref: name };
      }
    }

    if (tok.value === 'years') {
      this.advance();
      this.expect(TokenType.And);
      this.expect(TokenType.Name); // months
      this.expect(TokenType.Name); // duration
      return { name: 'years and months duration' };
    }

    return { name: 'Unknown' };
  }

  private parseUnaryTestList(): AstNode[] {
    const tests: AstNode[] = [];
    if (this.check(TokenType.RParen) || this.check(TokenType.EOF)) return tests;
    do {
      tests.push(this.parseExpr());
    } while (this.match(TokenType.Comma));
    return tests;
  }

  parseUnaryTests(): AstNode {
    const start = this.peek().start;
    if (this.check(TokenType.Minus) && this.tokens[this.pos + 1]?.type === TokenType.EOF) {
      this.advance();
      return { type: 'UnaryTestList', tests: [], negated: false, loc: this.buildLoc(start) };
    }

    const tests: AstNode[] = [];
    do {
      if (this.check(TokenType.EOF)) break;
      tests.push(this.parseExpr());
    } while (this.match(TokenType.Comma));

    return { type: 'UnaryTestList', tests, negated: false, loc: this.buildLoc(start) };
  }
}
