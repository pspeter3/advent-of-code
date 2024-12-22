import { sum } from "../../common/itertools";
import { main } from "../../utils/host";
import { IntSchema, LinesSchema } from "../../utils/schemas";

class PRNG {
    #secret: number;

    constructor(seed: number) {
        this.#secret = seed;
    }

    next(): number {
        this.#mash((this.#secret << 6) >>> 0);
        this.#mash((this.#secret >>> 5) >>> 0);
        this.#mash((this.#secret << 11) >>> 0);
        return this.#secret;
    }

    #mash(value: number): void {
        this.#mix(value);
        this.#prune();
    }

    #mix(value: number): void {
        this.#secret = (this.#secret ^ value) >>> 0;
    }

    #prune(): void {
        this.#secret = this.#secret % 16777216 >>> 0;
    }
}

const evaluate = (seed: number, count: number): number => {
    const prng = new PRNG(seed);
    for (let i = 1; i < count; i++) {
        prng.next();
    }
    return prng.next();
};

const calculateChanges = (
    seed: number,
    count: number,
): ReadonlyMap<string, number> => {
    const prng = new PRNG(seed);
    const values = [seed % 10];
    const changes = new Map<string, number>();
    for (let i = 1; i < count; i++) {
        values.push(prng.next() % 10);
        if (values.length > 4) {
            const deltas = Array.from(
                { length: 4 },
                (_, i) => values.at(-4 + i)! - values.at(-5 + i)!,
            );
            const key = JSON.stringify(deltas);
            if (!changes.has(key)) {
                changes.set(key, values.at(-1)!);
            }
        }
    }
    return changes;
};

const Schema = LinesSchema(IntSchema);

const parse = (input: string): ReadonlyArray<number> => Schema.parse(input);

const part1 = (seeds: ReadonlyArray<number>): number =>
    sum(seeds.values().map((seed) => evaluate(seed, 2000)));

const part2 = (seeds: ReadonlyArray<number>): number => {
    const changes = seeds.map((seed) => calculateChanges(seed, 2000));
    const keys = new Set<string>();
    for (const change of changes) {
        for (const key of change.keys()) {
            keys.add(key);
        }
    }
    let max = 0;
    let key: string | null = null;
    for (const k of keys) {
        const value = changes.reduce((a, e) => a + (e.get(k) ?? 0), 0);
        if (value > max) {
            max = value;
            key = k;
        }
    }
    if (key === null) {
        throw new Error("No key found");
    }
    return max;
};

main(module, parse, part1, part2);
