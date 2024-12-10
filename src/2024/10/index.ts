import z from "zod";
import { main } from "../../utils/host";
import { IntSchema, LinesSchema } from "../../utils/schemas";
import { GridVector2D, GridVector2DSet, MatrixGrid } from "../../common/grid2d";
import { len, sum } from "../../common/itertools";

const GridSchema = LinesSchema(
    z
        .string()
        .transform((line) => line.split(""))
        .pipe(z.array(IntSchema)),
).transform((grid) => new MatrixGrid(grid));

const isValidStep = (
    grid: MatrixGrid<number>,
    curr: GridVector2D,
    next: GridVector2D,
): boolean => grid.bounds.includes(next) && grid.at(next) - grid.at(curr) === 1;

const findPeaks = (
    grid: MatrixGrid<number>,
    trailhead: GridVector2D,
): number => {
    const frontier = new GridVector2DSet(grid.bounds);
    frontier.add(trailhead);
    for (const cell of frontier) {
        for (const neighbor of cell
            .neighbors()
            .map(([_, n]) => n)
            .filter((n) => isValidStep(grid, cell, n))) {
            frontier.add(neighbor);
        }
    }
    return len(frontier.keys().filter((cell) => grid.at(cell) === 9));
};

const findTrails = (grid: MatrixGrid<number>, cell: GridVector2D): number => {
    if (grid.at(cell) === 9) {
        return 1;
    }
    return sum(
        cell
            .neighbors()
            .map(([_, n]) => n)
            .filter((n) => isValidStep(grid, cell, n))
            .map((n) => findTrails(grid, n)),
    );
};

const parse = (input: string): MatrixGrid<number> => GridSchema.parse(input);

const part1 = (grid: MatrixGrid<number>): number =>
    sum(
        grid
            .keys()
            .filter((cell) => grid.at(cell) === 0)
            .map((cell) => findPeaks(grid, cell)),
    );

const part2 = (grid: MatrixGrid<number>): number => sum(
    grid
        .keys()
        .filter((cell) => grid.at(cell) === 0)
        .map((cell) => findTrails(grid, cell)),
);

main(module, parse, part1, part2);
