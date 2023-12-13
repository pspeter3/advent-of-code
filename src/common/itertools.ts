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
