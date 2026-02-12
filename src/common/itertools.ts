/**
 * Calculate the sum for an iterable of numbers.
 * @param iterable The iterable to sum
 * @returns The sum
 */
export const sum = (iterable: Iterable<number>): number =>
  Iterator.from(iterable).reduce((total, value) => total + value, 0);

/**
 * Calculate the max for an iterable of numbers.
 * @param iterable The iterable to max
 * @returns The max
 */
export const max = (iterable: Iterable<number>): number =>
  Iterator.from(iterable).reduce((result, value) => Math.max(result, value), -Infinity);

/**
 * Calculate the min for an iterable of numbers.
 * @param iterable The iterable to min
 * @returns The min
 */
export const min = (iterable: Iterable<number>): number =>
  Iterator.from(iterable).reduce((result, value) => Math.min(result, value), Infinity);

export type ZipPair<A, B> = readonly [a: A, b: B];

/**
 * Zips two iterables together.
 * @param a The first iterable
 * @param b The second iterable
 */
export function* zip<A, B>(a: Iterable<A>, b: Iterable<B>): Generator<ZipPair<A, B>> {
  const aIterator = a[Symbol.iterator]();
  const bIterator = b[Symbol.iterator]();
  let aResult = aIterator.next();
  let bResult = bIterator.next();
  while (!aResult.done && !bResult.done) {
    yield [aResult.value, bResult.value];
    aResult = aIterator.next();
    bResult = bIterator.next();
  }
}

export type EnumeratePair<T> = readonly [index: number, item: T];

/**
 * Enumerates an iterable.
 * @param iterable The iterable to enumerate
 */
export function* enumerate<T>(iterable: Iterable<T>): Generator<EnumeratePair<T>> {
  let index = 0;
  for (const item of iterable) {
    yield [index++, item];
  }
}

/**
 * Determines the length of an iterable.
 * @param iterable The iterable to count
 * @returns The length of the iterable
 */
export function len(iterable: Iterable<unknown>): number {
  let count = 0;
  for (const _ of iterable) {
    count++;
  }
  return count;
}

/**
 * Counts numbers infinitely.
 * @param start The starting number
 * @param step The incrementing number
 */
export function* count(start: number = 0, step: number = 1): Generator<number> {
  let current = start;
  while (true) {
    yield current;
    current += step;
  }
}

/**
 * Generate all permutations of a list.
 * @param list The list to permute
 */
export function* permutations<T>(list: ReadonlyArray<T>): Generator<ReadonlyArray<T>> {
  if (list.length === 0) {
    yield [];
  } else {
    for (let i = 0; i < list.length; i++) {
      const rest = [...list.slice(0, i), ...list.slice(i + 1)];
      for (const perm of permutations(rest)) {
        yield [list[i], ...perm];
      }
    }
  }
}

export type Pair<T> = readonly [a: T, b: T];

export function* pairs<T>(list: ReadonlyArray<T>): Generator<Pair<T>> {
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      yield [list[i], list[j]];
    }
  }
}
