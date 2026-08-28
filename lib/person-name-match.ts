/** Name suffixes ignored when parsing last names. */
const NAME_SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v', '2nd', '3rd', '4th']);

/**
 * Bidirectional given-name groups: a short form matches any name in its group.
 * Do not merge distinct given names (e.g. John vs Jonathan, Tony vs Tonya).
 */
const GIVEN_NAME_GROUPS: string[][] = [
  ['alexander', 'alex', 'alec'],
  ['andrew', 'andy', 'drew'],
  ['anthony', 'tony'],
  ['benjamin', 'ben', 'benny', 'benji'],
  ['charles', 'charlie', 'chuck', 'chas'],
  ['christopher', 'chris'],
  ['daniel', 'dan', 'danny'],
  ['david', 'dave', 'davy'],
  ['edward', 'ed', 'eddie', 'ted'],
  ['elizabeth', 'liz', 'lizzy', 'beth', 'betty'],
  ['gregory', 'greg'],
  ['james', 'jim', 'jimmy', 'jamie'],
  ['jennifer', 'jen', 'jenny'],
  ['jonathan', 'jon'],
  ['joseph', 'joe', 'joey'],
  ['joshua', 'josh'],
  ['katherine', 'catherine', 'kate', 'katie', 'kathy'],
  ['kenneth', 'ken', 'kenny'],
  ['matthew', 'matt'],
  ['maxwell', 'max'],
  ['michael', 'mike', 'mikey'],
  ['nicholas', 'nick', 'nicky'],
  ['patrick', 'pat', 'paddy'],
  ['peter', 'pete'],
  ['philip', 'phillip', 'phil'],
  ['richard', 'rick', 'ricky', 'dick'],
  ['robert', 'rob', 'bob', 'bobby', 'robbie'],
  ['samuel', 'sam', 'sammy'],
  ['steven', 'stephen', 'steve'],
  ['thomas', 'tom', 'tommy'],
  ['timothy', 'tim', 'timmy'],
  ['william', 'will', 'bill', 'billy', 'willy'],
  ['zachary', 'zach', 'zack'],
];

const GIVEN_NAME_LOOKUP: Map<string, Set<string>> = (() => {
  const map = new Map<string, Set<string>>();
  for (const group of GIVEN_NAME_GROUPS) {
    const set = new Set(group);
    for (const name of group) map.set(name, set);
  }
  return map;
})();

/** Lowercase letters-only token for comparisons. */
export function normalizeNameToken(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}

export type ParsedPersonName = {
  first: string;
  last: string;
};

/**
 * First given name + last surname. Drops a trailing Jr/Sr/II and parentheticals.
 * Middle names are ignored.
 */
export function parsePersonName(fullName: string): ParsedPersonName | null {
  const stripped = fullName.replace(/\([^)]*\)/g, ' ').trim();
  if (!stripped) return null;
  const tokens = stripped
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => !NAME_SUFFIXES.has(normalizeNameToken(t)));
  if (tokens.length === 0) return null;
  if (tokens.length === 1) {
    const only = normalizeNameToken(tokens[0]);
    return only ? { first: only, last: '' } : null;
  }
  const first = normalizeNameToken(tokens[0]);
  const last = normalizeNameToken(tokens[tokens.length - 1]);
  if (!first || !last) return null;
  return { first, last };
}

/** The given name plus every common short/long form in its group. */
export function firstNameVariants(first: string): string[] {
  const key = normalizeNameToken(first);
  if (!key) return [];
  const group = GIVEN_NAME_LOOKUP.get(key);
  if (!group) return [key];
  return [...group];
}

export function firstNamesEquivalent(a: string, b: string): boolean {
  const A = firstNameVariants(a);
  const B = new Set(firstNameVariants(b));
  return A.some((n) => B.has(n));
}

/** True when last names match and given names are the same or a known short form. */
export function personNamesMatch(orderName: string, waiverFirst: string, waiverLast: string): boolean {
  const order = parsePersonName(orderName);
  const waiver = parsePersonName(`${waiverFirst} ${waiverLast}`.trim());
  if (!order || !waiver || !order.last || !waiver.last) return false;
  if (order.last !== waiver.last) return false;
  return firstNamesEquivalent(order.first, waiver.first);
}
