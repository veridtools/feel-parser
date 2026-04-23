import type { AstNode } from './parser/ast.js';

export type Visitor = Partial<{
  [K in AstNode['type']]: (node: Extract<AstNode, { type: K }>) => void;
}>;

export function walk(node: AstNode, visitor: Visitor): void {
  const fn = visitor[node.type] as ((n: AstNode) => void) | undefined;
  fn?.(node);

  switch (node.type) {
    case 'NumberLiteral':
    case 'StringLiteral':
    case 'BooleanLiteral':
    case 'NullLiteral':
    case 'TemporalLiteral':
    case 'Identifier':
      break;
    case 'UnaryMinus':
      walk(node.operand, visitor);
      break;
    case 'BinaryOp':
      walk(node.left, visitor);
      walk(node.right, visitor);
      break;
    case 'IfExpression':
      walk(node.condition, visitor);
      walk(node.consequent, visitor);
      walk(node.alternate, visitor);
      break;
    case 'ForExpression':
      for (const b of node.bindings) walk(b.domain, visitor);
      walk(node.body, visitor);
      break;
    case 'QuantifiedExpression':
      for (const b of node.bindings) walk(b.domain, visitor);
      walk(node.condition, visitor);
      break;
    case 'FunctionDefinition':
      walk(node.body, visitor);
      break;
    case 'FunctionCall':
      walk(node.callee, visitor);
      for (const a of node.args) walk(a.value, visitor);
      break;
    case 'PathExpression':
      walk(node.object, visitor);
      break;
    case 'FilterExpression':
      walk(node.list, visitor);
      walk(node.filter, visitor);
      break;
    case 'RangeLiteral':
      if (node.start !== null) walk(node.start, visitor);
      if (node.end !== null) walk(node.end, visitor);
      break;
    case 'ListLiteral':
      for (const e of node.elements) walk(e, visitor);
      break;
    case 'ContextLiteral':
      for (const e of node.entries) {
        if (typeof e.key !== 'string') walk(e.key, visitor);
        walk(e.value, visitor);
      }
      break;
    case 'UnaryTestList':
      for (const t of node.tests) walk(t, visitor);
      break;
    case 'InstanceOf':
      walk(node.value, visitor);
      break;
    case 'InExpression':
      walk(node.value, visitor);
      walk(node.test, visitor);
      break;
    case 'BetweenExpression':
      walk(node.value, visitor);
      walk(node.low, visitor);
      walk(node.high, visitor);
      break;
    case 'LetExpression':
      walk(node.value, visitor);
      walk(node.body, visitor);
      break;
    case 'PipelineExpression':
      walk(node.left, visitor);
      walk(node.right, visitor);
      break;
    case 'ErrorNode':
      break;
  }
}
