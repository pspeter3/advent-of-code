import z from "zod";
import { main } from "../../utils/host";
import { LinesSchema } from "../../utils/schemas";

type Mirror = "\\" | "/";
type Splitter = "|" | "-";
type Empty = ".";
type Tile = Mirror | Splitter | Empty;
type TileList = ReadonlyArray<Tile>;
type TileMatrix = ReadonlyArray<TileList>;

interface GridVector {
    readonly q: number;
    readonly r: number;
}

class Grid {
    readonly bounds: GridVector;
    readonly #matrix: TileMatrix;
    
    constructor(matrix: TileMatrix) {
        this.bounds = { q: matrix[0].length, r: matrix.length };
        this.#matrix = matrix;
    }

    has({ q, r }: GridVector): boolean {
        return q >= 0 && q < this.bounds.q && r >= 0 && r < this.bounds.r;
    }

    at(vector: GridVector): Tile {
        if (!this.has(vector)) {
            throw new Error("Out of bounds");
        }
        const { q, r } = vector;
        return this.#matrix[r][q];
    }

    toId(vector: GridVector): number {
        if (!this.has(vector)) {
            throw new Error("Out of bounds");
        }
        const { q, r } = vector;
        return r * this.bounds.q + q;
    }
}

enum Direction {
    Up = 0,
    Right = 1,
    Down = 2,
    Left = 3,
}

const DELTAS: ReadonlyArray<GridVector> = [
    { q: 0, r: -1 },
    { q: 1, r: 0 },
    { q: 0, r: 1 },
    { q: -1, r: 0 },
];

const add = (a: GridVector, b: GridVector): GridVector => ({
    q: a.q + b.q,
    r: a.r + b.r,
});

const equals = (a: GridVector, b: GridVector): boolean =>
    a.q === b.q && a.r === b.r;

const toDelta = (direction: Direction): GridVector => DELTAS[direction];
function toDirection(delta: GridVector): Direction {
    const index = DELTAS.findIndex((d) => equals(delta, d));
    if (index === -1) {
        throw new Error("Invalid delta");
    }
    return index as Direction;
}

const isHorizontal = (delta: GridVector): boolean => delta.r === 0;
const isVertical = (delta: GridVector): boolean => delta.q === 0;

type Beam = readonly [position: GridVector, direction: Direction];

const TileSchema = z.enum(["\\", "/", "|", "-", "."]);
const TileListSchema = z
    .string()
    .transform((line) => line.split(""))
    .pipe(z.array(TileSchema));
const Schema = LinesSchema(TileListSchema).transform(
    (matrix) => new Grid(matrix),
);

function energize(grid: Grid, start: Beam): number {
    const queue: Beam[] = [start];
    const cache = new Map<number, Set<Direction>>();
    const check = (id: number, direction: Direction): boolean => {
        if (cache.get(id)?.has(direction)) {
            return true;
        }
        if (!cache.has(id)) {
            cache.set(id, new Set());
        }
        cache.get(id)!.add(direction);
        return false;
    };
    for (const [position, direction] of queue) {
        const delta = toDelta(direction);
        const next = add(position, delta);
        if (!grid.has(next) || check(grid.toId(next), direction)) {
            continue;
        }
        const push = (direction: Direction): unknown =>
            queue.push([next, direction]);
        switch (grid.at(next)) {
            case ".": {
                push(direction);
                break;
            }
            case "\\": {
                const { q, r } = delta;
                push(toDirection({ q: r, r: q }));
                break;
            }
            case "/": {
                const { q, r } = delta;
                push(toDirection({ q: -r, r: -q }));
                break;
            }
            case "|": {
                if (isHorizontal(delta)) {
                    push(Direction.Up);
                    push(Direction.Down);
                } else {
                    push(direction);
                }
                break;
            }
            case "-": {
                if (isVertical(delta)) {
                    push(Direction.Right);
                    push(Direction.Left);
                } else {
                    push(direction);
                }
                break;
            }
        }
    }
    return cache.size;
}

const parse = (input: string): Grid => Schema.parse(input);

const part1 = (grid: Grid): number =>
    energize(grid, [{ q: -1, r: 0 }, Direction.Right]);

const part2 = (grid: Grid): number => {
    let max = -Infinity;
    for (let q = 0; q < grid.bounds.q; q++) {
        max = Math.max(max, energize(grid, [{q, r: -1}, Direction.Down]));
        max = Math.max(max, energize(grid, [{q, r: grid.bounds.r}, Direction.Up]));
    }
    for (let r = 0; r < grid.bounds.r; r++) {
        max = Math.max(max, energize(grid, [{q: -1, r }, Direction.Right]));
        max = Math.max(max, energize(grid, [{q: grid.bounds.q, r}, Direction.Left]));
    }
    return max;
}

main(module, parse, part1, part2);
