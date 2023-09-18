import { z } from "zod";
import { main } from "../../utils/host";
import { IntSchema, LinesSchema } from "../../utils/schemas";

type Grid = ReadonlyArray<ReadonlyArray<number>>;

const parse = (input: string): Grid =>
    LinesSchema(
        z
            .string()
            .transform((line) => line.split(""))
            .pipe(z.array(IntSchema)),
    ).parse(input);

function pair(a: number, b: number): bigint {
    const x = BigInt(a);
    const y = BigInt(b);
    return (x * x + x + 2n * x * y + 3n * y + y * y) / 2n;
}

const part1 = (grid: Grid): number => {
    const visibile = new Set<bigint>();
    for (let r = 0; r < grid.length; r++) {
        const row = grid[r];
        let min = -1;
        for (let q = 0; q < row.length; q++) {
            const tree = grid[r][q];
            if (tree > min) {
                min = tree;
                visibile.add(pair(q, r));
            }
        }
        min = -1;
        for (let q = row.length - 1; q >= 0; q--) {
            const tree = grid[r][q];
            if (tree > min) {
                min = tree;
                visibile.add(pair(q, r));
            }
        }
    }
    for (let q = 0; q < grid[0].length; q++) {
        let min = -1;
        for (let r = 0; r < grid.length; r++) {
            const tree = grid[r][q];
            if (tree > min) {
                min = tree;
                visibile.add(pair(q, r));
            }
        }
        min = -1;
        for (let r = grid.length - 1; r >= 0; r--) {
            const tree = grid[r][q];
            if (tree > min) {
                min = tree;
                visibile.add(pair(q, r));
            }
        }
    }
    return visibile.size;
};

function search(
    grid: Grid,
    col: number,
    row: number,
    cols: number,
    rows: number,
): number {
    let up = 0;
    let down = 0;
    let right = 0;
    let left = 0;
    const tree = grid[row][col];
    for (let r = row - 1; r >= 0; r--) {
        up++;
        if (grid[r][col] >= tree) {
            break;
        }
    }
    for (let r = row + 1; r < rows; r++) {
        down++;
        if (grid[r][col] >= tree) {
            break;
        }
    }
    for (let q = col - 1; q >= 0; q--) {
        left++;
        if (grid[row][q] >= tree) {
            break;
        }
    }
    for (let q = col + 1; q < cols; q++) {
        right++;
        if (grid[row][q] >= tree) {
            break;
        }
    }
    return up * down * left * right;
}

const part2 = (grid: Grid): number => {
    const cols = grid[0].length;
    const rows = grid.length;
    let result = 0;
    for (let r = 0; r < rows; r++) {
        for (let q = 0; q < cols; q++) {
            result = Math.max(result, search(grid, q, r, cols, rows));
        }
    }
    return result;
};

main(module, parse, part1, part2);
