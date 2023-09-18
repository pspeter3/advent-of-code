import { z } from "zod";
import { main } from "../../utils/host";
import { IntSchema, LinesSchema, StringSchema } from "../../utils/schemas";

const VectorSchema = z.preprocess(
    (line) => StringSchema.parse(line).trim().split(","),
    z.tuple([IntSchema, IntSchema]),
);
const AxisSchema = z.enum(["x", "y"]);
const schema = z.preprocess(
    (input) => StringSchema.parse(input).trim().split("\n\n"),
    z.tuple([
        LinesSchema(VectorSchema),
        LinesSchema(
            z.preprocess(
                (line) => {
                    const match = StringSchema.parse(line)
                        .trim()
                        .match(/fold along ([x,y])=(\d+)/);
                    return match?.slice(1, 3);
                },
                z.tuple([AxisSchema, IntSchema]),
            ),
        ),
    ]),
);

type Vector = readonly [x: number, y: number];
type Axis = z.infer<typeof AxisSchema>;
type Fold = readonly [axis: Axis, position: number];
type Input = readonly [
    vectors: ReadonlyArray<Vector>,
    folds: ReadonlyArray<Fold>,
];
type Key = string;
type Dots = ReadonlySet<Key>;

const serialize = (vector: Vector): Key => vector.join(",");

const toDots = (vectors: ReadonlyArray<Vector>): Dots => {
    const dots = new Set<Key>();
    for (const vector of vectors) {
        dots.add(serialize(vector));
    }
    return dots;
};

const shift = (value: number, delta: number): number =>
    value <= delta ? value : delta - (value - delta);

const transform = ([x, y]: Vector, [axis, delta]: Fold): Vector => {
    switch (axis) {
        case "x": {
            return [shift(x, delta), y];
        }
        case "y": {
            return [x, shift(y, delta)];
        }
    }
};

const fold = (dots: Dots, fold: Fold): Dots => {
    const next = new Set<Key>();
    for (const key of dots) {
        const vector = VectorSchema.parse(key);
        next.add(serialize(transform(vector, fold)));
    }
    return next;
};

const part1 = ([vectors, folds]: Input): number =>
    fold(toDots(vectors), folds[0]).size;

const part2 = ([vectors, folds]: Input): string => {
    let dots = toDots(vectors);
    for (const f of folds) {
        dots = fold(dots, f);
    }
    let bounds: Vector = [0, 0];
    for (const key of dots) {
        const [x, y] = VectorSchema.parse(key);
        bounds = [Math.max(x, bounds[0]), Math.max(y, bounds[1])];
    }
    const [cols, rows] = bounds;
    return Array.from({ length: rows + 1 }, (_, y) =>
        Array.from({ length: cols + 1 }, (_, x) =>
            dots.has(serialize([x, y])) ? "#" : ".",
        ).join(""),
    ).join("\n");
};

main(module, (input) => schema.parse(input), part1, part2);
