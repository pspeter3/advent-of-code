/**
 * Memoizes a function
 * @param fn The function to memoize
 * @returns The memoized function
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    return cache.getOrInsertComputed(key, () => fn(...args));
  }) as T;
}
