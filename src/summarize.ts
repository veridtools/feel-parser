import type { Token } from './lexer/index.js';
import type { AstNode } from './parser/ast.js';
import type { FeelDialect } from './types.js';
import { type Visitor, walk } from './walker.js';

const NODE_TYPES: ReadonlyArray<AstNode['type']> = [
  'NumberLiteral',
  'StringLiteral',
  'BooleanLiteral',
  'NullLiteral',
  'TemporalLiteral',
  'Identifier',
  'UnaryMinus',
  'BinaryOp',
  'IfExpression',
  'ForExpression',
  'QuantifiedExpression',
  'FunctionDefinition',
  'FunctionCall',
  'PathExpression',
  'FilterExpression',
  'RangeLiteral',
  'ListLiteral',
  'ContextLiteral',
  'UnaryTestList',
  'InstanceOf',
  'InExpression',
  'BetweenExpression',
  'LetExpression',
  'PipelineExpression',
] as const;

function rootDetail(ast: AstNode): string {
  if (ast.type === 'BinaryOp') return `  (op: ${ast.op})`;
  if (ast.type === 'Identifier') return `  ("${ast.name}")`;
  if (ast.type === 'UnaryTestList')
    return `  (tests: ${ast.tests.length}${ast.negated ? ', negated' : ''})`;
  if (ast.type === 'FunctionCall' && ast.callee.type === 'Identifier')
    return `  ("${ast.callee.name}")`;
  return '';
}

export function summarize(ast: AstNode, tokens: Token[], dialect: FeelDialect): string {
  const counts = new Map<string, number>();
  const visitor = Object.fromEntries(
    NODE_TYPES.map((t) => [t, () => counts.set(t, (counts.get(t) ?? 0) + 1)]),
  ) as Visitor;
  walk(ast, visitor);

  const totalNodes = [...counts.values()].reduce((a, b) => a + b, 0);

  const lines: string[] = [
    `dialect:   ${dialect}`,
    `root:      ${ast.type}${rootDetail(ast)}`,
    `loc:       ${ast.loc.start} → ${ast.loc.end}`,
    `tokens:    ${tokens.length}`,
    `nodes:     ${totalNodes}`,
  ];

  if (counts.size > 0) {
    lines.push('');
    lines.push('Node types:');
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const maxLen = Math.max(...sorted.map(([t]) => t.length));
    for (const [type, count] of sorted) {
      lines.push(`  ${type.padEnd(maxLen)}   ${count}`);
    }
  }

  return lines.join('\n');
}
