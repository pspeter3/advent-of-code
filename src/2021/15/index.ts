import { z } from "zod";
import { main } from "../../utils/host";
import { IntSchema, LinesSchema, StringSchema } from "../../utils/schemas";

const schema = LinesSchema(
    z.preprocess(
        (line) => StringSchema.parse(line).trim().split(""),
        z.array(IntSchema)
    )
);

type Cell = readonly [row: number, col: number];
type Grid = ReadonlyArray<ReadonlyArray<number>>;

const toID = ([_, cols]: Cell, [row, col]: Cell): number => row * cols + col;
const fromID = ([_, cols]: Cell, id: number): Cell => [
    Math.floor(id / cols),
    id % cols,
];

const toBounds = (grid: Grid): Cell => [grid.length, grid[0].length];

const equals = (a: Cell, b: Cell): boolean => a[0] === b[0] && a[1] === b[1];

const add = ([ar, ac]: Cell, [br, bc]: Cell): Cell => [ar + br, ac + bc];

const max = (grid: Grid): Cell => add(toBounds(grid), [-1, -1]);

const neighbors = ([rows, cols]: Cell, [row, col]: Cell): ReadonlyArray<Cell> =>
    (
        [
            [Math.max(0, row - 1), col],
            [Math.min(rows - 1, row + 1), col],
            [row, Math.max(0, col - 1)],
            [row, Math.min(cols - 1, col + 1)],
        ] as Cell[]
    ).filter((cell) => !equals(cell, [row, col]));

const dequeue = (
    queue: Map<number, number>
): readonly [id: number, cost: number] => {
    let id: number | null = null;
    let cost = Infinity;
    for (const [k, v] of queue) {
        if (v < cost) {
            cost = v;
            id = k;
        }
    }
    if (id === null) {
        throw new Error("Invalid queue");
    }
    queue.delete(id);
    return [id, cost];
};

const seek = (grid: Grid, start: Cell, target: Cell): number => {
    const bounds = toBounds(grid);
    const dest = toID(bounds, target);
    const queue = new Map([[toID(bounds, start), 0]]);
    const visited = new Set<number>();
    while (queue.size > 0) {
        const [id, cost] = dequeue(queue);
        visited.add(id);
        if (id === dest) {
            return cost;
        }
        for (const n of neighbors(bounds, fromID(bounds, id))) {
            const i = toID(bounds, n);
            const [row, col] = n;
            const delta = grid[row][col];
            const sum = cost + delta;
            if (!visited.has(i) && sum < (queue.get(i) ?? Infinity)) {
                queue.set(i, sum);
            }
        }
    }
    throw new Error("Did not find target");
};

const risks: ReadonlyArray<number> = Array.from({ length: 9 }, (_, i) => i + 1);

const scale = (grid: Grid, factor: number): Grid => {
    const [rows, cols] = toBounds(grid);
    return Array.from({ length: rows * factor }, (_, row) =>
        Array.from({ length: cols * factor }, (_, col) => {
            const r = row % rows;
            const c = col % cols;
            const d = Math.floor(row / rows) + Math.floor(col / cols);
            return ((grid[r][c] + d - 1) % 9) + 1;
        })
    );
};

const Origin: Cell = [0, 0];

const part1 = (grid: Grid): number => seek(grid, Origin, max(grid));

const part2 = (grid: Grid): number => {
    const scaled = scale(grid, 5);
    return seek(scaled, Origin, max(scaled));
};

main(module, (input) => schema.parse(input), part1, part2);
