import z from "zod";
import { main } from "../../utils/host";
import { LinesSchema } from "../../utils/schemas";

const EdgeListSchema = z
    .string()
    .transform((line) => {
        const [key, rest] = line.split(/:\s+/);
        return [key, new Set(rest.split(/\s+/g))];
    })
    .pipe(z.tuple([z.string(), z.set(z.string())]));

const GraphSchema = LinesSchema(EdgeListSchema).transform((entries) => {
    const graph = new Map(entries);
    for (const [key, edges] of graph) {
        for (const edge of edges) {
            if (!graph.has(edge)) {
                graph.set(edge, new Set());
            }
            graph.get(edge)!.add(key);
        }
    }
    return graph;
});

type Graph<T> = ReadonlyMap<T, ReadonlySet<T>>;

function toMatrix<T>(graph: Graph<T>): Matrix {
    const keys = Array.from(graph.keys());
    const matrix = Array.from(keys, (i) =>
        Array.from(keys, (j) => (graph.get(i)!.has(j) ? 1 : 0)),
    );
    return matrix;
}

type Matrix = number[][];

interface MinCutResult {
    readonly cuts: number;
    readonly nodes: ReadonlySet<number>;
}

function minCut(matrix: Matrix): MinCutResult {
    let best: MinCutResult = { cuts: Infinity, nodes: new Set() };
    const size = matrix.length;
    const partitions = Array.from({ length: size }, (_, i) => new Set([i]));
    for (let phase = 1; phase < size; phase++) {
        const weights = Array.from(matrix[0]);
        let s = 0,
            t = 0;
        for (let iteration = 0; iteration < size - phase; iteration++) {
            weights[t] = -Infinity;
            s = t;
            let index: number | null = null;
            let max = -Infinity;
            for (const [i, v] of weights.entries()) {
                if (v > max) {
                    max = v;
                    index = i;
                }
            }
            t = index!;
            for (let i = 0; i < size; i++) {
                weights[i] += matrix[t][i];
            }
        }
        const cuts = weights[t] - matrix[t][t];
        if (cuts < best.cuts) {
            best = { cuts, nodes: partitions[t] };
        }
        for (const id of partitions[t]) {
            partitions[s].add(id);
        }
        for (let i = 0; i < size; i++) matrix[s][i] += matrix[t][i];
        for (let i = 0; i < size; i++) matrix[i][s] = matrix[s][i];
        matrix[0][t] = -Infinity;
    }

    return best;
}

const parse = (input: string): Graph<string> => GraphSchema.parse(input);

const part1 = (graph: Graph<string>): number => {
    const { cuts, nodes } = minCut(toMatrix(graph));
    const s = nodes.size;
    const t = graph.size - s;
    return s * t;
};

const part2 = (_: unknown): number => 0;

main(module, parse, part1, part2);
