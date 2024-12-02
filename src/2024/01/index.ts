import z from "zod";
import { main } from "../../utils/host";
import { IntSchema, LinesSchema } from "../../utils/schemas";
import { sum, zip } from "../../common/itertools";

const PairSchema = z
    .string()
    .transform((line) => line.split(/\s+/))
    .pipe(z.tuple([IntSchema, IntSchema]));
const ListsSchema = LinesSchema(PairSchema).transform((pairs) => {
    const a: number[] = [];
    const b: number[] = [];
    for (const [x, y] of pairs) {
        a.push(x);
        b.push(y);
    }
    return [a, b] as Lists;
});

type Lists = readonly [ReadonlyArray<number>, ReadonlyArray<number>];

const parse = (input: string): Lists => ListsSchema.parse(input);

const part1 = ([a, b]: Lists): number =>
    sum(
        zip(
            a.toSorted((a, b) => a - b),
            b.toSorted((a, b) => a - b),
        ).map(([x, y]) => Math.abs(x - y)),
    );

const part2 = ([a, b]: Lists): number => {
    const counts = Map.groupBy(b, (x) => x);
    return sum(a.values().map((x) => x * (counts.get(x)?.length ?? 0)));
};

main(module, parse, part1, part2);
