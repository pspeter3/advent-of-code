import { z } from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema, StringSchema } from "../../utils/schemas.ts";

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
        SegmentSchema,
    ),
);

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

const intersections = (segments: ReadonlyArray<Segment>): number => {
    const vents = new Map<string, number>();
    for (const segment of segments) {
        for (const vector of interpolate(segment)) {
            const key = vector.join(",");
            vents.set(key, (vents.get(key) ?? 0) + 1);
        }
    }
    let count = 0;
    for (const value of vents.values()) {
        if (value >= 2) {
            count++;
        }
    }
    return count;
};

const part1 = (segments: ReadonlyArray<Segment>): number =>
    intersections(segments.filter(isGridLine));

const part2 = intersections;

await main(import.meta, (input) => schema.parse(input), part1, part2);
