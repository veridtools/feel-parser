// AST node types for the FEEL language

export interface Loc {
  start: number;
  end: number;
}

export class ParseSyntaxError extends Error {
  constructor(
    message: string,
    public readonly start: number,
    public readonly end: number,
  ) {
    super(message);
    this.name = 'ParseSyntaxError';
  }
}

export type ParseResult = {
  ast: AstNode;
  errors: ParseSyntaxError[];
};

export type AstNode =
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | NullLiteral
  | TemporalLiteral
  | Identifier
  | UnaryMinus
  | BinaryOp
  | IfExpression
  | ForExpression
  | QuantifiedExpression
  | FunctionDefinition
  | FunctionCall
  | PathExpression
  | FilterExpression
  | RangeLiteral
  | ListLiteral
  | ContextLiteral
  | UnaryTestList
  | InstanceOf
  | InExpression
  | BetweenExpression
  | LetExpression
  | PipelineExpression
  | ErrorNode;

export interface ErrorNode {
  type: 'ErrorNode';
  message: string;
  loc: Loc;
}

export interface NumberLiteral {
  type: 'NumberLiteral';
  value: string; // raw lexer text — converted to Decimal in evaluator
  loc: Loc;
}

export interface StringLiteral {
  type: 'StringLiteral';
  value: string;
  loc: Loc;
}

export interface BooleanLiteral {
  type: 'BooleanLiteral';
  value: boolean;
  loc: Loc;
}

export interface NullLiteral {
  type: 'NullLiteral';
  loc: Loc;
}

export interface TemporalLiteral {
  type: 'TemporalLiteral';
  value: string;
  loc: Loc;
}

export interface Identifier {
  type: 'Identifier';
  name: string;
  loc: Loc;
}

export interface UnaryMinus {
  type: 'UnaryMinus';
  operand: AstNode;
  loc: Loc;
}

export interface BinaryOp {
  type: 'BinaryOp';
  op: '+' | '-' | '*' | '/' | '**' | '=' | '!=' | '<' | '>' | '<=' | '>=' | 'and' | 'or';
  left: AstNode;
  right: AstNode;
  loc: Loc;
}

export interface IfExpression {
  type: 'IfExpression';
  condition: AstNode;
  consequent: AstNode;
  alternate: AstNode;
  loc: Loc;
}

export interface ForExpression {
  type: 'ForExpression';
  bindings: Array<{ name: string; domain: AstNode }>;
  body: AstNode;
  loc: Loc;
}

export interface QuantifiedExpression {
  type: 'QuantifiedExpression';
  quantifier: 'some' | 'every';
  bindings: Array<{ name: string; domain: AstNode }>;
  condition: AstNode;
  loc: Loc;
}

export interface FunctionDefinition {
  type: 'FunctionDefinition';
  params: Array<{ name: string; type?: string }>;
  body: AstNode;
  external: boolean;
  loc: Loc;
}

export interface FunctionCall {
  type: 'FunctionCall';
  callee: AstNode;
  args: Array<{ name?: string; value: AstNode }>;
  loc: Loc;
}

export interface PathExpression {
  type: 'PathExpression';
  object: AstNode;
  path: string;
  loc: Loc;
}

export interface FilterExpression {
  type: 'FilterExpression';
  list: AstNode;
  filter: AstNode;
  loc: Loc;
}

export interface RangeLiteral {
  type: 'RangeLiteral';
  startIncluded: boolean;
  endIncluded: boolean;
  start: AstNode | null; // null = unbounded
  end: AstNode | null; // null = unbounded
  bare?: boolean; // true = unbracketed a..b form (allows descending in for loops)
  loc: Loc;
}

export interface ListLiteral {
  type: 'ListLiteral';
  elements: AstNode[];
  loc: Loc;
}

export interface ContextEntry {
  key: string | AstNode; // string for simple keys, AstNode for computed keys
  value: AstNode;
}

export interface ContextLiteral {
  type: 'ContextLiteral';
  entries: ContextEntry[];
  loc: Loc;
}

// Unary test list: "> 1, < 10, null" (comma-separated unary tests)
export interface UnaryTestList {
  type: 'UnaryTestList';
  tests: AstNode[];
  negated: boolean;
  loc: Loc;
}

export interface InstanceOf {
  type: 'InstanceOf';
  value: AstNode;
  targetType: FeelType;
  loc: Loc;
}

export interface InExpression {
  type: 'InExpression';
  value: AstNode;
  test: AstNode;
  loc: Loc;
}

export interface BetweenExpression {
  type: 'BetweenExpression';
  value: AstNode;
  low: AstNode;
  high: AstNode;
  loc: Loc;
}

export interface LetExpression {
  type: 'LetExpression';
  name: string;
  value: AstNode;
  body: AstNode;
  loc: Loc;
}

export interface PipelineExpression {
  type: 'PipelineExpression';
  left: AstNode;
  right: AstNode;
  loc: Loc;
}

// FEEL type system (for instance of)
export type FeelType =
  | { name: 'Any' }
  | { name: 'Null' }
  | { name: 'number' }
  | { name: 'string' }
  | { name: 'boolean' }
  | { name: 'date' }
  | { name: 'time' }
  | { name: 'date and time' }
  | { name: 'duration' }
  | { name: 'years and months duration' }
  | { name: 'days and time duration' }
  | { name: 'context'; properties?: Array<{ name: string; type: FeelType }> }
  | { name: 'list'; elementType?: FeelType }
  | { name: 'function'; paramTypes?: FeelType[]; returnType?: FeelType }
  | { name: 'range'; elementType?: FeelType }
  | { name: 'Unknown'; ref?: string }; // Unknown includes user-defined type refs (ref = original name)
