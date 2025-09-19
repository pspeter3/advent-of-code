import { main } from "../../utils/host.ts";

interface MoveOperation {
    readonly amount: number;
    readonly source: number;
    readonly target: number;
}

interface Input {
    readonly stacks: ReadonlyMap<number, ReadonlyArray<string>>;
    readonly moves: ReadonlyArray<MoveOperation>;
}

const toInt = (value: string): number => parseInt(value, 10);

const parseStacks = (
    section: string,
): ReadonlyMap<number, ReadonlyArray<string>> => {
    const stacks = new Map<number, string[]>();
    const lines = section.split("\n");
    const keys = lines[lines.length - 1]
        .trim()
        .split(/\s+/)
        .map((key) => toInt(key));
    const inventory = lines.slice(0, lines.length - 1).reverse();
    for (const [index, key] of keys.entries()) {
        const crates: string[] = [];
        const offset = index + 1 + 3 * index;
        for (const line of inventory) {
            const crate = line.at(offset);
            if (crate !== undefined && crate !== " ") {
                crates.push(crate);
            }
        }
        stacks.set(key, crates);
    }
    return stacks;
};

const parseMoves = (section: string): ReadonlyArray<MoveOperation> =>
    section.split("\n").map((line: string): MoveOperation => {
        const match = line.match(/^move (\d+) from (\d+) to (\d+)$/);
        if (match === null) {
            throw new Error(`Invalid move "${line}"`);
        }
        const source = toInt(match[2]);
        const amount = toInt(match[1]);
        const target = toInt(match[3]);
        return { amount, source, target };
    });

const parse = (input: string): Input => {
    const sections = input.trimEnd().split("\n\n");
    const stacks = parseStacks(sections[0]);
    const moves = parseMoves(sections[1]);
    return { stacks, moves };
};

const clone = (
    stacks: ReadonlyMap<number, ReadonlyArray<string>>,
): Map<number, string[]> => {
    const inventory = new Map<number, string[]>();
    for (const [key, crates] of stacks) {
        inventory.set(key, Array.from(crates));
    }
    return inventory;
};

const serialize = (
    inventory: ReadonlyMap<number, ReadonlyArray<string>>,
): string =>
    Array.from(inventory.values())
        .map((crates) => crates[crates.length - 1])
        .join("");

const part1 = ({ stacks, moves }: Input): string => {
    const inventory = clone(stacks);
    for (const { amount, source, target } of moves) {
        const s = inventory.get(source)!;
        const t = inventory.get(target)!;
        for (let i = 0; i < amount; i++) {
            const crate = s.pop();
            if (crate === undefined) {
                throw new Error("Invalid move");
            }
            t.push(crate);
        }
    }
    return serialize(inventory);
};

const part2 = ({ stacks, moves }: Input): string => {
    const inventory = clone(stacks);
    for (const { amount, source, target } of moves) {
        const s = inventory.get(source)!;
        inventory.get(target)?.push(...s.slice(s.length - amount));
        inventory.set(source, s.slice(0, s.length - amount));
    }
    return serialize(inventory);
};

main(module, parse, part1, part2);
