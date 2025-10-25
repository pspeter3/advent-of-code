import { max } from "../../common/itertools.ts";
import { main } from "../../utils/host.ts";

interface Reindeer {
    readonly name: string;
    readonly speed: number;
    readonly fly: number;
    readonly rest: number;
}
type ReindeerList = ReadonlyArray<Reindeer>;

const PATTERN =
    /^(\w+) can fly (\d+) km\/s for (\d+) seconds, but then must rest for (\d+) seconds.$/;

const distance = (reindeer: Reindeer, time: number): number => {
    const cylce = reindeer.fly + reindeer.rest;
    const cyles = Math.floor(time / cylce);
    const rem = time % cylce;
    const base = cyles * reindeer.fly * reindeer.speed;
    return base + Math.min(rem, reindeer.fly) * reindeer.speed;
};

const parse = (input: string): ReindeerList =>
    input
        .trim()
        .split("\n")
        .map((line) => {
            const match = PATTERN.exec(line);
            if (!match) throw new Error(`Invalid line: ${line}`);
            const [, name, speed, fly, rest] = match;
            return {
                name,
                speed: parseInt(speed, 10),
                fly: parseInt(fly, 10),
                rest: parseInt(rest, 10),
            };
        });

const part1 = (reindeer: ReindeerList): number =>
    max(
        reindeer
            .values()
            .map((r) => distance(r, reindeer.length === 2 ? 1000 : 2503)),
    );

const part2 = (reindeer: ReindeerList): number => {
    const time = reindeer.length === 2 ? 1000 : 2503;
    const scores = new Map<string, number>();
    const increment = (name: string): Map<string, number> =>
        scores.set(name, (scores.get(name) ?? 0) + 1);
    for (let t = 1; t < time; t++) {
        const curr = new Map(
            reindeer.values().map((r) => [r.name, distance(r, t)]),
        );
        const best = max(curr.values());
        for (const [name, dist] of curr.entries()) {
            if (dist === best) {
                increment(name);
            }
        }
    }
    return max(scores.values())!;
};

await main(import.meta, parse, part1, part2);
