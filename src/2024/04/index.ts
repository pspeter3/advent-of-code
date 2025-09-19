import {
    diagonalDirections,
    type GridDirection,
    gridDirections,
    GridVector2D,
    MatrixGrid,
} from "../../common/grid2d.ts";
import { len, sum } from "../../common/itertools.ts";
import { main } from "../../utils/host.ts";

const parse = (input: string): MatrixGrid<string> =>
    new MatrixGrid(
        input
            .trim()
            .split("\n")
            .map((line) => line.trim().split("")),
    );

const hasWord = (
    grid: MatrixGrid<string>,
    cell: GridVector2D,
    direction: GridDirection,
    word: string,
): boolean => {
    let curr = cell;
    for (let i = 0; i < word.length; i++) {
        if (!grid.bounds.includes(curr)) {
            return false;
        }
        if (grid.at(curr) !== word.at(i)) {
            return false;
        }
        curr = curr.neighbor(direction);
    }
    return true;
};

const part1 = (grid: MatrixGrid<string>): number =>
    sum(
        grid
            .keys()
            .map((cell) =>
                len(
                    gridDirections().filter((dir) =>
                        hasWord(grid, cell, dir, "XMAS"),
                    ),
                ),
            ),
    );

const part2 = (grid: MatrixGrid<string>): number =>
    len(
        grid
            .keys()
            .filter((cell) => grid.at(cell) === "A")
            .filter(
                (cell) =>
                    cell.q > 0 &&
                    cell.q < grid.bounds.max.q - 1 &&
                    cell.r > 0 &&
                    cell.r < grid.bounds.max.r - 1,
            )
            .filter((cell) => {
                const neighbors = diagonalDirections()
                    .map((dir) => grid.at(cell.neighbor(dir)))
                    .toArray();
                return (
                    neighbors.every((n) => n === "M" || n === "S") &&
                    neighbors[0] !== neighbors[2] &&
                    neighbors[1] !== neighbors[3]
                );
            }),
    );

await main(import.meta, parse, part1, part2);
