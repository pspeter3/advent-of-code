import z from "zod";
import { main } from "../../utils/host.ts";
import { LinesSchema } from "../../utils/schemas.ts";
import {
    createUndirectedGraph,
    findCliques,
    type Graph,
} from "../../common/graph.ts";

type Pair = readonly [string, string];
type PairList = ReadonlyArray<Pair>;

interface Puzzle {
    readonly pairs: PairList;
    readonly graph: Graph<string>;
}

const PairSchema = z
    .string()
    .transform((line) => line.split("-"))
    .pipe(z.tuple([z.string(), z.string()]));
const Schema = LinesSchema(PairSchema).transform((pairs: PairList) => ({
    pairs,
    graph: createUndirectedGraph(pairs),
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
