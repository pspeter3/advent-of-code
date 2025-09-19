import { main } from "../../utils/host.ts";

class Grid {
    private static findTile(
        tiles: ReadonlyArray<GridTile>,
        char: string,
    ): GridTile {
        const tile = tiles.find((tile) => tile.char === char);
        if (!tile) {
            throw new Error(`Cannot find tile ${char}`);
        }
        return tile;
    }

    static canMove(source: string, target: string): boolean {
        const a = source === "S" ? "a" : source;
        const b = target === "E" ? "z" : target;
        return b.charCodeAt(0) - a.charCodeAt(0) <= 1;
    }

    readonly cols: number;
    readonly rows: number;
    readonly tiles: ReadonlyArray<GridTile>;
    readonly start: GridTile;
    readonly end: GridTile;

    constructor(data: ReadonlyArray<ReadonlyArray<string>>) {
        this.cols = data[0].length;
        this.rows = data.length;
        this.tiles = data
            .map((chars, r) =>
                chars.map((char, q) => new GridTile(this, char, q, r)),
            )
            .flat();
        this.start = Grid.findTile(this.tiles, "S");
        this.end = Grid.findTile(this.tiles, "E");
    }

    at(q: number, r: number): GridTile | null {
        if (q < 0 || q >= this.cols || r < 0 || r >= this.rows) {
            return null;
        }
        return this.tiles[r * this.cols + q];
    }
}

class GridTile {
    private static deltas = [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
    ] as const;

    private readonly grid: Grid;
    readonly char: string;
    readonly q: number;
    readonly r: number;

    constructor(grid: Grid, char: string, q: number, r: number) {
        this.grid = grid;
        this.char = char;
        this.q = q;
        this.r = r;
    }

    *neighbors(): Generator<GridTile, void, unknown> {
        const { q, r } = this;
        for (const [dq, dr] of GridTile.deltas) {
            const neighbor = this.grid.at(q + dq, r + dr);
            if (neighbor !== null) {
                yield neighbor;
            }
        }
    }
}

const parse = (input: string): Grid =>
    new Grid(
        input
            .trim()
            .split("\n")
            .map((line) => line.split("")),
    );

const seek = (grid: Grid, source: GridTile): number | null => {
    const frontier = [source];
    const costs = new Map<GridTile, number>([[source, 0]]);
    while (frontier.length > 0) {
        frontier.sort((a, b) => costs.get(b)! - costs.get(a)!);
        const current = frontier.pop()!;
        const cost = costs.get(current)! + 1;
        for (const neighbor of current.neighbors()) {
            if (Grid.canMove(current.char, neighbor.char)) {
                if (!costs.has(neighbor)) {
                    frontier.push(neighbor);
                    costs.set(neighbor, Infinity);
                }
                const value = costs.get(neighbor)!;
                if (cost < value) {
                    costs.set(neighbor, cost);
                }
            }
        }
    }
    return costs.get(grid.end) ?? null;
};

const part1 = (grid: Grid): number => seek(grid, grid.start)!;

const part2 = (grid: Grid): number => {
    let result = Infinity;
    for (const tile of grid.tiles) {
        if (tile.char === "S" || tile.char === "a") {
            const value = seek(grid, tile);
            if (value === null) {
                continue;
            }
            result = Math.min(result, value);
        }
    }
    return result;
};

main(module, parse, part1, part2);
