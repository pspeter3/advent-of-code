import type { WeightedGraph } from "../../common/graph.ts";
import { max, permutations, sum } from "../../common/itertools.ts";
import { main } from "../../utils/host.ts";

const PATTERN = /^(\w+) would (gain|lose) (\d+) happiness units by sitting next to (\w+).$/;

function* pairs(names: ReadonlyArray<string>): Generator<readonly [string, string]> {
  for (let i = 0; i < names.length; i++) {
    const a = names[i];
    const b = names[(i + 1) % names.length];
    yield [a, b] as const;
    yield [b, a] as const;
  }
}

const parse = (input: string): WeightedGraph<string> => {
  const graph: Map<string, Map<string, number>> = new Map();
  for (const line of input.trim().split("\n")) {
    const match = line.match(PATTERN);
    if (!match) {
      throw new Error(`Invalid line: ${line}`);
    }
    const [_, source, sign, amount, target] = match;
    const value = parseInt(amount, 10) * (sign === "gain" ? 1 : -1);
    if (!graph.has(source)) {
      graph.set(source, new Map());
    }
    graph.get(source)!.set(target, value);
  }
  return graph;
};

const addSelf = (graph: WeightedGraph<string>): WeightedGraph<string> => {
  const result: Map<string, Map<string, number>> = new Map();
  const k = "Self";
  const self = new Map<string, number>();
  result.set(k, self);
  for (const [key, value] of graph.entries()) {
    const next = new Map(value);
    self.set(key, 0);
    next.set(k, 0);
    result.set(key, next);
  }
  return result;
};

const solve = (graph: WeightedGraph<string>): number =>
  max(
    permutations(graph.keys().toArray()).map((arrangement) =>
      sum(pairs(arrangement).map(([a, b]) => graph.get(a)!.get(b)!)),
    ),
  );

const part1 = (graph: WeightedGraph<string>): number => solve(graph);

const part2 = (graph: WeightedGraph<string>): number => solve(addSelf(graph));

await main(import.meta, parse, part1, part2);
