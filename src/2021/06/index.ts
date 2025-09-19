import { z } from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, StringSchema } from "../../utils/schemas.ts";

const schema = z.preprocess(
    (input) => StringSchema.parse(input).trim().split(","),
    z.array(IntSchema),
);

const LIFECYCLE = 6;
const GESTATION = 8;

const forecast = (fish: ReadonlyArray<number>, days: number): BigInt => {
    const cache = new BigUint64Array(GESTATION + 1);
    for (const timer of fish) {
        cache[timer]++;
    }
    for (let day = 0; day < days; day++) {
        const parents = cache[0];
        for (let i = 0; i < GESTATION; i++) {
            cache[i] = cache[i + 1];
        }
        cache[GESTATION] = parents;
        cache[LIFECYCLE] += parents;
    }
    return cache.reduce((a, e) => a + e);
};

const part1 = (fish: ReadonlyArray<number>): BigInt => forecast(fish, 80);
const part2 = (fish: ReadonlyArray<number>): BigInt => forecast(fish, 256);

main(module, (input) => schema.parse(input), part1, part2);
