import { z } from "zod";
import { main } from "../../utils/host";
import { IntSchema, LinesSchema, StringSchema } from "../../utils/schemas";

const schema = LinesSchema(
    z.preprocess(
        (line) => StringSchema.parse(line).trim().split(""),
        z.array(IntSchema),
    ),
);

type Grid = ReadonlyArray<ReadonlyArray<number>>;

type Cell = readonly [row: number, col: number];

const FLASH = 10;

const neighbors = (
    [rows, cols]: Cell,
    [row, col]: Cell,
): ReadonlyArray<Cell> => {
    const nearby: Cell[] = [];
    for (let r = Math.max(0, row - 1); r < Math.min(row + 2, rows); r++) {
        for (let c = Math.max(0, col - 1); c < Math.min(col + 2, cols); c++) {
            if (r === row && c === col) {
                continue;
            }
            nearby.push([r, c]);
        }
    }
    return nearby;
};

const evolve = (grid: Grid): readonly [next: Grid, flashes: number] => {
    const queue: Cell[] = [];
    const next: number[][] = grid.map((line, row) =>
        line.map((energy, col) => {
            const result = energy + 1;
            if (result === FLASH) {
                queue.push([row, col]);
            }
            return result;
        }),
    );
    const bounds: Cell = [grid.length, grid[0].length];
    let index = 0;
    let flashes = 0;
    while (index < queue.length) {
        const curr = queue[index];
        flashes++;
        index++;
        for (const neighbor of neighbors(bounds, curr)) {
            const [row, col] = neighbor;
            next[row][col]++;
            if (next[row][col] === FLASH) {
                queue.push(neighbor);
            }
        }
    }
    for (const [row, col] of queue) {
        next[row][col] = 0;
    }
    return [next, flashes];
};

const part1 = (grid: Grid): number => {
    let current = grid;
    let total = 0;
    for (let i = 0; i < 100; i++) {
        const [next, flashes] = evolve(current);
        current = next;
        total += flashes;
    }
    return total;
};

const isFlash = (grid: Grid): boolean =>
    grid.every((row) => row.every((cell) => cell === 0));

const part2 = (grid: Grid): number => {
    let current = grid;
    let step = 0;
    while (!isFlash(current)) {
        const [next, _] = evolve(current);
        current = next;
        step++;
    }
    return step;
};

main(module, (input) => schema.parse(input), part1, part2);
