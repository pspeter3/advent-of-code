import z from "zod";
import { main } from "../../utils/host";
import { LinesSchema } from "../../utils/schemas";
import { map, max } from "../../common/itertools";
import {
    CardinalDirection,
    GridBounds2D,
    GridVector2D,
    GridVector2DRecord,
    MatrixGrid,
    toGridDelta,
    toGridDirection,
} from "../../common/grid2d";

type Mirror = "\\" | "/";
type Splitter = "|" | "-";
type Empty = ".";
type Tile = Mirror | Splitter | Empty;

const isHorizontal = (delta: GridVector2DRecord): boolean => delta.r === 0;
const isVertical = (delta: GridVector2DRecord): boolean => delta.q === 0;

type Beam = readonly [position: GridVector2D, direction: CardinalDirection];

const TileSchema = z.enum(["\\", "/", "|", "-", "."]);
const TileListSchema = z
    .string()
    .transform((line) => line.split(""))
    .pipe(z.array(TileSchema));
const Schema = LinesSchema(TileListSchema).transform(
    (matrix) => new MatrixGrid(matrix),
);

function energize(grid: MatrixGrid<Tile>, start: Beam): number {
    const queue: Beam[] = [start];
    const cache = new Map<number, Set<CardinalDirection>>();
    const check = (
        position: GridVector2DRecord,
        direction: CardinalDirection,
    ): boolean => {
        const id = grid.bounds.toId(position);
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
        const delta = toGridDelta(direction);
        const next = position.add(delta);
        if (!grid.bounds.contains(next) || check(next, direction)) {
            continue;
        }
        const push = (direction: CardinalDirection): unknown =>
            queue.push([next, direction]);
        switch (grid.at(next)) {
            case ".": {
                push(direction);
                break;
            }
            case "\\": {
                const { q, r } = delta;
                push(toGridDirection({ q: r, r: q }) as CardinalDirection);
                break;
            }
            case "/": {
                const { q, r } = delta;
                push(toGridDirection({ q: -r, r: -q }) as CardinalDirection);
                break;
            }
            case "|": {
                if (isHorizontal(delta)) {
                    push(CardinalDirection.North);
                    push(CardinalDirection.South);
                } else {
                    push(direction);
                }
                break;
            }
            case "-": {
                if (isVertical(delta)) {
                    push(CardinalDirection.East);
                    push(CardinalDirection.West);
                } else {
                    push(direction);
                }
                break;
            }
        }
    }
    return cache.size;
}

function* starts({ min, max }: GridBounds2D): Iterable<Beam> {
    for (let q = min.q; q < max.q; q++) {
        yield [new GridVector2D(q, -1), CardinalDirection.South];
        yield [new GridVector2D(q, max.r), CardinalDirection.North];
    }
    for (let r = min.r; r < max.r; r++) {
        yield [new GridVector2D(-1, r), CardinalDirection.East];
        yield [new GridVector2D(max.q, r), CardinalDirection.West];
    }
}

const parse = (input: string): MatrixGrid<Tile> => Schema.parse(input);

const part1 = (grid: MatrixGrid<Tile>): number =>
    energize(grid, [new GridVector2D(-1, 0), CardinalDirection.East]);

const part2 = (grid: MatrixGrid<Tile>): number =>
    max(map(starts(grid.bounds), (beam) => energize(grid, beam)));

main(module, parse, part1, part2);
