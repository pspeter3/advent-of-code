import { sum } from "../../common/itertools.ts";
import { main } from "../../utils/host.ts";

export interface TachyonManifold {
    readonly cols: number;
    readonly start: number;
    readonly splitters: ReadonlyArray<ReadonlySet<number>>;
}

const parse = (input: string): TachyonManifold => {
    const lines = input.trim().split("\n");
    const cols = lines[0].length;
    let start: number | null = null;
    for (const [index, char] of lines[0].split("").entries()) {
        switch (char) {
            case "S": {
                if (start !== null) {
                    throw new Error("Multiple starts");
                }
                start = index;
                break;
            }
            case ".": {
                break;
            }
            case "^": {
                throw new Error(`Splitter on first row`);
            }
            default: {
                throw new Error("Invalid character");
            }
        }
    }
    if (start === null) {
        throw new Error("No start found");
    }
    const splitters: ReadonlySet<number>[] = [];
    for (const line of lines.slice(1)) {
        const row = new Set<number>();
        for (const [index, char] of line.split("").entries()) {
            switch (char) {
                case "^": {
                    row.add(index);
                    break;
                }
                case ".": {
                    break;
                }
                case "S": {
                    throw new Error("Invalid start");
                }
                default: {
                    throw new Error("Invalid character");
                }
            }
        }
        splitters.push(row);
    }
    return { cols, start, splitters };
};

const part1 = ({ cols, start, splitters }: TachyonManifold): number => {
    let curr: ReadonlySet<number> = new Set<number>([start]);
    let splits = 0;
    for (const row of splitters) {
        const next = new Set<number>();
        for (const q of curr) {
            if (row.has(q)) {
                splits++;
                if (q > 0) {
                    next.add(q - 1);
                }
                if (q < cols - 1) {
                    next.add(q + 1);
                }
            } else {
                next.add(q);
            }
        }
        curr = next;
    }
    return splits;
};

const part2 = ({ cols, start, splitters }: TachyonManifold): number => {
    let curr: ReadonlyMap<number, number> = new Map<number, number>([
        [start, 1],
    ]);
    for (const row of splitters) {
        const next = new Map<number, number>();
        for (const [q, count] of curr) {
            const indices = new Set<number>();
            if (row.has(q)) {
                if (q > 0) {
                    indices.add(q - 1);
                }
                if (q < cols - 1) {
                    indices.add(q + 1);
                }
            } else {
                indices.add(q);
            }
            for (const i of indices) {
                next.set(i, (next.get(i) ?? 0) + count);
            }
        }
        curr = next;
    }
    return sum(curr.values());
};

await main(import.meta, parse, part1, part2);
