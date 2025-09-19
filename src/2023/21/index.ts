import { GridBounds2D, GridVector2D } from "../../common/grid2d.ts";
import { enumerate } from "../../common/itertools.ts";
import { main } from "../../utils/host.ts";

interface Garden {
    readonly bounds: GridBounds2D;
    readonly rocks: ReadonlySet<number>;
    readonly start: GridVector2D;
}

const parse = (input: string): Garden => {
    const lines = input.trim().split("\n");
    const bounds = GridBounds2D.fromOrigin({
        q: lines[0].length,
        r: lines.length,
    });
    const rocks = new Set<number>();
    let start: GridVector2D | null = null;
    for (const [r, row] of lines.entries()) {
        for (const [q, char] of enumerate(row)) {
            switch (char) {
                case "S": {
                    start = new GridVector2D(q, r);
                    break;
                }
                case "#": {
                    rocks.add(bounds.toId({ q, r }));
                    break;
                }
                case ".": {
                    break;
                }
                default: {
                    throw new Error(`Invalid char ${char}`);
                }
            }
        }
    }
    if (start === null) {
        throw new Error("Could not find start");
    }
    return { bounds, rocks, start };
};

function walk({ bounds, rocks, start }: Garden, steps: number): number {
    let boundary = [start];
    for (let step = 0; step < steps; step++) {
        const next: GridVector2D[] = [];
        const seen = new Set<string>();
        for (const v of boundary) {
            for (const [_, n] of v.neighbors()) {
                const frame = bounds.translate({
                    q: Math.floor(n.q / bounds.cols) * bounds.cols,
                    r: Math.floor(n.r / bounds.rows) * bounds.rows,
                });
                if (rocks.has(frame.toId(n))) {
                    continue;
                }
                const key = JSON.stringify(n);
                if (!seen.has(key)) {
                    seen.add(key);
                    next.push(n);
                }
            }
        }
        boundary = next;
    }
    return boundary.length;
}

type Point2D = readonly [x: number, y: number];
type Point2DTriple = readonly [a: Point2D, b: Point2D, c: Point2D];

function createQuadratic([[x1, y1], [x2, y2], [x3, y3]]: Point2DTriple): (
    x: number,
) => number {
    const denom = (x1 - x2) * (x1 - x3) * (x2 - x3);
    const a = (x3 * (y2 - y1) + x2 * (y1 - y3) + x1 * (y3 - y2)) / denom;
    const b =
        (x3 * x3 * (y1 - y2) + x2 * x2 * (y3 - y1) + x1 * x1 * (y2 - y3)) /
        denom;
    const c =
        (x2 * x3 * (x2 - x3) * y1 +
            x3 * x1 * (x3 - x1) * y2 +
            x1 * x2 * (x1 - x2) * y3) /
        denom;
    return (x) => a * x * x + b * x + c;
}

const part1 = (garden: Garden): number =>
    garden.bounds.max.equals({ q: 11, r: 11 })
        ? walk(garden, 6)
        : walk(garden, 64);

const part2 = (garden: Garden): number => {
    const triple: [Point2D, Point2D, Point2D] = [
        [0, 0],
        [0, 0],
        [0, 0],
    ];
    const base = garden.bounds.max.q - garden.start.q - 1;
    for (let i = 0; i < 3; i++) {
        const steps = base + garden.bounds.cols * i;
        triple[i] = [i, walk(garden, steps)];
    }
    const fn = createQuadratic(triple);
    return fn(202300);
};

main(module, parse, part1, part2);
