import { main } from "../../utils/host";

class Tile {
    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    *moves(): IterableIterator<Tile> {
        const { x, y } = this;
        const next = y + 1;
        yield new Tile(x, next);
        yield new Tile(x - 1, next);
        yield new Tile(x + 1, next);
    }

    get id(): number {
        const { x, y } = this;
        return 0.5 * (x + y) * (x + y + 1) + y;
    }
}

class Segment {
    readonly source: Tile;
    readonly target: Tile;

    constructor(source: Tile, target: Tile) {
        this.source = source;
        this.target = target;
        if (!this.isHorizontal() && !this.isVertical()) {
            throw new Error("Invalid diagonal line");
        }
    }

    isHorizontal(): boolean {
        return this.source.y === this.target.y;
    }

    isVertical(): boolean {
        return this.source.x === this.target.x;
    }

    [Symbol.iterator](): IterableIterator<Tile> {
        return this.isVertical() ? this.vertical() : this.horizontal();
    }

    private *horizontal(): IterableIterator<Tile> {
        const sx = this.source.x;
        const tx = this.target.x;
        const min = Math.min(sx, tx);
        const max = Math.max(sx, tx);
        const y = this.source.y;
        for (let x = min; x <= max; x++) {
            yield new Tile(x, y);
        }
    }

    private *vertical(): IterableIterator<Tile> {
        const sy = this.source.y;
        const ty = this.target.y;
        const min = Math.min(sy, ty);
        const max = Math.max(sy, ty);
        const x = this.source.x;
        for (let y = min; y <= max; y++) {
            yield new Tile(x, y);
        }
    }
}

type Wall = ReadonlyArray<Segment>;
type WallList = ReadonlyArray<Wall>;

const parse = (input: string): WallList =>
    input
        .trim()
        .split("\n")
        .map((line) => {
            const vectors = line.split(" -> ").map((pair) => {
                const [x, y] = pair.split(",").map((item) => parseInt(item));
                return new Tile(x, y);
            });
            const segments: Segment[] = [];
            for (let i = 1; i < vectors.length; i++) {
                segments.push(new Segment(vectors[i - 1], vectors[i]));
            }
            return segments;
        });

const part1 = (walls: WallList): number => {
    const tiles = new Set<number>();
    let max = -Infinity;
    for (const wall of walls) {
        for (const segment of wall) {
            max = Math.max(max, segment.source.y, segment.target.y);
            for (const tile of segment) {
                tiles.add(tile.id);
            }
        }
    }
    let count = 0;
    const nextMove = (tile: Tile): Tile | null => {
        for (const move of tile.moves()) {
            if (!tiles.has(move.id)) {
                return move;
            }
        }
        return null;
    };
    while (true) {
        let sand = new Tile(500, 0);
        let next = nextMove(sand);
        while (next !== null) {
            sand = next;
            next = nextMove(sand);
            if (sand.y > max) {
                return count;
            }
        }
        count++;
        tiles.add(sand.id);
    }
};

const part2 = (walls: WallList): number => {
    const tiles = new Set<number>();
    let floor = -Infinity;
    for (const wall of walls) {
        for (const segment of wall) {
            floor = Math.max(floor, segment.source.y, segment.target.y);
            for (const tile of segment) {
                tiles.add(tile.id);
            }
        }
    }
    floor += 1;
    let count = 0;
    const nextMove = (tile: Tile): Tile | null => {
        for (const move of tile.moves()) {
            if (!tiles.has(move.id)) {
                return move;
            }
        }
        return null;
    };
    const origin = new Tile(500, 0).id;
    while (!tiles.has(origin)) {
        let sand = new Tile(500, 0);
        let next = nextMove(sand);
        while (next !== null && sand.y < floor) {
            sand = next;
            next = nextMove(sand);
        }
        count++;
        tiles.add(sand.id);
    }
    return count;
};

main(module, parse, part1, part2);
