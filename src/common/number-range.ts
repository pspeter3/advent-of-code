export interface NumberRangeRecord {
  readonly min: number;
  readonly max: number;
}

export type NumberRangeTuple = readonly [min: number, max: number];

export type NumberRangeSplit = readonly [left: NumberRange, right: NumberRange];

export class NumberRange implements NumberRangeRecord, Iterable<number> {
  static inclusive(a: number, b: number): NumberRange {
    return new NumberRange(Math.min(a, b), Math.max(a, b) + 1);
  }

  static fromRecord({ min, max }: NumberRangeRecord): NumberRange {
    return new NumberRange(min, max);
  }

  static fromTuple([min, max]: NumberRangeTuple): NumberRange {
    return new NumberRange(min, max);
  }

  static fromLength(start: number, length: number): NumberRange {
    return new NumberRange(start, start + length);
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

  intersection(other: NumberRangeRecord): NumberRange | null {
    const min = Math.max(this.min, other.min);
    const max = Math.min(this.max, other.max);
    if (min >= max) {
      return null;
    }
    return new NumberRange(min, max);
  }

  split(value: number): NumberRangeSplit {
    if (!this.includes(value)) {
      throw new Error("Invalid split value");
    }
    const { min, max } = this;
    return [new NumberRange(min, value), new NumberRange(value, max)];
  }

  equals({ min, max }: NumberRangeRecord): boolean {
    return this.min === min && this.max === max;
  }

  *[Symbol.iterator](): Generator<number> {
    for (let i = this.min; i < this.max; i++) {
      yield i;
    }
  }

  values(): Generator<number> {
    return this[Symbol.iterator]();
  }
}
