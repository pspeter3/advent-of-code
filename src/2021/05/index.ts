import { z } from "zod";
import { main } from "../../utils/host";
import { IntSchema, LinesSchema, StringSchema } from "../../utils/schemas";

type Vector = readonly [x: number, y: number];
type Segment = readonly [a: Vector, b: Vector];

const VectorSchema = z.tuple([IntSchema, IntSchema]);
const SegmentSchema = z.tuple([VectorSchema, VectorSchema]);

const schema = LinesSchema(
    z.preprocess(
        (line) =>
            StringSchema.parse(line)
                .split(" -> ")
                .map((part) => part.split(",")),
        SegmentSchema
    )
);

const max = ([x1, y1]: Vector, [x2, y2]: Vector): Vector => [
    Math.max(x1, x2),
    Math.max(y1, y2),
];

const isGridLine = ([[x1, y1], [x2, y2]]: Segment): boolean =>
    x1 === x2 || y1 === y2;

const interpolate = ([[x1, y1], [x2, y2]]: Segment): ReadonlyArray<Vector> => {
    const delta = [x2 - x1, y2 - y1];
    const length = Math.max(...delta.map((value) => Math.abs(value)));
    const [dx, dy] = delta.map((value) => Math.sign(value));
    const vectors: Vector[] = [];
    for (let i = 0; i <= length; i++) {
        vectors.push([x1 + i * dx, y1 + i * dy]);
    }
    return vectors;
};

const toCanvas = (segments: ReadonlyArray<Segment>): number[][] => {
    let bounds: Vector = [0, 0];
    for (const segment of segments) {
        bounds = max(bounds, max(...segment));
    }
    const [cols, rows] = bounds.map((value) => value + 1);
    return Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => 0)
    );
};

const intersections = (segments: ReadonlyArray<Segment>): number => {
    const canvas = toCanvas(segments);
    for (const segment of segments) {
        for (const [col, row] of interpolate(segment)) {
            canvas[row][col]++;
        }
    }
    return canvas.reduce(
        (sum, row) => sum + row.filter((cell) => cell >= 2).length,
        0
    );
};

const part1 = (segments: ReadonlyArray<Segment>): number =>
    intersections(segments.filter(isGridLine));

const part2 = intersections;

main(module, schema, part1, part2);
