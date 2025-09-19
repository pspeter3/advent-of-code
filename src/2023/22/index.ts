import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";
import { max, sum } from "../../common/itertools.ts";

interface Vector3D {
    readonly x: number;
    readonly y: number;
    readonly z: number;
}

interface Brick {
    readonly head: Vector3D;
    readonly tail: Vector3D;
}

type BrickList = ReadonlyArray<Brick>;

const Vector3DSchema = z
    .string()
    .transform((part) => part.split(","))
    .pipe(z.tuple([IntSchema, IntSchema, IntSchema]))
    .transform(([x, y, z]) => ({ x, y, z }));
const BrickSchema = z
    .string()
    .transform((line) => line.split("~"))
    .pipe(z.tuple([Vector3DSchema, Vector3DSchema]))
    .transform(([head, tail]) => ({ head, tail }));
const BrickListSchema = LinesSchema(BrickSchema).transform((bricks) =>
    drop(bricks.toSorted((a, b) => a.head.z - b.head.z)),
);

type BrickSet = ReadonlySet<number>;
type EdgeList = ReadonlyArray<BrickSet>;

interface BrickGraph {
    readonly depends: EdgeList;
    readonly supports: EdgeList;
}

function toKeys(brick: Brick): ReadonlySet<string> {
    const result = new Set<string>();
    for (let x = brick.head.x; x <= brick.tail.x; x++) {
        for (let y = brick.head.y; y <= brick.tail.y; y++) {
            result.add(JSON.stringify([x, y]));
        }
    }
    return result;
}

function drop(bricks: BrickList): BrickGraph {
    const depends = Array.from(bricks, () => new Set<number>());
    const supports = Array.from(bricks, () => new Set<number>());
    const grid = new Map<string, readonly [index: number, height: number]>();
    for (const [index, brick] of bricks.entries()) {
        const keys = toKeys(brick);
        const layers = Map.groupBy(
            keys.values().map((key) => grid.get(key) ?? [-1, 0]),
            ([_, h]) => h,
        );
        const base = max(layers.keys());
        const height = brick.tail.z - brick.head.z + 1;
        for (const key of keys) {
            grid.set(key, [index, base + height]);
        }
        for (const [i] of layers
            .get(base)!
            .values()
            .filter(([i]) => i !== -1)) {
            depends[index].add(i);
            supports[i].add(index);
        }
    }
    return { depends, supports };
}

function chain({ depends, supports }: BrickGraph, index: number): number {
    const queue = new Set([index]);
    for (const id of queue) {
        for (const n of supports[id]) {
            if (queue.has(n)) {
                continue;
            }
            if (depends[n].values().some((i) => !queue.has(i))) {
                continue;
            }
            queue.add(n);
        }
    }
    return queue.size - 1;
}

const parse = (input: string): BrickGraph => BrickListSchema.parse(input);

const part1 = ({ depends }: BrickGraph): number => {
    const roots = new Set(
        depends
            .values()
            .filter((d) => d.size === 1)
            .map((d) => Array.from(d)[0]),
    );
    return depends.length - roots.size;
};

const part2 = (graph: BrickGraph): number =>
    sum(graph.depends.keys().map((id) => chain(graph, id)));

main(module, parse, part1, part2);
