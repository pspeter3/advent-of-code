/**
 * Converts a number to the triangle number equivalent.
 * @param value The value to convert
 * @returns The triangle number
 */
export function toTriangle(value: number): number {
    return 0.5 * value * (value + 1);
}

/**
 * Converts a x,y pair to a cantor id.
 * @param x The x component
 * @param y The y component
 * @returns The cantor id
 */
export function toCantor(x: number, y: number): number {
    return (x * x + x + 2 * x * y + 3 * y + y * y) / 2;
}

/**
 * Converts cantor id to x,y pair.
 * @param z The cantor id
 * @returns The x,y pair
 */
export function fromCantor(z: number): readonly [x: number, y: number] {
    const w = Math.floor((Math.sqrt(8 * z + 1) - 1) / 2);
    const t = toTriangle(w);
    const y = z - t;
    const x = w - y;
    return [x, y];
}

/**
 * Converts a value to zig zag encoding.
 * @param value The value to convert
 * @returns The zig zag value
 */
export function toZigZag(value: number): number {
    return value < 0 ? -2 * value - 1 : 2 * value;
}

/**
 * Converts a value from zig zag encoding.
 * @param value The value to convert
 * @returns The initial value
 */
export function fromZigZag(value: number): number {
    const result = Math.ceil(value / 2);
    return value % 2 === 1 ? -result : result;
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
