import { Heap } from "heap-js";
import {
    CardinalDirection,
    GridBounds2D,
    GridVector2D,
    MatrixGrid,
    cardinalDirections,
} from "../../common/grid2d.ts";
import { main } from "../../utils/host.ts";
import { IntSchema, MatrixSchema } from "../../utils/schemas.ts";

const Schema = MatrixSchema(IntSchema).transform(
    (matrix) => new MatrixGrid(matrix),
);

interface DistanceRecord {
    readonly current: GridVector2D;
    readonly direction: CardinalDirection;
    readonly cost: number;
}

function* turns(direction: CardinalDirection): Iterable<CardinalDirection> {
    yield (direction === 0 ? 3 : direction - 1) as CardinalDirection;
    yield ((direction + 1) % 4) as CardinalDirection;
}

function distance(
    grid: MatrixGrid<number>,
    source: GridVector2D,
    target: GridVector2D,
    min: number,
    max: number,
): number {
    const seen = new Map<number, Set<CardinalDirection>>();
    const check = (
        vector: GridVector2D,
        direction: CardinalDirection,
    ): boolean => {
        const id = grid.bounds.toId(vector);
        if (seen.get(id)?.has(direction)) {
            return true;
        }
        if (!seen.has(id)) {
            seen.set(id, new Set());
        }
        seen.get(id)?.add(direction);
        return false;
    };
    const queue = new Heap<DistanceRecord>((a, b) => a.cost - b.cost);
    for (const direction of cardinalDirections()) {
        queue.push({ current: source, direction, cost: 0 });
    }
    for (const { current, direction, cost } of queue) {
        if (current.equals(target)) {
            return cost;
        }
        if (check(current, direction)) {
            continue;
        }
        for (const d of turns(direction)) {
            let c = current;
            let delta = cost;
            for (let i = 1; i <= max; i++) {
                c = c.neighbor(d);
                if (!grid.bounds.includes(c)) {
                    break;
                }
                delta += grid.at(c);
                if (i >= min) {
                    queue.push({ current: c, direction: d, cost: delta });
                }
            }
        }
    }
    return Infinity;
}

const parse = (input: string): MatrixGrid<number> => Schema.parse(input);

const part1 = (grid: MatrixGrid<number>): number =>
    distance(grid, grid.bounds.min, grid.bounds.max.northWest(), 1, 3);

const part2 = (grid: MatrixGrid<number>): number =>
    distance(grid, grid.bounds.min, grid.bounds.max.northWest(), 4, 10);

main(module, parse, part1, part2);
