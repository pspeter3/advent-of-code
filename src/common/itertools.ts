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
