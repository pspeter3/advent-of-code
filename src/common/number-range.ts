export class NumberRange implements Iterable<number> {
    static inclusive(a: number, b: number): NumberRange {
        return new NumberRange(Math.min(a, b), Math.max(a, b) + 1);
    }

    readonly min: number;
    readonly max: number;

    constructor(a: number, b: number) {
        this.min = Math.min(a, b);
        this.max = Math.max(a, b);
    }

    get length(): number {
        return this.max - this.min;
    }

    includes(value: number): boolean {
        return this.min <= value && value < this.max;
    }

    *[Symbol.iterator](): Iterator<number> {
        for (let i = this.min; i < this.max; i++) {
            yield i;
        }
    }
}
