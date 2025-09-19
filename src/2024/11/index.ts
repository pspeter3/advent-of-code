import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema } from "../../utils/schemas.ts";
import { sum } from "../../common/itertools.ts";
import { memoize } from "../../common/functools.ts";

type StoneList = ReadonlyArray<number>;

const StoneListSchema = z
    .string()
    .transform((input) => input.trim().split(" "))
    .pipe(z.array(IntSchema));

const parse = (input: string): StoneList => StoneListSchema.parse(input);

const blink = memoize((stone: number, depth: number): number => {
    if (depth === 0) {
        return 1;
    }
    const next = depth - 1;
    if (stone === 0) {
        return blink(1, next);
    }
    const str = stone.toString(10);
    if (str.length % 2 === 0) {
        const mid = str.length / 2;
        return (
            blink(parseInt(str.slice(0, mid), 10), next) +
            blink(parseInt(str.slice(mid), 10), next)
        );
    }
    return blink(stone * 2024, next);
});

const part1 = (stones: StoneList): number =>
    sum(stones.values().map((stone) => blink(stone, 25)));

const part2 = (stones: StoneList): number =>
    sum(stones.values().map((stone) => blink(stone, 75)));

main(module, parse, part1, part2);
