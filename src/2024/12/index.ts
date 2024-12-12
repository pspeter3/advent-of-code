import { GridBounds2D, GridVector2D, GridVector2DSet, MatrixGrid } from "../../common/grid2d";
import { enumerate, len, sum } from "../../common/itertools";
import { main } from "../../utils/host";

interface Region {
    readonly id: string;
    readonly area: number;
    readonly perimeter: number;
    readonly corners: number;
}

type RegionList = ReadonlyArray<Region>;

function* toCorners(cell: GridVector2D): Generator<GridVector2D> {
    yield cell;
    yield cell.add({q: 1, r: 0});
    yield cell.add({q: 1, r: 1});
    yield cell.add({q: 0, r: 1});
}

function* toTouches(cell: GridVector2D): Generator<GridVector2D> {
    yield cell.add({q: -1, r: -1});
    yield cell.add({q: 0, r: -1});
    yield cell;
    yield cell.add({q: -1, r: 0});
}

const isCorner = (tiles: ReadonlyArray<GridVector2D>): boolean => {
    if (tiles.length % 2 === 1) {
        return true;
    }
    if (tiles.length === 2) {
        const [a, b] = tiles;
        return a.neighbors().every(([_, n]) => !n.equals(b));
    }
    return false;
};

const parse = (input: string): RegionList => {
    const grid = new MatrixGrid(
        input
            .trim()
            .split("\n")
            .map((line) => line.trim().split("")),
    );
    const dual = new GridBounds2D(grid.bounds.min, grid.bounds.max.add({q: 1, r: 1}));
    const seen = new GridVector2DSet(grid.bounds);
    const regions: Region[] = [];
    for (const key of grid.keys().filter((cell) => !seen.has(cell))) {
        const id = grid.at(key);
        const frontier = new GridVector2DSet(grid.bounds);
        frontier.add(key);
        let perimeter = 0;
        const corners = new GridVector2DSet(dual);
        const doubles = new GridVector2DSet(dual);
        for (const cell of frontier) {
            seen.add(cell);
            for (const [_, n] of cell.neighbors()) {
                if (grid.bounds.includes(n) && grid.at(n) === id) {
                    frontier.add(n);
                } else {
                    perimeter++;
                }
            }
        }
        for (const cell of frontier) {
            for (const corner of toCorners(cell)) {
                const tiles = toTouches(corner).filter((t) => grid.bounds.includes(t) && frontier.has(t)).toArray();
                if (tiles.length % 2 === 1) {
                    corners.add(corner);
                    continue;
                }
                if (tiles.length === 2) {
                    const [a, b] = tiles;
                    const diagonal = a.neighbors().every(([_, n]) => !n.equals(b));
                    if (diagonal) {
                        corners.add(corner);
                        doubles.add(corner);
                    }
                }
            }
        }
        regions.push({
            id,
            area: frontier.size,
            perimeter,
            corners: corners.size + doubles.size,
        });
    }
    return regions;
}

const part1 = (regions: RegionList): number => sum(regions.values().map((r) => r.area * r.perimeter));

const part2 = (regions: RegionList): number => sum(regions.values().map((r) => r.area * r.corners));

main(module, parse, part1, part2);
