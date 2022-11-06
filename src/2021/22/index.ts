import { z } from "zod";
import { main } from "../../utils/host";
import { IntSchema, LinesSchema, StringSchema } from "../../utils/schemas";

enum Command {
    On = "on",
    Off = "off",
}

type Range = readonly [min: number, max: number];
type Cuboid = readonly [x: Range, y: Range, z: Range];

type Step = readonly [command: Command, cuboid: Cuboid];

const RangeSchema = z.preprocess(
    (data) => StringSchema.parse(data).trim().split(".."),
    z.tuple([IntSchema, IntSchema])
);

const CuboidSchema = z.preprocess(
    (data) =>
        StringSchema.parse(data)
            .trim()
            .split(",")
            .map((part) => part.split("=")[1]),
    z.tuple([RangeSchema, RangeSchema, RangeSchema])
);

const schema = LinesSchema(
    z.preprocess(
        (line) => StringSchema.parse(line).trim().split(" "),
        z.tuple([z.nativeEnum(Command), CuboidSchema])
    )
);

const serialize = (cuboid: Cuboid): string => JSON.stringify(cuboid);
const parse = (key: string): Cuboid => JSON.parse(key);

const overlap = ([aMin, aMax]: Range, [bMin, bMax]: Range): Range | null => {
    if (bMin > aMax || aMin > bMax) {
        return null;
    }
    return [Math.max(aMin, bMin), Math.min(aMax, bMax)];
};

const intersect = (a: Cuboid, b: Cuboid): Cuboid | null => {
    const next = a.map((range, index) => overlap(range, b[index]));
    if (next.includes(null)) {
        return null;
    }
    return next as unknown as Cuboid;
};

const size = (cuboid: Cuboid): number =>
    cuboid.reduce((volume, [min, max]) => volume * (max - min + 1), 1);

const inBounds = (cuboid: Cuboid): boolean =>
    cuboid.every(([min, max]) => min >= -50 && max <= 50);

const increment = (
    counter: Map<string, number>,
    key: string,
    amount: number = 1
): void => {
    counter.set(key, (counter.get(key) ?? 0) + amount);
};

const reboot = (
    steps: ReadonlyArray<Step>,
    filter: (cuboid: Cuboid) => boolean
): number => {
    const volumes = new Map<string, number>();
    for (const [command, cuboid] of steps) {
        if (!filter(cuboid)) {
            continue;
        }
        const updates = new Map<string, number>();
        for (const [key, count] of volumes) {
            if (count === 0) {
                continue;
            }
            const intersection = intersect(cuboid, parse(key));
            if (intersection !== null) {
                increment(updates, serialize(intersection), -1 * count);
            }
        }
        for (const [key, count] of updates) {
            increment(volumes, key, count);
        }
        if (command === Command.On) {
            increment(volumes, serialize(cuboid));
        }
    }
    let total = 0;
    for (const [key, count] of volumes) {
        total += count * size(parse(key));
    }
    return total;
};

const part1 = (steps: ReadonlyArray<Step>): number => reboot(steps, inBounds);
const part2 = (steps: ReadonlyArray<Step>): number => reboot(steps, () => true);

main(module, (input) => schema.parse(input), part1, part2);
