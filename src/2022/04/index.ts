import { z } from "zod";
import { main } from "../../utils/host";
import { IntSchema, LinesSchema, StringSchema } from "../../utils/schemas";

const RangeSchema = z.preprocess(
    (section) => StringSchema.parse(section).split("-"),
    z.tuple([IntSchema, IntSchema])
);
const PairSchema = z.preprocess(
    (line) => StringSchema.parse(line).split(","),
    z.tuple([RangeSchema, RangeSchema])
);
const schema = LinesSchema(PairSchema);

type Range = readonly [min: number, max: number];
type Pair = readonly [a: Range, b: Range];

const contains = ([aMin, aMax]: Range, [bMin, bMax]: Range): boolean =>
    aMin <= bMin && aMax >= bMax;

const overlap = ([aMin, aMax]: Range, [bMin, bMax]: Range): boolean =>
    aMin <= bMax && bMin <= aMax;

const part1 = (input: ReadonlyArray<Pair>): number =>
    input.filter(([a, b]) => contains(a, b) || contains(b, a)).length;

const part2 = (input: ReadonlyArray<Pair>): number =>
    input.filter(([a, b]) => overlap(a, b)).length;

main(module, (input) => schema.parse(input), part1, part2);
