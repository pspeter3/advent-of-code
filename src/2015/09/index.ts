import type { WeightedGraph } from "../../common/graph.ts";
import { max, min, permutations, sum } from "../../common/itertools.ts";
import { main } from "../../utils/host.ts";

function* pairs<T>(list: ReadonlyArray<T>): Generator<readonly [T, T]> {
  for (let i = 0; i < list.length - 1; i++) {
    yield [list[i], list[i + 1]];
  }
}

const parse = (input: string): WeightedGraph<string> => {
  const graph = new Map<string, Map<string, number>>();
  for (const line of input.trim().split("\n")) {
    const [prefix, d] = line.split(" = ");
    const [from, to] = prefix.split(" to ");
    const dist = Number(d);
    graph.getOrInsertComputed(from, () => new Map()).set(to, dist);
    graph.getOrInsertComputed(to, () => new Map()).set(from, dist);
  }
  return graph;
};

const part1 = (graph: WeightedGraph<string>): number =>
  min(
    permutations(graph.keys().toArray()).map((path) =>
      sum(pairs(path).map(([from, to]) => graph.get(from)!.get(to)!)),
    ),
  );

const part2 = (graph: WeightedGraph<string>): number =>
  max(
    permutations(graph.keys().toArray()).map((path) =>
      sum(pairs(path).map(([from, to]) => graph.get(from)!.get(to)!)),
    ),
  );

await main(import.meta, parse, part1, part2);
