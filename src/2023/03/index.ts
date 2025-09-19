import { main } from "../../utils/host.ts";

const DIGITS: ReadonlySet<string> = new Set([
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
]);
type DigitChar = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type PeriodChar = ".";
type Char = DigitChar | PeriodChar | string;
type CharRow = ReadonlyArray<Char>;
type CharGrid = ReadonlyArray<CharRow>;

interface DigitCharSlice {
    readonly row: number;
    readonly start: number;
    readonly end: number;
}

interface GridCell {
    readonly row: number;
    readonly col: number;
}

function isDigitChar(char: string): char is DigitChar {
    return DIGITS.has(char);
}

function isPeriodChar(char: string): char is PeriodChar {
    return char === ".";
}

function isSymbolChar(char: string): boolean {
    return !isDigitChar(char) && !isPeriodChar(char);
}

function createSlices(grid: CharGrid): ReadonlyArray<DigitCharSlice> {
    const slices: DigitCharSlice[] = [];
    for (const [row, chars] of grid.entries()) {
        let start: number | null = null;
        for (const [col, char] of chars.entries()) {
            if (isDigitChar(char)) {
                if (start === null) {
                    start = col;
                }
            } else {
                if (start !== null) {
                    slices.push({ row, start, end: col });
                    start = null;
                }
            }
        }
        if (start !== null) {
            slices.push({ row, start, end: chars.length });
        }
    }
    return slices;
}

function toValue(grid: CharGrid, { row, start, end }: DigitCharSlice): number {
    return parseInt(grid[row].slice(start, end).join(""), 10);
}

function* neighbors(
    grid: CharGrid,
    { row, start, end }: DigitCharSlice,
): Iterable<Char> {
    const rows = grid.length;
    const cols = grid[0].length;
    let min = Math.max(0, start - 1);
    let max = Math.min(cols - 1, end);
    if (min !== start) {
        yield grid[row][min];
    }
    if (max === end) {
        yield grid[row][max];
    }
    if (row - 1 >= 0) {
        for (let col = min; col <= max; col++) {
            yield grid[row - 1][col];
        }
    }
    if (row + 1 < rows) {
        for (let col = min; col <= max; col++) {
            yield grid[row + 1][col];
        }
    }
}

function hasOverlap(cell: GridCell, slice: DigitCharSlice): boolean {
    const delta = Math.abs(cell.row - slice.row);
    switch (delta) {
        case 0: {
            return cell.col === slice.start - 1 || cell.col === slice.end;
        }
        case 1: {
            return cell.col >= slice.start - 1 && cell.col <= slice.end;
        }
        default: {
            return false;
        }
    }
}

const parse = (input: string): CharGrid =>
    input
        .trim()
        .split("\n")
        .map((line) => line.split(""));

const part1 = (grid: CharGrid): number => {
    const slices = createSlices(grid);
    return slices.reduce((sum, slice) => {
        for (const char of neighbors(grid, slice)) {
            if (isSymbolChar(char)) {
                return sum + toValue(grid, slice);
            }
        }
        return sum;
    }, 0);
};

const part2 = (grid: CharGrid): number => {
    const slices = createSlices(grid);
    let result = 0;
    for (const [row, chars] of grid.entries()) {
        for (const [col, char] of chars.entries()) {
            if (char !== "*") {
                continue;
            }
            const cell = { row, col };
            const overlaps = slices.filter((slice) => hasOverlap(cell, slice));
            if (overlaps.length === 2) {
                result += overlaps.reduce(
                    (product, slice) => product * toValue(grid, slice),
                    1,
                );
            }
        }
    }
    return result;
};

main(module, parse, part1, part2);
