import { memoize } from "../../common/functools.ts";
import type { Graph } from "../../common/graph.ts";
import { sum } from "../../common/itertools.ts";
import { main } from "../../utils/host.ts";

const parse = (input: string): Graph<string> =>
  new Map(
    input
      .trim()
      .split("\n")
      .values()
      .map((line) => {
        const [key, list] = line.split(": ");
        const value = new Set(list.split(" "));
        return [key, value];
      }),
  );

const part1 = (graph: Graph<string>): number => {
  const search = (key: string): number =>
    key === "out" ? 1 : sum(graph.get(key)!.values().map(search));
  return search("you");
};

const part2 = (graph: Graph<string>): number => {
  const search = memoize((key: string, dac: boolean, fft: boolean): number => {
    if (key == "out") {
      return dac && fft ? 1 : 0;
    }
    if (key === "dac") {
      dac = true;
    }
    if (key === "fft") {
      fft = true;
    }
    return sum(
      graph
        .get(key)!
        .values()
        .map((k) => search(k, dac, fft)),
    );
  });
  return search("svr", false, false);
};

await main(import.meta, parse, part1, part2);
