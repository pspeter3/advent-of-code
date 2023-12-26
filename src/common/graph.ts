import { first } from "./itertools";

export type WeightedEdgeMap<T> = ReadonlyMap<T, number>;
export type WeightedGraph<T> = ReadonlyMap<T, WeightedEdgeMap<T>>;

export interface WeightedGraphCutResult<T> {
    readonly weight: number;
    readonly nodes: ReadonlySet<T>;
}

export function minCut<T>(graph: WeightedGraph<T>): WeightedGraphCutResult<T> {
    let best: WeightedGraphCutResult<T> = {
        weight: Infinity,
        nodes: new Set(),
    };
    const partition = new Set<T>();
    let g = structuredClone(graph) as Map<T, Map<T, number>>;
    while (g.size > 1) {
        const cut = findCut(g);
        partition.add(cut.t);
        if (cut.w < best.weight) {
            best = {
                weight: cut.w,
                nodes: new Set(partition),
            };
        }
        mergeWeightedNodes(g, cut.s, cut.t);
    }
    return best;
}

function mergeWeightedNodes<T>(
    graph: Map<T, Map<T, number>>,
    keep: T,
    drop: T,
): void {
    const keepMap = graph.get(keep);
    if (keepMap === undefined) {
        throw new Error("Keep key not in graph");
    }
    const dropMap = graph.get(drop);
    if (dropMap === undefined) {
        throw new Error("Drop key not in graph");
    }
    for (const [key, weight] of dropMap) {
        const keyMap = graph.get(key);
        if (keyMap === undefined) {
            throw new Error("Malformed graph");
        }
        if (key !== keep) {
            const total = (keepMap.get(key) ?? 0) + weight;
            keyMap.set(keep, total);
            keepMap.set(key, total);
        }
        keyMap.delete(drop);
    }
    graph.delete(drop);
}

interface WeightedGraphCut<T> {
    readonly s: T;
    readonly t: T;
    readonly w: number;
}

function findCut<T>(graph: WeightedGraph<T>): WeightedGraphCut<T> {
    if (graph.size < 2) {
        throw new Error("Invalid graph");
    }
    const start = first(graph.keys()) as T;
    const found = [start];
    const nodes = new Set(graph.keys());
    let cut = -Infinity;
    nodes.delete(start);
    while (nodes.size > 0) {
        let max = -Infinity;
        let node: T | null = null;
        for (const n of nodes) {
            let weight = 0;
            for (const f of found) {
                weight += graph.get(f)?.get(n) ?? 0;
            }
            if (weight > max) {
                max = weight;
                node = n;
            }
        }
        if (node === null) {
            throw new Error("Invalid node search");
        }
        nodes.delete(node);
        found.push(node);
        cut = max;
    }
    return { s: found.at(-2)!, t: found.at(-1)!, w: cut };
}
