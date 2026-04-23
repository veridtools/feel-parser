// Pratt parser binding powers
export enum BP {
  None = 0,
  Pipeline = 5,
  Or = 10,
  And = 20,
  Comparison = 30,
  Range = 35,
  Addition = 40,
  Multiplication = 50,
  Exponent = 60,
  Unary = 70,
  Postfix = 80,
}

export const KNOWN_NAMES = new Set([
  'date and time',
  'years and months duration',
  'string length',
  'substring before',
  'substring after',
  'starts with',
  'ends with',
  'upper case',
  'lower case',
  'string join',
  'list contains',
  'insert before',
  'index of',
  'distinct values',
  'context put',
  'context merge',
  'get value',
  'get entries',
  'day of week',
  'day of year',
  'week of year',
  'month of year',
  'round up',
  'round down',
  'round half up',
  'round half down',
  'before',
  'after',
  'meets',
  'met by',
  'overlaps',
  'overlaps before',
  'overlaps after',
  'finishes',
  'finished by',
  'includes',
  'during',
  'starts',
  'started by',
  'coincides',
  'random number',
  'pad left',
  'pad right',
  'encode for URI',
  'decode for URI',
  'list replace',
  'duplicate values',
  'is defined',
  // DMN 1.5 §10.3.4.5 format functions
  'format number',
  'format date',
  'format time',
  'format date and time',
  // Verid vendor extensions (not part of DMN spec)
  'is blank',
  'is empty',
  'get or else',
  'to base64',
  'from base64',
  'last day of month',
  'from unix timestamp',
  'to unix timestamp',
  'string format',
  'to json',
  'from json',
]);

export const KNOWN_NAME_PREFIXES = new Set<string>();
for (const name of KNOWN_NAMES) {
  const parts = name.split(' ');
  for (let i = 1; i < parts.length; i++) {
    KNOWN_NAME_PREFIXES.add(parts.slice(0, i).join(' '));
  }
}

export const MULTI_WORD_PATH_CONTINUATIONS = new Set([
  'time offset',
  'time zone',
  'start included',
  'end included',
]);
