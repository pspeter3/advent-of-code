import z from "zod";
import { main } from "../../utils/host";
import { IntSchema } from "../../utils/schemas";

type AlmanacRange = readonly [target: number, source: number, length: number];

interface AlmanacMap {
    readonly source: string;
    readonly target: string;
    readonly ranges: ReadonlyArray<AlmanacRange>;
}

interface Almanac {
    readonly seeds: ReadonlyArray<number>;
    readonly maps: ReadonlyArray<AlmanacMap>;
}

const AlmanacRangeSchema = z
    .string()
    .transform((line) => line.split(/\s+/g))
    .pipe(z.tuple([IntSchema, IntSchema, IntSchema]));

const AlmanacMapSchema = z
    .string()
    .transform((chunk) => {
        const [title, ...ranges] = chunk.trim().split("\n");
        const match = title.match(/^(\w+)-to-(\w+) map:$/);
        if (match === null) {
            throw new Error("Invalid AlmanacMap title");
        }
        const source = match[1];
        const target = match[2];
        return { source, target, ranges };
    })
    .pipe(
        z.object({
            source: z.string(),
            target: z.string(),
            ranges: z.array(AlmanacRangeSchema),
        }),
    );

const AlmanacSeedsSchema = z
    .string()
    .transform((line) => line.replace(/^seeds:\s+/, "").split(/\s+/g))
    .pipe(z.array(IntSchema));

const AlmanacSchema = z
    .string()
    .transform((input) => {
        const [seeds, ...maps] = input.split("\n\n");
        return { seeds, maps };
    })
    .pipe(
        z.object({
            seeds: AlmanacSeedsSchema,
            maps: z.array(AlmanacMapSchema),
        }),
    );

const fromRange = (
    [target, source, length]: AlmanacRange,
    value: number,
): number | null => {
    const delta = value - source;
    if (delta < 0 || delta >= length) {
        return null;
    }
    return target + delta;
};

const fromRangeList = (
    ranges: ReadonlyArray<AlmanacRange>,
    value: number,
): number => {
    for (const range of ranges) {
        const result = fromRange(range, value);
        if (result !== null) {
            return result;
        }
    }
    return value;
};

const fromMapList = (
    maps: ReadonlyArray<AlmanacMap>,
    value: number,
): number => {
    let result = value;
    for (const map of maps) {
        result = fromRangeList(map.ranges, result);
    }
    return result;
};

class NumericRange {
    static fromSeeds(
        seeds: ReadonlyArray<number>,
    ): ReadonlyArray<NumericRange> {
        return Array.from({ length: seeds.length / 2 }, (_, i) => {
            const offset = 2 * i;
            return new NumericRange(seeds[offset], seeds[offset + 1]);
        });
    }

    static evolve(
        ranges: ReadonlyArray<NumericRange>,
        map: AlmanacMap,
    ): ReadonlyArray<NumericRange> {
        const queue = Array.from(ranges);
        const result: NumericRange[] = [];
        while (queue.length > 0) {
            const current = queue.shift()!;
            let hasOverlap = false;
            for (const range of map.ranges) {
                const overlap = current.overlap(range);
                if (overlap === null) {
                    continue;
                }
                hasOverlap = true;
                result.push(overlap.translate(range));
                queue.push(...current.split(overlap));
            }
            if (!hasOverlap) {
                result.push(current);
            }
        }
        return NumericRange.collapse(result);
    }

    private static collapse(
        ranges: Array<NumericRange>,
    ): ReadonlyArray<NumericRange> {
        ranges.sort((a, b) => a.start - b.start);
        const result: NumericRange[] = [ranges.shift()!];
        for (const range of ranges) {
            const index = result.length - 1;
            const current = result[index];
            if (range.start < current.end) {
                result[index] = new NumericRange(
                    current.start,
                    range.end - current.start,
                );
            } else {
                result.push(range);
            }
        }
        return result;
    }

    readonly start: number;
    readonly length: number;

    constructor(start: number, length: number) {
        this.start = start;
        this.length = length;
    }

    get end(): number {
        return this.start + this.length;
    }

    overlap([_, source, length]: AlmanacRange): NumericRange | null {
        const start = Math.max(this.start, source);
        const end = Math.min(this.end, source + length);
        if (start >= end) {
            return null;
        }
        return new NumericRange(start, end - start);
    }

    translate([target, source]: AlmanacRange): NumericRange {
        return new NumericRange(target + (this.start - source), this.length);
    }

    *split(overlap: NumericRange): Iterable<NumericRange> {
        if (overlap.start < this.start || overlap.end > this.end) {
            throw new Error("Invalid overlap");
        }
        if (overlap.start > this.start) {
            yield new NumericRange(this.start, overlap.start - this.start);
        }
        if (overlap.end < this.end) {
            yield new NumericRange(overlap.end, this.end - overlap.end);
        }
    }
}

const parse = (input: string): Almanac => AlmanacSchema.parse(input);

const part1 = ({ seeds, maps }: Almanac): number => {
    let result = Infinity;
    for (const seed of seeds) {
        result = Math.min(result, fromMapList(maps, seed));
    }
    return result;
};

const part2 = ({ seeds, maps }: Almanac): number => {
    let ranges = NumericRange.fromSeeds(seeds);
    for (const map of maps) {
        ranges = NumericRange.evolve(ranges, map);
    }
    return ranges.reduce((min, range) => Math.min(min, range.start), Infinity);
};

main(module, parse, part1, part2);
