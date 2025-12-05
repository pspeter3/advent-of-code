import z from "zod";
import { NumberRange } from "../../common/number-range.ts";
import { main } from "../../utils/host.ts";
import { IntSchema } from "../../utils/schemas.ts";
import { len, sum } from "../../common/itertools.ts";

interface Inventory {
    readonly fresh: ReadonlyArray<NumberRange>;
    readonly ingredients: ReadonlySet<number>;
}

const RangeSchema = z.tuple([IntSchema, IntSchema]);

const parse = (input: string): Inventory => {
    const [ranges, ids] = input.trim().split("\n\n");
    const fresh: NumberRange[] = [];
    const ingredients = new Set<number>();
    for (const range of ranges.split("\n")) {
        const tuple = RangeSchema.parse(range.split("-"));
        tuple[1]++;
        fresh.push(NumberRange.fromTuple(tuple));
    }
    for (const id of ids.split("\n")) {
        ingredients.add(IntSchema.parse(id));
    }
    return { fresh, ingredients };
};

const part1 = ({ fresh, ingredients }: Inventory): number =>
    len(
        ingredients
            .values()
            .filter((id) => fresh.some((range) => range.includes(id))),
    );

const part2 = ({ fresh }: Inventory): number => {
    const sorted = fresh.toSorted((a, b) =>
        a.min === b.min ? a.max - b.max : a.min - b.min,
    );
    const ranges: NumberRange[] = [];
    let curr = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
        const next = sorted[i];
        if (next.min <= curr.max) {
            if (next.max > curr.max) {
                curr = new NumberRange(curr.min, next.max);
            }
        } else {
            ranges.push(curr);
            curr = next;
        }
    }
    ranges.push(curr);
    return sum(ranges.values().map((range) => range.length));
};

await main(import.meta, parse, part1, part2);
