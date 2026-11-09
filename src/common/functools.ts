/**
 * Computes a cache key for a list of arguments.
 */
export type KeyFn<A extends readonly unknown[], K> = (...args: A) => K;

/**
 * Default cache key which serializes the arguments with JSON.stringify.
 * @param args The arguments
 * @returns The serialized key
 */
export const jsonKey = (...args: readonly unknown[]): string => JSON.stringify(args);

/**
 * Memoizes a function
 * @param fn The function to memoize
 * @param key The cache key function, defaults to JSON.stringify of the arguments
 * @returns The memoized function
 */
export function memoize<A extends readonly any[], R, K = string>(
  fn: (...args: A) => R,
  key: KeyFn<A, K> = jsonKey as KeyFn<A, any>,
): (...args: A) => R {
  const cache = new Map<K, R>();
  return (...args: A): R => cache.getOrInsertComputed(key(...args), () => fn(...args));
}
