import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";
import {
    GridBounds2D,
    GridVector2D,
    GridVector2DMap,
    GridVector2DSet,
} from "../../common/grid2d.ts";
import { Heap } from "heap-js";

interface Puzzle {
    readonly bounds: GridBounds2D;
    readonly vectors: ReadonlyArray<GridVector2D>;
}

const isExample = (vectors: ReadonlyArray<GridVector2D>): boolean =>
    vectors.length === 25;

const Schema = LinesSchema(
    z
        .string()
        .transform((line) => line.split(","))
        .pipe(z.tuple([IntSchema, IntSchema]))
        .transform((pair) => GridVector2D.fromTuple(pair)),
).transform((vectors) => {
    const size = (isExample(vectors) ? 6 : 70) + 1;
    const bounds = GridBounds2D.fromOrigin({ q: size, r: size });
    return { bounds, vectors };
});

const explore = (
    bounds: GridBounds2D,
    walls: ReadonlySet<GridVector2D>,
): number | null => {
    const start = new GridVector2D(0, 0);
    const end = bounds.max.northWest();
    const cost = new GridVector2DMap<number>(bounds, [[start, 0]]);
    const queue = new Heap<GridVector2D>((a, b) => cost.get(a)! - cost.get(b)!);
    queue.push(start);
    for (const cell of queue) {
        const current = cost.get(cell)!;
        if (cell.equals(end)) {
            return current;
        }
        for (const [_, neighbor] of cell.neighbors()) {
            if (!bounds.includes(neighbor) || walls.has(neighbor)) {
                continue;
            }
            const next = current + 1;
            if (cost.has(neighbor) && cost.get(neighbor)! <= next) {
                continue;
            }
            cost.set(neighbor, next);
            queue.push(neighbor);
        }
    }
    return null;
};

const search = (puzzle: Puzzle, min: number, max: number): number => {
    if (max - min === 1) {
        return min;
    }
    const mid = Math.floor((min + max) / 2);
    const result = explore(
        puzzle.bounds,
        new GridVector2DSet(puzzle.bounds, puzzle.vectors.values().take(mid)),
    );
    if (result === null) {
        return search(puzzle, min, mid);
    }
    return search(puzzle, mid, max);
};

const serialize = ({ q, r }: GridVector2D): string => `${q},${r}`;

const parse = (input: string): Puzzle => Schema.parse(input);

const part1 = ({ bounds, vectors }: Puzzle): number => {
    const result = explore(
        bounds,
        new GridVector2DSet(
            bounds,
            vectors.values().take(isExample(vectors) ? 12 : 1024),
        ),
    );
    if (result === null) {
        throw new Error("No path found");
    }
    return result;
};

const part2 = (puzzle: Puzzle): string =>
    serialize(puzzle.vectors[search(puzzle, 0, puzzle.vectors.length)]);

main(module, parse, part1, part2);
