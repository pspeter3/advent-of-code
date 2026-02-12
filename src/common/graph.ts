export type Graph<T> = ReadonlyMap<T, ReadonlySet<T>>;
export type WeightedEdgeMap<T> = ReadonlyMap<T, number>;
export type WeightedGraph<T> = ReadonlyMap<T, WeightedEdgeMap<T>>;
export type WeightedEdgeMatrix = ReadonlyArray<ReadonlyArray<number>>;

export interface WeightedMatrixGraph<T> {
  readonly nodes: ReadonlySet<T>;
  readonly matrix: WeightedEdgeMatrix;
}

export function toWeightedMatrixGraph<T>(graph: WeightedGraph<T>): WeightedMatrixGraph<T> {
  const nodes = new Set(graph.keys());
  const matrix = Array.from(nodes, (source) =>
    Array.from(nodes, (target) => graph.get(source)?.get(target) ?? 0),
  );
  return { nodes, matrix };
}

export interface WeightedGraphCutResult<T> {
  readonly cuts: number;
  readonly nodes: ReadonlySet<T>;
}

export function minCut<T>(graph: WeightedMatrixGraph<T>): WeightedGraphCutResult<T> {
  let best: WeightedGraphCutResult<T> = { cuts: Infinity, nodes: new Set() };
  const nodes = Array.from(graph.nodes);
  const size = graph.nodes.size;
  const partitions = Array.from({ length: size }, (_, i) => new Set([i]));
  const matrix = structuredClone(graph.matrix) as number[][];
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
      best = {
        cuts,
        nodes: new Set(partitions[t].values().map((index) => nodes[index])),
      };
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

export type GraphEdge<T> = readonly [source: T, target: T];

export function createUndirectedGraph<T>(edges: ReadonlyArray<GraphEdge<T>>): Graph<T> {
  const graph = new Map<T, Set<T>>();
  for (const [source, target] of edges) {
    addEdge(graph, source, target);
    addEdge(graph, target, source);
  }
  return graph;
}

export function createDirectedGraph<T>(edges: ReadonlyArray<GraphEdge<T>>): Graph<T> {
  const graph = new Map<T, Set<T>>();
  for (const [source, target] of edges) {
    addEdge(graph, source, target);
  }
  return graph;
}

function addEdge<T>(graph: Map<T, Set<T>>, source: T, target: T) {
  if (!graph.has(source)) {
    graph.set(source, new Set());
  }
  graph.get(source)!.add(target);
}

export function bronKerbosch<T>(
  R: Set<T>,
  P: Set<T>,
  X: Set<T>,
  graph: Graph<T>,
  cliques: Array<ReadonlySet<T>>,
): void {
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
}

export function findCliques(graph: Graph<string>): ReadonlyArray<ReadonlySet<string>> {
  const cliques: Array<ReadonlySet<string>> = [];
  bronKerbosch(new Set(), new Set(graph.keys()), new Set(), graph, cliques);
  return cliques;
}
