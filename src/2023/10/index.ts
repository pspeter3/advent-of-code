import z from "zod";
import { main } from "../../utils/host.ts";
import { LinesSchema } from "../../utils/schemas.ts";

const PipeMarker = {
    Vertical: "|",
    Horizontal: "-",
    NorthEast: "L",
    NorthWest: "J",
    SouthWest: "7",
    SouthEast: "F",
} as const;
type PipeMarker = (typeof PipeMarker)[keyof typeof PipeMarker];
type GroundMarker = ".";
type StartMarker = "S";
type TileMarker = GroundMarker | StartMarker | PipeMarker;
type TileList = ReadonlyArray<TileMarker>;
type TileGrid = ReadonlyArray<TileList>;

const PipeMarkerSchema = z.enum(PipeMarker);
const TileMarkerSchema = z.union([
    z.literal("."),
    z.literal("S"),
    PipeMarkerSchema,
]);
const TileListSchema = z
    .string()
    .transform((line) => line.split(""))
    .pipe(z.array(TileMarkerSchema));
const TileGridSchema = LinesSchema(TileListSchema);

function isGroundMarker(tile: TileMarker): tile is GroundMarker {
    return tile === ".";
}

function isStartMarker(tile: TileMarker): tile is StartMarker {
    return tile === "S";
}

function isPipe(tile: TileMarker): tile is PipeMarker {
    return !isGroundMarker(tile) && !isStartMarker(tile);
}

class GridPosition {
    readonly q: number;
    readonly r: number;

    constructor(q: number, r: number) {
        this.q = q;
        this.r = r;
    }

    toId(grid: ReadonlyArray<ReadonlyArray<unknown>>): number {
        const cols = grid[0].length;
        return cols * this.r + this.q;
    }

    northWest(): GridPosition {
        return new GridPosition(this.q - 1, this.r - 1);
    }

    north(): GridPosition {
        return new GridPosition(this.q, this.r - 1);
    }

    east(): GridPosition {
        return new GridPosition(this.q + 1, this.r);
    }

    south(): GridPosition {
        return new GridPosition(this.q, this.r + 1);
    }

    west(): GridPosition {
        return new GridPosition(this.q - 1, this.r);
    }

    neighbors(): ReadonlyArray<GridPosition> {
        return [this.north(), this.east(), this.south(), this.west()];
    }

    equals(position: GridPosition): boolean {
        return this.q === position.q && this.r === position.r;
    }
}

function findStart(grid: TileGrid): GridPosition {
    for (const [r, row] of grid.entries()) {
        for (const [q, tile] of row.entries()) {
            if (isStartMarker(tile)) {
                return new GridPosition(q, r);
            }
        }
    }
    throw new Error("Could not find start");
}

function hasPosition(grid: TileGrid, { q, r }: GridPosition): boolean {
    const rows = grid.length;
    const cols = grid[0].length;
    return q >= 0 && q < cols && r >= 0 && r < rows;
}

function toMarker(grid: TileGrid, position: GridPosition): TileMarker {
    return grid[position.r][position.q];
}

type PipeConnection = readonly [GridPosition, GridPosition];

function isPipeConnection(
    positions: ReadonlyArray<GridPosition>,
): positions is PipeConnection {
    return positions.length === 2;
}

function toConnection(
    position: GridPosition,
    marker: PipeMarker,
): PipeConnection {
    switch (marker) {
        case PipeMarker.Vertical: {
            return [position.north(), position.south()];
        }
        case PipeMarker.Horizontal: {
            return [position.west(), position.east()];
        }
        case PipeMarker.NorthEast: {
            return [position.north(), position.east()];
        }
        case PipeMarker.NorthWest: {
            return [position.north(), position.west()];
        }
        case PipeMarker.SouthWest: {
            return [position.south(), position.west()];
        }
        case PipeMarker.SouthEast: {
            return [position.south(), position.east()];
        }
    }
}

function findStartConnections(
    grid: TileGrid,
    start: GridPosition,
): PipeConnection {
    const connection = start.neighbors().filter((position) => {
        if (!hasPosition(grid, position)) {
            return false;
        }
        const marker = toMarker(grid, position);
        if (!isPipe(marker)) {
            return false;
        }
        return toConnection(position, marker).some((position) =>
            position.equals(start),
        );
    });
    if (!isPipeConnection(connection)) {
        throw new Error("Invalid start");
    }
    return connection;
}

type LoopEntry = readonly [id: number, steps: number];
function* walkLoop(
    grid: TileGrid,
    start: GridPosition,
    next: GridPosition,
): Iterable<LoopEntry> {
    let count = 0;
    yield [start.toId(grid), count++];
    let prev = start;
    let curr = next;
    while (!curr.equals(start)) {
        const marker = toMarker(grid, curr);
        if (!isPipe(marker)) {
            throw new Error(`Invalid marker ${marker}`);
        }
        yield [curr.toId(grid), count++];
        const connections = toConnection(curr, marker);
        const step = connections.find((position) => !position.equals(prev));
        if (step === undefined) {
            throw new Error("Could not find next step");
        }
        prev = curr;
        curr = step;
    }
}

const COLINEAR: ReadonlySet<TileMarker> = new Set([
    PipeMarker.SouthWest,
    PipeMarker.NorthEast,
]);

function isInside(
    grid: TileGrid,
    border: ReadonlySet<number>,
    position: GridPosition,
): boolean {
    let count = 0;
    let current = position;
    while (hasPosition(grid, current)) {
        if (
            border.has(current.toId(grid)) &&
            !COLINEAR.has(toMarker(grid, current))
        ) {
            count++;
        }
        current = current.northWest();
    }
    return count % 2 === 1;
}

const parse = (input: string): TileGrid => TileGridSchema.parse(input);

const part1 = (grid: TileGrid): number => {
    const start = findStart(grid);
    const [a, b] = findStartConnections(grid, start).map(
        (next) =>
            new Map(walkLoop(grid, start, next) as ReadonlyMap<number, number>),
    );
    let max = -Infinity;
    for (const [id, count] of a) {
        const other = b.get(id);
        if (other === undefined) {
            throw new Error("Invalid loops");
        }
        max = Math.max(max, Math.min(count, other));
    }
    return max;
};

const part2 = (grid: TileGrid): number => {
    const start = findStart(grid);
    const [next] = findStartConnections(grid, start);
    const border: ReadonlySet<number> = new Set(
        new Map(walkLoop(grid, start, next)).keys(),
    );
    let count = 0;
    for (const [r, row] of grid.entries()) {
        for (const q of row.keys()) {
            const position = new GridPosition(q, r);
            const id = position.toId(grid);
            if (border.has(id)) {
                continue;
            }
            const valid = isInside(grid, border, position);
            if (valid) {
                count++;
            }
        }
    }
    return count;
};

await main(import.meta, parse, part1, part2);
