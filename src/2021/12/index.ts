import { z } from "zod";
import { main } from "../../utils/host.ts";
import { LinesSchema, StringSchema } from "../../utils/schemas.ts";

const schema = LinesSchema(
  z.preprocess(
    (line) => StringSchema.parse(line).trim().split("-"),
    z.tuple([StringSchema, StringSchema]),
  ),
);

type Node = string;
type Edge = readonly [src: Node, dest: Node];
type Graph = Map<Node, Set<Node>>;

const START = "start";
const END = "end";

const isLarge = (cave: Node) => cave.toUpperCase() === cave;
const isSmall = (cave: Node) => !isLarge(cave);

const add = (graph: Graph, src: Node, dest: Node): void => {
  if (!graph.has(src)) {
    graph.set(src, new Set());
  }
  graph.get(src)!.add(dest);
};

const toGraph = (edges: ReadonlyArray<Edge>): Graph => {
  const graph: Graph = new Map();
  for (const [src, dest] of edges) {
    add(graph, src, dest);
    add(graph, dest, src);
  }
  return graph;
};

const navigate = (
  graph: Graph,
  node: Node,
  visited: ReadonlyMap<Node, number>,
  filter: (node: Node, visited: ReadonlyMap<Node, number>) => boolean,
): number => {
  if (node === END) {
    return 1;
  }
  let count = 0;
  const stack = new Map(visited);
  stack.set(node, (stack.get(node) ?? 0) + 1);
  for (const next of graph.get(node)!) {
    if (filter(next, stack)) {
      continue;
    }
    count += navigate(graph, next, stack, filter);
  }
  return count;
};

const part1 = (edges: ReadonlyArray<Edge>): number =>
  navigate(toGraph(edges), START, new Map(), (node, visited) => isSmall(node) && visited.has(node));

const part2 = (edges: ReadonlyArray<Edge>): number =>
  navigate(toGraph(edges), START, new Map(), (node, visited) => {
    // Include large caves
    if (isLarge(node)) {
      return false;
    }
    // Filter out the start cave
    if (node === START) {
      return true;
    }
    // Include new small caves
    if (!visited.has(node)) {
      return false;
    }
    for (const [n, count] of visited) {
      if (isSmall(n) && count === 2) {
        return true;
      }
    }
    return false;
  });

await main(import.meta, (input) => schema.parse(input), part1, part2);
