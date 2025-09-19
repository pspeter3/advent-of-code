import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema } from "../../utils/schemas.ts";

interface BoatRace {
    readonly time: number;
    readonly distance: number;
}

type BoatRaceList = ReadonlyArray<BoatRace>;

const LineSchema = z
    .string()
    .transform((line) => line.replace(/^(\w+):\s+/, "").split(/\s+/g))
    .pipe(z.array(IntSchema));
const BoatRaceListSchema = z
    .string()
    .transform((input) => input.trim().split("\n"))
    .pipe(z.tuple([LineSchema, LineSchema]))
    .transform(([times, distances]) => {
        if (times.length !== distances.length) {
            throw new Error("Invalid input");
        }
        return Array.from(times, (time, i) => ({
            time,
            distance: distances[i],
        }));
    });

type NumericBounds = readonly [min: number, max: number];
function calculateRoots({ time, distance }: BoatRace): NumericBounds {
    const delta = Math.sqrt(time * time - 4 * distance);
    const base = -1 * time;
    return [(base + delta) / -2, (base - delta) / -2];
}

function convertBounds([min, max]: NumericBounds): NumericBounds {
    return [
        Number.isInteger(min) ? min + 1 : Math.ceil(min),
        Number.isInteger(max) ? max - 1 : Math.floor(max),
    ];
}

function countBounds([min, max]: NumericBounds): number {
    return max - min + 1;
}

const parse = (input: string): BoatRaceList => BoatRaceListSchema.parse(input);

const part1 = (races: BoatRaceList): number =>
    races.reduce(
        (product, race) =>
            product * countBounds(convertBounds(calculateRoots(race))),
        1,
    );

const part2 = (races: BoatRaceList): number => {
    const time = parseInt(races.map(({ time }) => time).join(""), 10);
    const distance = parseInt(
        races.map(({ distance }) => distance).join(""),
        10,
    );
    return countBounds(convertBounds(calculateRoots({ time, distance })));
};

await main(import.meta, parse, part1, part2);
