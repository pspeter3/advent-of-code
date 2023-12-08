/**
 * Converts a number to the triangle number equivalent.
 * @param value The value to convert
 * @returns The triangle numbeer
 */
export function toTriangle(value: number): number {
    return 0.5 * value * (value + 1);
}

/**
 * Find the greatest common divisor between two numbers.
 * @param a
 * @param b
 * @returns The great common divisor
 */
export function greatestCommonDivisor(a: number, b: number): number {
    if (b === 0) {
        return a;
    }
    return greatestCommonDivisor(b, a % b);
}

/**
 * Find the least common multiple between two numbers.
 * @param a
 * @param b
 * @returns The least common multiple.
 */
export function leastCommonMultiple(a: number, b: number): number {
    return Math.abs(a) * (Math.abs(b) / greatestCommonDivisor(a, b));
}
