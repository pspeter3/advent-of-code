/**
 * Calculate the sum for an iterable of numbers.
 * @param iterable The iterable to sum
 * @returns The sum
 */
export const sum = (iterable: Iterable<number>): number =>
    reduce(iterable, (total, value) => total + value, 0);

/**
 * Calculate the max for an iterable of numbers.
 * @param iterable The iterable to max
 * @returns The max
 */
export const max = (iterable: Iterable<number>): number =>
    reduce(iterable, (result, value) => Math.max(result, value), -Infinity);

/**
 * Calculate the min for an iterable of numbers.
 * @param iterable The iterable to min
 * @returns The min
 */
export const min = (iterable: Iterable<number>): number =>
    reduce(iterable, (result, value) => Math.min(result, value), Infinity);

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
 * Reduces an iterable to a value.
 * @param iterable The iterable to reduce
 * @param callback The reduce callback
 * @param initial The initial value
 * @returns The reduced value
 */
export function reduce<I, O>(
    iterable: Iterable<I>,
    callback: (value: O, item: I) => O,
    initial: O,
): O {
    let current = initial;
    for (const item of iterable) {
        current = callback(current, item);
    }
    return current;
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

/**
 * Checks if every element matches a filter.
 * @param iterable The iterable to check
 * @param callback The filter callback
 * @returns The final value
 */
export function every<T>(
    iterable: Iterable<T>,
    callback: (item: T) => boolean,
): boolean {
    for (const item of iterable) {
        if (!callback(item)) {
            return false;
        }
    }
    return true;
}

/**
 * Checks if some elements match a filter.
 * @param iterable The iterable to check
 * @param callback The filter callback
 * @returns The final value
 */
export function some<T>(
    iterable: Iterable<T>,
    callback: (item: T) => boolean,
): boolean {
    for (const item of iterable) {
        if (callback(item)) {
            return true;
        }
    }
    return false;
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
export function* count(start: number = 0, step: number = 1): Iterable<number> {
    let current = start;
    while (true) {
        yield current;
        current += step;
    }
}

export type RecordEntry<K extends string, V> = readonly [key: K, value: V];

export function toEntries<K extends string, V>(
    record: Readonly<Record<K, V>>,
): ReadonlyArray<RecordEntry<K, V>> {
    return Object.entries(record) as unknown as RecordEntry<K, V>[];
}

export function fromEntries<K extends string, V>(
    iterable: Iterable<RecordEntry<K, V>>,
): Readonly<Record<K, V>> {
    return Object.fromEntries(iterable) as Record<K, V>;
}

export function first<T>(iterable: Iterable<T>): T | undefined {
    const iterator = iterable[Symbol.iterator]();
    const item = iterator.next();
    return item.value;
}
