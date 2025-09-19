import { z } from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema, StringSchema } from "../../utils/schemas.ts";

const schema = LinesSchema(
    z.preprocess(
        (line) => StringSchema.parse(line).trim().split(""),
        z.array(IntSchema),
    ),
);

type Position = readonly [row: number, col: number];

const neighbors = (
    [rows, cols]: Position,
    [row, col]: Position,
): ReadonlyArray<Position> => {
    const positions: Position[] = [];
    if (row > 0) {
        positions.push([row - 1, col]);
    }
    if (row < rows - 1) {
        positions.push([row + 1, col]);
    }
    if (col > 0) {
        positions.push([row, col - 1]);
    }
    if (col < cols - 1) {
        positions.push([row, col + 1]);
    }
    return positions;
};

const toID = ([_, cols]: Position, [row, col]: Position): number =>
    cols * row + col;

const size = (
    uphill: ReadonlyMap<number, ReadonlySet<number>>,
    basin: number,
): number => {
    if (!uphill.has(basin)) {
        throw new Error("Could not find basin");
    }
    const queue: number[] = [basin];
    const positions = new Set(queue);
    while (queue.length > 0) {
        const curr = queue.shift()!;
        const sources = uphill.get(curr);
        if (sources) {
            for (const source of sources) {
                if (!positions.has(source)) {
                    positions.add(source);
                    queue.push(source);
                }
            }
        }
    }
    return positions.size;
};

const part1 = (data: ReadonlyArray<ReadonlyArray<number>>): number => {
    let risks: number[] = [];
    const bounds: Position = [data.length, data[0].length];
    for (const [row, cells] of data.entries()) {
        for (const [col, cell] of cells.entries()) {
            let valid = true;
            for (const [r, c] of neighbors(bounds, [row, col])) {
                valid = valid && cell < data[r][c];
            }
            if (valid) {
                risks.push(cell + 1);
            }
        }
    }
    return risks.reduce((sum, risk) => sum + risk);
};

const part2 = (data: ReadonlyArray<ReadonlyArray<number>>): number => {
    const bounds: Position = [data.length, data[0].length];
    const basins: number[] = [];
    const flow: Map<number, number> = new Map();
    for (const [row, cells] of data.entries()) {
        for (const [col, cell] of cells.entries()) {
            if (cell === 9) {
                continue;
            }
            const id = toID(bounds, [row, col]);
            let sink: number | null = null;
            let min = cell;
            for (const [r, c] of neighbors(bounds, [row, col])) {
                const value = data[r][c];
                if (value < min) {
                    sink = toID(bounds, [r, c]);
                    min = value;
                }
            }
            if (sink === null) {
                basins.push(id);
            } else {
                flow.set(id, sink);
            }
        }
    }
    const uphill: Map<number, Set<number>> = new Map();
    for (const [from, to] of flow.entries()) {
        if (!uphill.has(to)) {
            uphill.set(to, new Set());
        }
        uphill.get(to)!.add(from);
    }
    const results = basins
        .map((basin) => size(uphill, basin))
        .sort((a, b) => b - a);
    return results.slice(0, 3).reduce((product, value) => product * value);
};

await main(import.meta, (input) => schema.parse(input), part1, part2);
