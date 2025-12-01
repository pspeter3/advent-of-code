import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema } from "../../utils/schemas.ts";
import { mod } from "../../common/math.ts";

const Direction = {
    Left: "L",
    Right: "R",
} as const;
type Direction = (typeof Direction)[keyof typeof Direction];

type Rotation = readonly [direction: Direction, amount: number];

type RotationList = ReadonlyArray<Rotation>;

const RotationSchema = z.tuple([z.enum(Direction), IntSchema]);

const parse = (input: string): RotationList =>
    input
        .trim()
        .split("\n")
        .map((line) => RotationSchema.parse([line[0], line.slice(1)]));

const toDelta = ([direction, amount]: Rotation): number =>
    direction === Direction.Left ? -amount : amount;

const START = 50;
const SIZE = 100;

const part1 = (rotations: RotationList): number => {
    let curr = START;
    let count = 0;
    for (const delta of rotations.values().map(toDelta)) {
        curr = mod(curr + delta, SIZE);
        if (curr === 0) {
            count++;
        }
    }
    return count;
};

const part2 = (rotations: RotationList): number => {
    let curr = START;
    let count = 0;
    for (const delta of rotations.values().map(toDelta)) {
        const base = delta > 0 ? curr : curr === 0 ? 0 : SIZE - curr;
        const spins = Math.floor((base + Math.abs(delta)) / SIZE);
        curr = mod(curr + delta, SIZE);
        count += spins;
    }
    return count;
};

await main(import.meta, parse, part1, part2);
