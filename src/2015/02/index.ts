import z from "zod";
import { main } from "../../utils/host";
import { LinesSchema } from "../../utils/schemas";

type Box = readonly [length: number, width: number, height: number];
type Side = readonly [x: number, y: number];

const PackingSchema = LinesSchema(
    z
        .string()
        .transform((value) => value.split("x"))
        .pipe(
            z.tuple([z.coerce.number(), z.coerce.number(), z.coerce.number()]),
        ),
);

const toSides = ([l, w, h]: Box): ReadonlyArray<Side> => [
    [l, w],
    [w, h],
    [h, l],
];

const toArea = ([x, y]: Side): number => x * y;

const toPerimeter = ([x, y]: Side): number => 2 * x + 2 * y;

const toVolume = ([l, w, h]: Box): number => l * w * h;

const toWrapping = (box: Box): number => {
    let min = Infinity;
    let sum = 0;
    for (const side of toSides(box)) {
        const area = toArea(side);
        min = Math.min(min, area);
        sum += 2 * area;
    }
    return sum + min;
};

const toRibbon = (box: Box): number => {
    const perimeter = toSides(box).reduce(
        (min, side) => Math.min(min, toPerimeter(side)),
        Infinity,
    );
    return perimeter + toVolume(box);
};

const parse = (input: string): ReadonlyArray<Box> => PackingSchema.parse(input);

const part1 = (input: ReadonlyArray<Box>): number =>
    input.reduce((sum, box) => sum + toWrapping(box), 0);

const part2 = (input: ReadonlyArray<Box>): number =>
    input.reduce((sum, box) => sum + toRibbon(box), 0);

main(module, parse, part1, part2);
