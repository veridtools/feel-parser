import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, tokenize } from '../src/index.js';

const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '../package.json');
const { version } = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string };

const BANNER = `
██╗   ██╗███████╗██████╗ ██╗██████╗ ████████╗ ██████╗  ██████╗ ██╗     ███████╗
██║   ██║██╔════╝██╔══██╗██║██╔══██╗╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██╔════╝
██║   ██║█████╗  ██████╔╝██║██║  ██║   ██║   ██║   ██║██║   ██║██║     ███████╗
╚██╗ ██╔╝██╔══╝  ██╔══██╗██║██║  ██║   ██║   ██║   ██║██║   ██║██║     ╚════██║
 ╚████╔╝ ███████╗██║  ██║██║██████╔╝   ██║   ╚██████╔╝╚██████╔╝███████╗███████║
  ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═╝╚═════╝    ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚══════╝
`.trimStart();

const HELP = `${BANNER}
@veridtools/feel-parser v${version} — FEEL expression lexer and parser

Usage:
  feel-parser <expression> [options]
  feel-parser - [options]          Read expression from stdin

Options:
  -d, --dialect <dialect>         Parsing dialect: expression (default) or unary-tests
  -k, --known-names <names>       Comma-separated list of multi-word known names
  -t, --tokens                    Output token list instead of AST
  -n, --no-color                  Disable ANSI colors
  -h, --help                      Show this help

Examples:
  feel-parser "1 + 2"
  feel-parser "Monthly Salary * 12" --known-names "Monthly Salary"
  feel-parser "> 100, <= 200" --dialect unary-tests
  feel-parser "date(2024, 1, 1)" --tokens
  echo "a + b" | feel-parser -
`;

const KNOWN_FLAGS = new Set([
  '--dialect',
  '-d',
  '--known-names',
  '-k',
  '--tokens',
  '-t',
  '--no-color',
  '-n',
  '--help',
  '-h',
]);

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  process.stdout.write(HELP);
  process.exit(0);
}

function getFlag(short: string, long: string): string | undefined {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === short || args[i] === long) {
      return args[i + 1];
    }
    const prefix = `${long}=`;
    if (args[i]?.startsWith(prefix)) {
      return args[i]?.slice(prefix.length);
    }
  }
  return undefined;
}

function hasFlag(short: string, long: string): boolean {
  return args.includes(short) || args.includes(long);
}

const dialectRaw = getFlag('-d', '--dialect') ?? 'expression';
if (dialectRaw !== 'expression' && dialectRaw !== 'unary-tests') {
  console.error(`Invalid dialect: "${dialectRaw}". Expected "expression" or "unary-tests".`);
  process.exit(1);
}
const dialect = dialectRaw as 'expression' | 'unary-tests';

const knownNamesRaw = getFlag('-k', '--known-names');
const knownNames = knownNamesRaw
  ? new Set(
      knownNamesRaw
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean),
    )
  : undefined;

const tokensMode = hasFlag('-t', '--tokens');
const noColor = hasFlag('-n', '--no-color') || !!process.env.NO_COLOR || !process.stdout.isTTY;

const unknownFlags = args.filter((a, i) => {
  if (a === '-') return false;
  if (!a.startsWith('-')) return false;
  if (KNOWN_FLAGS.has(a)) return false;
  const prev = args[i - 1];
  if (prev && KNOWN_FLAGS.has(prev) && !prev.startsWith('--')) return false;
  if (a.startsWith('--') && a.includes('=')) {
    const key = a.split('=')[0];
    return key !== undefined && !KNOWN_FLAGS.has(key);
  }
  return true;
});

if (unknownFlags.length > 0) {
  console.error(`Unknown option: ${unknownFlags.join(', ')}`);
  console.error('Run `feel-parser --help` to see available options.');
  process.exit(1);
}

const positional = args.filter((a, i) => {
  if (a !== '-' && a.startsWith('-')) return false;
  const prev = args[i - 1];
  return !(prev && KNOWN_FLAGS.has(prev));
});

const expressionArg = positional[0];

if (!expressionArg) {
  console.error('Missing expression argument. Run `feel-parser --help` for usage.');
  process.exit(1);
}

let expression: string;
if (expressionArg === '-') {
  expression = readFileSync('/dev/stdin', 'utf-8').trim();
} else {
  expression = expressionArg;
}

const DIM = noColor ? '' : '\x1b[2m';
const RESET = noColor ? '' : '\x1b[0m';
const RED = noColor ? '' : '\x1b[31m';
const YELLOW = noColor ? '' : '\x1b[33m';

try {
  if (tokensMode) {
    const tokens = tokenize(expression);
    const rows = tokens.map((t) => ({
      type: t.type,
      value: t.value,
      start: t.start,
      end: t.end,
    }));
    console.log(`${DIM}# ${tokens.length} token(s)${RESET}`);
    console.log(JSON.stringify(rows, null, 2));
  } else {
    const ast = parse(expression, dialect, knownNames);
    console.log(
      `${DIM}# ${dialect}${knownNames ? ` · known: ${[...knownNames].join(', ')}` : ''}${RESET}`,
    );
    console.log(JSON.stringify(ast, null, 2));
  }
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`${RED}Parse error:${RESET} ${YELLOW}${message}${RESET}`);
  process.exit(1);
}
