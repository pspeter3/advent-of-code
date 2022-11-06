import { z } from "zod";
import { main } from "../../utils/host";
import { LinesSchema, StringSchema } from "../../utils/schemas";

type Pair = readonly [left: Node, right: Node];
type Node = Pair | number;

interface Element {
    readonly node: Node;
    readonly depth: number;
    readonly index: number;
}

enum Operation {
    Explode,
    Split,
}

interface ExplodeAction {
    readonly operation: Operation.Explode;
    readonly index: number;
    readonly increments: ReadonlyMap<number, number>;
}

interface SplitAction {
    readonly operation: Operation.Split;
    readonly index: number;
}

type Action = ExplodeAction | SplitAction;

const PairSchema: z.ZodSchema<Pair> = z.lazy(() =>
    z.tuple([
        z.union([PairSchema, z.number().int()]),
        z.union([PairSchema, z.number().int()]),
    ])
);

const schema = LinesSchema(
    z.preprocess((line) => JSON.parse(StringSchema.parse(line)), PairSchema)
);

const isNumber = (node: Node): node is number => typeof node === "number";
const toNumber = (node: Node): number => {
    if (!isNumber(node)) {
        throw new Error("Invalid node");
    }
    return node;
};

const traverse = (
    pair: Pair,
    callback: (node: Node, depth: number, index: number) => Node
): Pair => {
    let index = 0;
    const invoke = (node: Node, depth: number): Node =>
        callback(node, depth, index++);
    const walk = (node: Node, depth: number = 0): Node => {
        if (isNumber(node)) {
            return invoke(node, depth);
        }
        const [left, right] = node;
        const next = depth + 1;
        const l = walk(left, next);
        const r = walk(right, next);
        return invoke([l, r], depth);
    };
    const result = walk(pair);
    if (isNumber(result)) {
        throw new Error("Invalid result");
    }
    return result;
};

const sequential = (pair: Pair): ReadonlyArray<Element> => {
    const list: Element[] = [];
    traverse(pair, (node, depth, index) => {
        list.push({ node, depth, index });
        return node;
    });
    return list;
};

const MAX_DEPTH = 3;
const MAX_VALUE = 9;

const findExplode = (
    elements: ReadonlyArray<Element>
): ExplodeAction | null => {
    const indices: number[] = [];
    let result: readonly [pair: Pair, index: number, count: number] | null =
        null;
    for (const { node, depth, index } of elements) {
        if (isNumber(node)) {
            indices.push(index);
            continue;
        }
        if (depth > MAX_DEPTH && result === null) {
            result = [node, index, indices.length];
        }
    }
    if (result === null) {
        return result;
    }
    const [pair, index, count] = result;
    const [left, right] = pair;
    const l = count - 3;
    const r = count;
    const increments = new Map<number, number>();
    if (l >= 0) {
        increments.set(indices[l], toNumber(left));
    }
    if (r < indices.length) {
        increments.set(indices[r], toNumber(right));
    }
    return {
        operation: Operation.Explode,
        index,
        increments,
    };
};

const findSplit = (elements: ReadonlyArray<Element>): SplitAction | null => {
    for (const { node, index } of elements) {
        if (isNumber(node) && node > MAX_VALUE) {
            return { operation: Operation.Split, index };
        }
    }
    return null;
};

const findAction = (elements: ReadonlyArray<Element>): Action | null =>
    findExplode(elements) ?? findSplit(elements);

const explode = (pair: Pair, { index, increments }: ExplodeAction): Pair =>
    traverse(pair, (node, _, i) => {
        if (isNumber(node)) {
            return node + (increments.get(i) ?? 0);
        }
        if (index === i) {
            return 0;
        }
        return node;
    });

const split = (pair: Pair, { index }: SplitAction): Pair =>
    traverse(pair, (node, _, i) => {
        if (i === index) {
            if (!isNumber(node)) {
                throw new Error("Invalid split");
            }
            const value = node / 2;
            return [Math.floor(value), Math.ceil(value)];
        }
        return node;
    });

const evolve = (pair: Pair, action: Action): Pair => {
    switch (action.operation) {
        case Operation.Explode: {
            return explode(pair, action);
        }
        case Operation.Split: {
            return split(pair, action);
        }
    }
};

const reduce = (pair: Pair): Pair => {
    let result = pair;
    for (
        let action = findAction(sequential(result));
        action !== null;
        action = findAction(sequential(result))
    ) {
        result = evolve(result, action);
    }
    return result;
};

const add = (a: Pair, b: Pair): Pair => reduce([a, b]);

const magintude = (node: Node): number => {
    if (isNumber(node)) {
        return node;
    }
    const [left, right] = node;
    return 3 * magintude(left) + 2 * magintude(right);
};

const part1 = (pairs: ReadonlyArray<Pair>): number =>
    magintude(pairs.reduce((sum, pair) => add(sum, pair)));

const part2 = (pairs: ReadonlyArray<Pair>): number => {
    let max = -Infinity;
    for (const a of pairs) {
        for (const b of pairs) {
            max = Math.max(max, magintude(add(a, b)));
        }
    }
    return max;
};

main(module, (input) => schema.parse(input), part1, part2);
