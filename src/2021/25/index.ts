import { z } from "zod";
import { main } from "../../utils/host";
import { LinesSchema, StringSchema } from "../../utils/schemas";

enum Cell {
    East = ">",
    South = "v",
    Empty = ".",
}

type Grid = ReadonlyArray<ReadonlyArray<Cell>>;

const schema = LinesSchema(
    z.preprocess(
        (line) => StringSchema.parse(line).trim().split(""),
        z.array(z.nativeEnum(Cell))
    )
);

const serialize = (grid: Grid): string =>
    grid.map((row) => row.join("")).join("\n");

const equals = (a: Grid, b: Grid): boolean => serialize(a) === serialize(b);

const prev = (index: number, max: number): number =>
    index === 0 ? max - 1 : index - 1;
const next = (index: number, max: number): number => (index + 1) % max;

const evolve = (grid: Grid): Grid => {
    const rows = grid.length;
    const cols = grid[0].length;
    const east = grid.map((row) =>
        row.map((cell, index) => {
            switch (cell) {
                case Cell.East: {
                    return row[next(index, cols)] === Cell.Empty
                        ? Cell.Empty
                        : cell;
                }
                case Cell.South: {
                    return cell;
                }
                case Cell.Empty: {
                    return row[prev(index, cols)] === Cell.East
                        ? Cell.East
                        : cell;
                }
            }
        })
    );
    return east.map((row, r) =>
        row.map((cell, c) => {
            switch (cell) {
                case Cell.East: {
                    return cell;
                }
                case Cell.South: {
                    return east[next(r, rows)][c] === Cell.Empty
                        ? Cell.Empty
                        : cell;
                }
                case Cell.Empty: {
                    return east[prev(r, rows)][c] === Cell.South
                        ? Cell.South
                        : cell;
                }
            }
        })
    );
};

const part1 = (grid: Grid): number => {
    let prev: Grid = [];
    let curr = grid;
    let count = 0;
    while (!equals(prev, curr)) {
        prev = curr;
        curr = evolve(curr);
        count++;
    }
    return count;
};

main(module, (input) => schema.parse(input), part1);
