import z from "zod";
import { main } from "../../utils/host";
import { LinesSchema } from "../../utils/schemas";
import { Graph } from "../../common/graph";

type Pair = readonly [string, string];
type PairList = ReadonlyArray<Pair>;

interface Puzzle {
    readonly pairs: PairList;
    readonly graph: Graph<string>;
}

const addEdge = (
    graph: Map<string, Set<string>>,
    key: string,
    value: string,
) => {
    if (!graph.has(key)) {
        graph.set(key, new Set());
    }
    graph.get(key)!.add(value);
};

const createGraph = (pairs: PairList): Graph<string> => {
    const graph = new Map<string, Set<string>>();
    for (const [a, b] of pairs) {
        addEdge(graph, a, b);
        addEdge(graph, b, a);
    }
    return graph;
};

const bronKerbosch = <T>(
    R: Set<T>,
    P: Set<T>,
    X: Set<T>,
    graph: Graph<T>,
    cliques: Array<ReadonlySet<T>>,
): void => {
    if (P.size === 0 && X.size === 0) {
        cliques.push(R);
        return;
    }
    for (const v of P) {
        const newR = new Set(R).add(v);
        const neighbors = graph.get(v) ?? new Set();
        const newP = P.intersection(neighbors);
        const newX = X.intersection(neighbors);
        bronKerbosch(newR, newP, newX, graph, cliques);
        P.delete(v);
        X.add(v);
    }
};

const findCliques = (
    graph: Graph<string>,
): ReadonlyArray<ReadonlySet<string>> => {
    const cliques: Array<ReadonlySet<string>> = [];
    bronKerbosch(new Set(), new Set(graph.keys()), new Set(), graph, cliques);
    return cliques;
};

const PairSchema = z
    .string()
    .transform((line) => line.split("-"))
    .pipe(z.tuple([z.string(), z.string()]));
const Schema = LinesSchema(PairSchema).transform((pairs: PairList) => ({
    pairs,
    graph: createGraph(pairs),
}));

const parse = (input: string): Puzzle => Schema.parse(input);

const part1 = ({ pairs, graph }: Puzzle): number =>
    new Set(
        pairs
            .values()
            .filter((pair) => pair.some((id) => id.startsWith("t")))
            .flatMap(([a, b]) =>
                graph
                    .get(a)!
                    .intersection(graph.get(b)!)
                    .values()
                    .map((id) => [a, b, id].sort().join(",")),
            ),
    ).size;

const part2 = ({ graph }: Puzzle): string => {
    const cliques = findCliques(graph);
    let result: ReadonlySet<string> = new Set();
    for (const clique of cliques) {
        if (clique.size > result.size) {
            result = clique;
        }
    }
    return Array.from(result).sort().join(",");
};

main(module, parse, part1, part2);
