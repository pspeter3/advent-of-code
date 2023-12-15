/**
 * Calculate the sum for an iterable of numbers.
 * @param iterable The iterable to sum
 * @returns The sum
 */
export function sum(iterable: Iterable<number>): number {
    let total = 0;
    for (const value of iterable) {
        total += value;
    }
    return total;
}

export type ZipPair<A, B> = readonly [a: A, b: B];

/**
 * Zips two iterables together.
 * @param a The first iterable
 * @param b The second iterable
 */
export function* zip<A, B>(
    a: Iterable<A>,
    b: Iterable<B>,
): Iterable<ZipPair<A, B>> {
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

/**
 * Maps an iterable.
 * @param iterable The iterable to map
 * @param callback The map callback
 */
export function* map<I, O>(
    iterable: Iterable<I>,
    callback: (item: I) => O,
): Iterable<O> {
    for (const item of iterable) {
        yield callback(item);
    }
}

/**
 * Filters an iterable.
 * @param iterable The iterable to filter
 * @param callback The filter callback
 */
export function* filter<T>(
    iterable: Iterable<T>,
    callback: (item: T) => boolean,
): Iterable<T> {
    for (const item of iterable) {
        if (callback(item)) {
            yield item;
        }
    }
}

/**
 * Groups an iterable by key.
 * @param iterable The iterable to group
 * @param callback The group by key callback
 * @returns Map of grouped items
 */
export function groupBy<K, V>(
    iterable: Iterable<V>,
    callback: (item: V) => K,
): ReadonlyMap<K, ReadonlyArray<V>> {
    const result = new Map<K, Array<V>>();
    for (const item of iterable) {
        const key = callback(item);
        if (!result.has(key)) {
            result.set(key, []);
        }
        result.get(key)!.push(item);
    }
    return result;
}

export type EnumeratePair<T> = readonly [index: number, item: T];

/**
 * Enumerates an iterable.
 * @param iterable The iterable to enumerate
 */
export function* enumerate<T>(
    iterable: Iterable<T>,
): Iterable<EnumeratePair<T>> {
    let index = 0;
    for (const item of iterable) {
        yield [index++, item];
    }
}
