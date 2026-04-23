<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { safeParse, tokenize } from '../../../src/index.ts';
import { summarize } from '../../../src/summarize.ts';

// ── Quick examples ────────────────────────────────────────────────────────────

const EXAMPLES = [
  // ── Basics ──
  {
    label: 'Arithmetic',
    expr: '(1 + 2) * 3',
    names: '',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  {
    label: 'If-else',
    expr: 'if score >= 700 then "approved" else "declined"',
    names: 'score',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  {
    label: 'Between',
    expr: 'age between 18 and 65',
    names: 'age',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  {
    label: 'In range',
    expr: 'score in [600..850]',
    names: 'score',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  // ── Strings ──
  {
    label: 'String fn',
    expr: 'upper case(substring("hello world", 1, 5))',
    names: '',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  {
    label: 'String join',
    expr: 'string join(["Alice", "Bob", "Carol"], ", ")',
    names: '',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  // ── Lists ──
  {
    label: 'Filter',
    expr: '[{name: "Alice", age: 30}, {name: "Bob", age: 17}][item.age >= 18]',
    names: '',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  {
    label: 'Sort',
    expr: 'sort([3, 1, 4, 1, 5], function(a, b) a < b)',
    names: '',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  {
    label: 'For loop',
    expr: 'for x in 1..5 return x * x',
    names: '',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  {
    label: 'Some / every',
    expr: 'every item in orders satisfies item.amount > 0',
    names: 'orders',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  // ── Context ──
  {
    label: 'Context',
    expr: '{name: "Alice", age: 30, active: true}',
    names: '',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  {
    label: 'Context path',
    expr: 'customer.address.city',
    names: 'customer',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  // ── Functions ──
  {
    label: 'Function def',
    expr: 'function(x, y) if x > y then x else y',
    names: '',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  {
    label: 'Named args',
    expr: 'substring(string: "hello world", start position: 7)',
    names: '',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  // ── Types ──
  {
    label: 'Instance of',
    expr: '[1, 2, 3] instance of list<number>',
    names: '',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  // ── Temporal ──
  {
    label: 'Temporal @',
    expr: '@"2024-06-15" + duration("P30D")',
    names: '',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  {
    label: 'Duration',
    expr: 'years and months duration(date("2020-01-01"), date("2024-06-15"))',
    names: '',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  {
    label: 'Format date',
    expr: 'format date(date("2024-06-15"), "dd/MM/yyyy")',
    names: '',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  {
    label: 'Format number',
    expr: 'format number(1234567.89, "#,##0.00")',
    names: '',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  // ── Advanced ──
  {
    label: 'Multi-word name',
    expr: 'Monthly Salary * 12',
    names: 'Monthly Salary',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  {
    label: 'Let',
    expr: 'let base = 100 in let tax = base * 0.1 in base + tax',
    names: '',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  {
    label: 'Pipeline',
    expr: '"  hello world  " |> trim |> upper case',
    names: '',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  {
    label: 'Recursion',
    expr: '{fact: function(n) if n <= 1 then 1 else n * fact(n - 1)}.fact(5)',
    names: '',
    dialect: 'expression' as const,
    tab: 'summary' as const,
  },
  // ── Unary tests (DMN input cell) ──
  {
    label: 'Unary: comparison',
    expr: '>= 700',
    names: '',
    dialect: 'unary-tests' as const,
    tab: 'summary' as const,
  },
  {
    label: 'Unary: range',
    expr: '[18..65]',
    names: '',
    dialect: 'unary-tests' as const,
    tab: 'summary' as const,
  },
  {
    label: 'Unary: list',
    expr: '"Low","Medium","High"',
    names: '',
    dialect: 'unary-tests' as const,
    tab: 'summary' as const,
  },
  {
    label: 'Unary: not',
    expr: 'not("High","Medium")',
    names: '',
    dialect: 'unary-tests' as const,
    tab: 'summary' as const,
  },
  {
    label: 'Unary: wildcard',
    expr: '-',
    names: '',
    dialect: 'unary-tests' as const,
    tab: 'summary' as const,
  },
  // ── Error recovery ──
  {
    label: 'Error: missing operand',
    expr: '1 +',
    names: '',
    dialect: 'expression' as const,
    tab: 'json' as const,
  },
  {
    label: 'Error: bad list element',
    expr: '[1, *, 3]',
    names: '',
    dialect: 'expression' as const,
    tab: 'json' as const,
  },
  {
    label: 'Error: bad context key',
    expr: '{a: 1, *: 2, c: 3}',
    names: '',
    dialect: 'expression' as const,
    tab: 'json' as const,
  },
  {
    label: 'Error: missing then',
    expr: 'if true 1 else 2',
    names: '',
    dialect: 'expression' as const,
    tab: 'json' as const,
  },
  // ── Tokens ──
  {
    label: 'Tokens',
    expr: 'date and time("2024-01-15T10:30:00")',
    names: '',
    dialect: 'expression' as const,
    tab: 'tokens' as const,
  },
] as const;

// ── State ─────────────────────────────────────────────────────────────────────

const expression = ref('(1 + 2) * 3');
const namesStr = ref('');
const dialect = ref<'expression' | 'unary-tests'>('expression');
const activeTab = ref<'summary' | 'json' | 'tokens'>('summary');
const summaryResult = ref<string | null>(null);
const jsonResult = ref<string | null>(null);
const tokensResult = ref<string | null>(null);
const parseErrors = ref<Array<{ message: string; start: number; end: number }>>([]);
const ran = ref(false);
const selectedExample = ref<string | null>(null);

function run() {
  summaryResult.value = null;
  jsonResult.value = null;
  tokensResult.value = null;
  parseErrors.value = [];
  ran.value = true;

  const knownNames = new Set(
    namesStr.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

  const tokens = tokenize(expression.value);
  tokensResult.value = JSON.stringify(
    tokens.map((t) => ({
      type: t.type,
      value: t.value || undefined,
      start: t.start,
      end: t.end,
    })),
    null,
    2,
  );

  const { ast, errors } = safeParse(expression.value, dialect.value, knownNames);
  parseErrors.value = errors.map((e) => ({ message: e.message, start: e.start, end: e.end }));
  jsonResult.value = JSON.stringify(ast, null, 2);
  summaryResult.value = summarize(ast, tokens, dialect.value);
}

// biome-ignore lint/correctness/noUnusedVariables: called from Vue template
function loadExample(ex: (typeof EXAMPLES)[number]) {
  selectedExample.value = ex.label;
  expression.value = ex.expr;
  namesStr.value = ex.names;
  dialect.value = ex.dialect;
  activeTab.value = ex.tab as 'summary' | 'json' | 'tokens';
  run();
}

onMounted(() => run());
</script>

<template>
  <div class="feel-playground">

    <div class="examples">
      <span class="examples-label">Quick examples:</span>
      <button
        v-for="ex in EXAMPLES"
        :key="ex.label"
        class="example-btn"
        :class="{ active: selectedExample === ex.label }"
        @click="loadExample(ex)"
      >{{ ex.label }}</button>
    </div>

    <div class="input-group">
      <label class="input-label">FEEL Expression</label>
      <textarea
        v-model="expression"
        class="expr-input"
        rows="3"
        placeholder='e.g. if score >= 700 then "approved" else "declined"'
        @keydown.ctrl.enter="run"
        @keydown.meta.enter="run"
        spellcheck="false"
      />
    </div>

    <div class="input-row">
      <div class="input-group input-group--grow">
        <label class="input-label">
          Known Names
          <span class="label-hint">— comma-separated variable names for multi-word resolution</span>
        </label>
        <input
          v-model="namesStr"
          class="names-input"
          placeholder='e.g. Full Name, Monthly Salary'
          spellcheck="false"
          @keydown.ctrl.enter="run"
          @keydown.meta.enter="run"
        />
      </div>
      <div class="input-group">
        <label class="input-label">Dialect</label>
        <div class="dialect-toggle">
          <button
            class="dialect-btn"
            :class="{ active: dialect === 'expression' }"
            @click="dialect = 'expression'; run()"
          >expression</button>
          <button
            class="dialect-btn"
            :class="{ active: dialect === 'unary-tests' }"
            @click="dialect = 'unary-tests'; run()"
          >unary-tests</button>
        </div>
      </div>
    </div>

    <button class="run-btn" @click="run">
      ▶ Parse <span class="kbd">Ctrl+Enter</span>
    </button>

    <div v-if="ran" class="output">
      <div v-if="parseErrors.length > 0" class="output-errors">
        <div class="output-errors-title">
          ⚠ {{ parseErrors.length }} parse error{{ parseErrors.length > 1 ? 's' : '' }} — partial AST returned
        </div>
        <div v-for="(err, i) in parseErrors" :key="i" class="output-error-item">
          <span class="err-loc">[{{ err.start }}..{{ err.end }}]</span>
          <span class="err-msg">{{ err.message }}</span>
        </div>
      </div>
      <div class="tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'summary' }"
          @click="activeTab = 'summary'"
        >summary</button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'json' }"
          @click="activeTab = 'json'"
        >json</button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'tokens' }"
          @click="activeTab = 'tokens'"
        >tokens</button>
      </div>
      <pre class="output-value">{{ activeTab === 'summary' ? summaryResult : activeTab === 'json' ? jsonResult : tokensResult }}</pre>
    </div>

  </div>
</template>

<style scoped>
.feel-playground {
  padding: 1.5rem 0;
}

.examples {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 1.2rem;
  align-items: center;
}

.examples-label {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  margin-right: 4px;
  white-space: nowrap;
}

.example-btn {
  padding: 3px 10px;
  font-size: 0.78rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: background 0.15s;
}

.example-btn:hover {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
}

.example-btn.active {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  font-weight: 600;
}


.input-group {
  margin-bottom: 0.8rem;
}

.input-group:not(.input-group--grow) {
  margin-bottom: 0;
}

.input-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-bottom: 4px;
}

.label-hint {
  font-weight: 400;
  color: var(--vp-c-text-3);
}

.expr-input {
  width: 100%;
  padding: 10px 12px;
  font-family: var(--vp-font-family-mono);
  font-size: 0.9rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  color: var(--vp-c-text-1);
  resize: vertical;
  box-sizing: border-box;
}

.names-input {
  width: 100%;
  padding: 8px 12px;
  font-family: var(--vp-font-family-mono);
  font-size: 0.9rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  color: var(--vp-c-text-1);
  box-sizing: border-box;
}

.expr-input:focus,
.names-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.run-btn {
  padding: 8px 22px;
  background: var(--vp-c-brand-1);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 1rem;
}

.run-btn:hover {
  background: var(--vp-c-brand-2);
}

.dark .run-btn {
  background: color-mix(in srgb, var(--vp-c-brand-1) 55%, black 45%);
}

.dark .run-btn:hover {
  background: color-mix(in srgb, var(--vp-c-brand-1) 65%, black 35%);
}

.kbd {
  font-size: 0.75rem;
  opacity: 0.7;
  font-weight: 400;
}

.output {
  margin-top: 0.5rem;
}

.input-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 0.8rem;
}

.input-group--grow {
  flex: 1;
  margin-bottom: 0;
}

.dialect-toggle {
  display: flex;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  overflow: hidden;
}

.dialect-btn {
  padding: 8px 14px;
  font-size: 0.82rem;
  font-weight: 500;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}

.dialect-btn + .dialect-btn {
  border-left: 1px solid var(--vp-c-border);
}

.dialect-btn.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.output-errors {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 8px 8px 0 0;
  padding: 10px 14px;
  margin-bottom: 0;
}

.dark .output-errors {
  background: color-mix(in srgb, #92400e 12%, transparent);
  border-color: #92400e;
}

.output-errors-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #c2410c;
  margin-bottom: 6px;
}

.dark .output-errors-title {
  color: #fb923c;
}

.output-error-item {
  font-family: var(--vp-font-family-mono);
  font-size: 0.8rem;
  color: #9a3412;
  display: flex;
  gap: 8px;
  padding: 1px 0;
}

.dark .output-error-item {
  color: #fdba74;
}

.err-loc {
  opacity: 0.6;
  white-space: nowrap;
}

.output-errors + .tabs {
  border-top: none;
}

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 0;
  border-bottom: 1px solid var(--vp-c-border);
}

.tab-btn {
  padding: 6px 16px;
  font-size: 0.82rem;
  font-weight: 600;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.tab-btn.active {
  background: var(--vp-c-bg);
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-border);
  border-bottom-color: var(--vp-c-bg);
  margin-bottom: -1px;
}

.output-value {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-top: none;
  border-radius: 0 0 8px 8px;
  padding: 12px 16px;
  font-family: var(--vp-font-family-mono);
  font-size: 0.85rem;
  color: var(--vp-c-text-1);
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  max-height: 500px;
  overflow-y: auto;
}
</style>
