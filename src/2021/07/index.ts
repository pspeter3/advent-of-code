import { z } from "zod";
import { main } from "../../utils/host";
import { IntSchema, StringSchema } from "../../utils/schemas";

const schema = z.preprocess(
    (input) => StringSchema.parse(input).split(","),
    z.array(IntSchema)
);

const identity = (distance: number) => distance;
const triangle = (distance: number) => 0.5 * distance * (distance + 1);

const fuel = (
    crabs: ReadonlyArray<number>,
    cost: (distance: number) => number
): number =>
    Math.min(
        ...Uint32Array.from(
            { length: Math.max(...crabs) - Math.min(...crabs) + 1 },
            (_, index) =>
                crabs.reduce(
                    (sum, crab) => sum + cost(Math.abs(crab - index)),
                    0
                )
        )
    );

const part1 = (crabs: ReadonlyArray<number>): number => fuel(crabs, identity);
const part2 = (crabs: ReadonlyArray<number>): number => fuel(crabs, triangle);

main(module, schema, part1, part2);
