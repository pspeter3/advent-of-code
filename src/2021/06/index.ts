import { z } from "zod";
import { main } from "../../utils/host";
import { IntSchema, StringSchema } from "../../utils/schemas";

const schema = z.preprocess(
    (input) => StringSchema.parse(input).trim().split(","),
    z.array(IntSchema)
);

const GESTATION = 2;
const LIFECYCLE = 7;

const spawn = (
    cache: Map<number, number>,
    timer: number,
    days: number
): number => {
    if (!cache.has(timer)) {
        let total = 1;
        const children = Math.ceil(Math.max(days - timer, 0) / LIFECYCLE);
        for (let i = 1; i <= children; i++) {
            const birth = GESTATION + timer + LIFECYCLE * i;
            total += spawn(cache, birth, days);
        }
        cache.set(timer, total);
    }
    return cache.get(timer)!;
};

const forecast = (fish: ReadonlyArray<number>, days: number): number => {
    const cache = new Map<number, number>();
    return fish.reduce((sum, timer) => sum + spawn(cache, timer, days), 0);
};

const part1 = (fish: ReadonlyArray<number>): number => forecast(fish, 80);
const part2 = (fish: ReadonlyArray<number>): number => forecast(fish, 256);

main(module, schema, part1, part2);
