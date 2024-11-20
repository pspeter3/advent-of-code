import z from "zod";
import { main } from "../../utils/host";
import { LinesSchema } from "../../utils/schemas";
import { Graph, minCut, WeightedMatrixGraph } from "../../common/graph";

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

function toMatrixGraph<T>(graph: Graph<T>): WeightedMatrixGraph<T> {
    const nodes = new Set(graph.keys());
    const matrix = Array.from(nodes, (i) =>
        Array.from(nodes, (j) => (graph.get(i)!.has(j) ? 1 : 0)),
    );
    return { nodes, matrix };
}

type Matrix = number[][];

interface MinCutResult {
    readonly cuts: number;
    readonly nodes: ReadonlySet<number>;
}

const parse = (input: string): Graph<string> => GraphSchema.parse(input);

const part1 = (graph: Graph<string>): number => {
    const { nodes } = minCut(toMatrixGraph(graph));
    const s = nodes.size;
    const t = graph.size - s;
    return s * t;
};

const part2 = (_: unknown): number => 0;

main(module, parse, part1, part2);
