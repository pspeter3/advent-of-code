import z from "zod";
import { main } from "../../utils/host.ts";
import { LinesSchema } from "../../utils/schemas.ts";
import {
    CardinalDirection,
    GridVector2D,
    MatrixGrid,
} from "../../common/grid2d.ts";
import { max } from "../../common/itertools.ts";

const SLOPES = ["^", ">", "v", "<"] as const;
type Slope = (typeof SLOPES)[number];
type Forest = "#";
type Path = ".";
type Tile = Path | Forest | Slope;

const Schema = LinesSchema(
    z
        .string()
        .transform((line) => line.split(""))
        .pipe(z.array(z.union([z.enum([".", "#"]), z.enum(SLOPES)]))),
).transform((matrix) => new MatrixGrid(matrix));

const isForest = (tile: Tile): tile is Forest => tile === "#";
const isPath = (tile: Tile): tile is Path => tile === ".";
const isSlope = (tile: Tile): tile is Slope => !isPath(tile) && !isForest(tile);

const toCardinalDirection = (slope: Slope): CardinalDirection =>
    SLOPES.indexOf(slope) as CardinalDirection;

const parse = (input: string): MatrixGrid<Tile> => Schema.parse(input);

type EdgeWeightMap = ReadonlyMap<number, number>;
type WeightGraph = ReadonlyMap<number, EdgeWeightMap>;

function walk(
    grid: MatrixGrid<Tile>,
    start: GridVector2D,
    neighbor: GridVector2D,
    slopes: boolean,
): readonly [number, number] | null {
    if (!grid.bounds.includes(neighbor) || isForest(grid.at(neighbor))) {
        return null;
    }
    const queue = [start, neighbor];
    for (const curr of queue) {
        if (curr.equals(start)) {
            continue;
        }
        const tile = grid.at(curr);
        if (isForest(tile)) {
            throw new Error("Cannot walk on forests");
        }
        if (isSlope(tile) && slopes) {
            queue.push(curr.neighbor(toCardinalDirection(tile)));
            continue;
        }
        const options = Array.from(
            curr
                .neighbors()
                .map(([_, n]) => n)
                .filter(
                    (n) =>
                        !queue.at(-2)!.equals(n) &&
                        grid.bounds.includes(n) &&
                        !isForest(grid.at(n)),
                ),
        );
        if (options.length !== 1) {
            return [grid.bounds.toId(curr), queue.length - 1];
        }
        queue.push(options[0]);
    }
    return null;
}

function toWeightGraph(
    grid: MatrixGrid<Tile>,
    start: GridVector2D,
    slopes: boolean,
): WeightGraph {
    const graph = new Map<number, Map<number, number>>();
    const queue = [start];
    for (const current of queue) {
        const edges = new Map(
            current
                .neighbors()
                .map(([_, n]) => walk(grid, current, n, slopes))
                .filter((n) => n !== null) as Iterable<[number, number]>,
        );
        graph.set(grid.bounds.toId(current), edges);
        for (const key of edges.keys()) {
            if (!graph.has(key)) {
                queue.push(grid.bounds.fromId(key));
            }
        }
    }
    return graph;
}

function distance(graph: WeightGraph, path: ReadonlySet<number>): number {
    let prev: number | null = null;
    let total = 0;
    for (const curr of path) {
        if (prev !== null) {
            const distance = graph.get(prev)!.get(curr)!;
            total += distance;
        }
        prev = curr;
    }
    return total;
}

function longestPath(
    graph: WeightGraph,
    current: number,
    target: number,
    path: ReadonlySet<number>,
): number {
    const next = new Set(path);
    next.add(current);
    if (current === target) {
        const result = distance(graph, next);
        return result;
    }
    return max(
        graph
            .get(current)!
            .keys()
            .filter((id) => !next.has(id))
            .map((id) => longestPath(graph, id, target, next)),
    );
}

const toStart = ({ bounds }: MatrixGrid<unknown>): GridVector2D =>
    bounds.min.add({ q: 1, r: 0 });
const toEnd = ({ bounds }: MatrixGrid<unknown>): GridVector2D =>
    bounds.max.add({ q: -2, r: -1 });

function solve(grid: MatrixGrid<Tile>, slopes: boolean): number {
    const start = toStart(grid);
    const graph = toWeightGraph(grid, start, slopes);
    return longestPath(
        graph,
        grid.bounds.toId(start),
        grid.bounds.toId(toEnd(grid)),
        new Set(),
    );
}

const part1 = (grid: MatrixGrid<Tile>): number => solve(grid, true);

const part2 = (grid: MatrixGrid<Tile>): number => solve(grid, false);

await main(import.meta, parse, part1, part2);
