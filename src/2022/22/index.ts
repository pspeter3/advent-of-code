import { z } from "zod";
import { main } from "../../utils/host";
import { IntSchema } from "../../utils/schemas";

enum Facing {
    Right = 0,
    Down = 1,
    Left = 2,
    Up = 3,
}

enum TileKind {
    Open = ".",
    Wall = "#",
}
const TileKindSchema = z.nativeEnum(TileKind);

enum Turn {
    Left = "L",
    Right = "R",
}

type Instruction = number | Turn;
type InstructionList = ReadonlyArray<Instruction>;

class Bounds {
    readonly min: number;
    readonly max: number;

    constructor(a: number, b: number) {
        this.min = Math.min(a, b);
        this.max = Math.max(a, b);
    }

    contains(value: number): boolean {
        return value >= this.min && value <= this.max;
    }

    step(value: number, amount: -1 | 1) {
        if (!this.contains(value)) {
            throw new Error(
                `Invalid value ${value} for bounds (${this.min}, ${this.max})`
            );
        }
        const next = value + amount;
        if (this.contains(next)) {
            return next;
        }
        return amount === -1 ? this.max : this.min;
    }

    *[Symbol.iterator](): IterableIterator<number> {
        for (let i = this.min; i <= this.max; i++) {
            yield i;
        }
    }
}

interface Cursor {
    turn(turn: Turn): void;
    move(count: number): void;
    score(): number;
}

class Tile {
    readonly q: number;
    readonly r: number;

    constructor(q: number, r: number) {
        this.q = q;
        this.r = r;
    }

    neighbor(facing: Facing): Tile {
        const { q, r } = this;
        switch (facing) {
            case Facing.Right: {
                return new Tile(q + 1, r);
            }
            case Facing.Down: {
                return new Tile(q, r + 1);
            }
            case Facing.Left: {
                return new Tile(q - 1, r);
            }
            case Facing.Up: {
                return new Tile(q, r - 1);
            }
        }
    }

    equals({ q, r }: Tile): boolean {
        return this.q === q && this.r === r;
    }

    rotate(scale: number): Tile {
        const { q, r } = this;
        return new Tile(scale - r - 1, q);
    }
}

const score = ({ q, r }: Tile, facing: Facing): number =>
    1000 * (r + 1) + 4 * (q + 1) + facing;

const toAmount = (turn: Turn): number => (turn === Turn.Left ? 3 : 1);

const rotate = (facing: Facing, amount: number): Facing =>
    (facing + amount) % 4;

const toId = (size: Tile, { q, r }: Tile): number => {
    if (q < 0 || q >= size.q || r < 0 || r >= size.r) {
        throw new Error("Tile is out of bounds");
    }
    return r * size.q + q;
};

class Grid implements Cursor {
    readonly #size: Tile;
    readonly #cols: ReadonlyArray<Bounds>;
    readonly #rows: ReadonlyArray<Bounds>;
    readonly #data: ReadonlyMap<number, TileKind>;
    #tile: Tile;
    #facing: Facing;

    constructor(section: string) {
        const lines = section.split("\n");
        const size = new Tile(
            lines.reduce(
                (current, line) => Math.max(current, line.length),
                -Infinity
            ),
            lines.length
        );
        const cols: Bounds[] = [];
        const rowMin: number[] = Array.from({ length: size.q }, () => Infinity);
        const rowMax: number[] = Array.from(
            { length: size.q },
            () => -Infinity
        );
        const entries: Array<readonly [id: number, kind: TileKind]> = [];
        for (const [r, line] of lines.entries()) {
            const match = line.match(/^(\s*)([\.#]+)$/);
            if (match === null) {
                throw new Error(`Invalid line (${line})`);
            }
            const offset = match[1].length;
            for (const [i, char] of Array.from(match[2]).entries()) {
                const q = offset + i;
                const kind = TileKindSchema.parse(char);
                const tile = new Tile(q, r);
                entries.push([toId(size, tile), kind]);
                rowMin[q] = Math.min(rowMin[q], r);
                rowMax[q] = Math.max(rowMax[q], r);
            }
            cols.push(new Bounds(offset, line.length - 1));
        }
        this.#size = size;
        this.#cols = cols;
        this.#rows = rowMin.map((min, index) => new Bounds(min, rowMax[index]));
        this.#data = new Map(entries);
        this.#tile = this.#start();
        this.#facing = Facing.Right;
    }

    turn(turn: Turn): void {
        this.#facing = rotate(this.#facing, toAmount(turn));
    }

    move(count: number): void {
        for (let i = 0; i < count; i++) {
            const next = this.#step(this.#tile, this.#facing);
            if (this.#kind(next) === TileKind.Wall) {
                break;
            }
            this.#tile = next;
        }
    }

    score(): number {
        return score(this.#tile, this.#facing);
    }

    #kind(tile: Tile): TileKind {
        const kind = this.#data.get(toId(this.#size, tile));
        if (kind === undefined) {
            throw new Error(`Invalid tile ${JSON.stringify(tile)}`);
        }
        return kind;
    }

    #start(): Tile {
        const r = 0;
        for (const q of this.#cols[r]) {
            const tile = new Tile(q, r);
            if (this.#kind(tile) === TileKind.Open) {
                return tile;
            }
        }
        throw new Error("Invalid grid");
    }

    #step({ q, r }: Tile, facing: Facing): Tile {
        switch (facing) {
            case Facing.Right: {
                return new Tile(this.#cols[r].step(q, 1), r);
            }
            case Facing.Down: {
                return new Tile(q, this.#rows[q].step(r, 1));
            }
            case Facing.Left: {
                return new Tile(this.#cols[r].step(q, -1), r);
            }
            case Facing.Up: {
                return new Tile(q, this.#rows[q].step(r, -1));
            }
        }
    }
}

type SideId = 0 | 1 | 2 | 3 | 4 | 5;

interface Connection {
    readonly sideId: SideId;
    readonly tileRotations: number;
    readonly facingRotations: number;
}

const modulo = (value: number, base: number): number => {
    const result = value % base;
    return result < 0 ? base + result : result;
};

class CubeGrid implements Cursor {
    private static scale({ q, r }: Tile, scale: number): Tile {
        return new Tile(Math.floor(q / scale), Math.floor(r / scale));
    }

    readonly scale: number;
    readonly #sides: ReadonlyArray<Tile>;
    readonly #tiles: ReadonlyArray<ReadonlyArray<ReadonlyArray<TileKind>>>;
    #sideId: SideId;
    #tile: Tile;
    #facing: Facing;
    #connections: Map<SideId, Map<Facing, Connection>>;

    constructor(section: string) {
        const scale = Math.sqrt((section.match(/[\.#]/g)?.length ?? 0) / 6);
        const lines = section.split("\n");
        const size = new Tile(
            lines.reduce(
                (current, line) => Math.max(current, line.length),
                -Infinity
            ),
            lines.length
        );
        const scaledSize = CubeGrid.scale(size, scale);
        const sides: Tile[] = [];
        const tiles: TileKind[][][] = [];
        for (let r = 0; r < scaledSize.r; r++) {
            const row = r * scale;
            const line = lines[row];
            for (let q = 0; q < scaledSize.q; q++) {
                const col = q * scale;
                if (col >= line.length || line[col] === " ") {
                    continue;
                }
                sides.push(new Tile(q, r));
                tiles.push(
                    lines
                        .slice(row, row + scale)
                        .map(
                            (line) =>
                                Array.from(
                                    line.slice(col, col + scale)
                                ) as TileKind[]
                        )
                );
            }
        }
        const sideId = 0;
        const r = 0;
        const q = tiles[sideId][r].indexOf(TileKind.Open);
        if (q === -1) {
            throw new Error("Cannot find start");
        }
        this.scale = scale;
        this.#sides = sides;
        this.#tiles = tiles;
        this.#sideId = sideId;
        this.#tile = new Tile(q, 0);
        this.#facing = Facing.Right;
        this.#connections = new Map();
    }

    turn(turn: Turn): void {
        this.#facing = rotate(this.#facing, toAmount(turn));
    }

    move(count: number): void {
        console.group("Move", count);
        this.#log();
        for (let i = 0; i < count; i++) {
            let nextFacing = this.#facing;
            let nextSideId = this.#sideId;
            let nextTile = this.#tile.neighbor(this.#facing);
            if (!this.#inBounds(nextTile)) {
                const neighbor = this.#sides[this.#sideId].neighbor(
                    this.#facing
                );
                const index = this.#sides.findIndex((tile) =>
                    tile.equals(neighbor)
                );
                if (index !== -1) {
                    nextSideId = index as SideId;
                    nextTile = new Tile(
                        modulo(nextTile.q, this.scale),
                        modulo(nextTile.r, this.scale)
                    );
                } else {
                    const connection = this.#connections
                        .get(this.#sideId)
                        ?.get(this.#facing);
                    if (connection === undefined) {
                        throw new Error(
                            `Undefined connection for ${this.#sideId} ${
                                Facing[this.#facing]
                            }`
                        );
                    }
                    nextSideId = connection.sideId;
                    nextTile = this.#tile;
                    for (let i = 0; i < connection.tileRotations; i++) {
                        nextTile = nextTile.rotate(this.scale);
                    }
                    nextFacing = rotate(
                        this.#facing,
                        connection.facingRotations
                    );
                }
            }
            if (this.#isWall(nextSideId, nextTile)) {
                break;
            }
            this.#facing = nextFacing;
            this.#sideId = nextSideId;
            this.#tile = nextTile;
            this.#log();
        }
        console.groupEnd();
    }

    score(): number {
        const { q, r } = CubeGrid.scale(this.#sides[this.#sideId], this.scale);
        return score(
            new Tile(q + this.#tile.q, r + this.#tile.r),
            this.#facing
        );
    }

    connect(source: SideId, facing: Facing, connection: Connection): void {
        this.#align(source, facing, connection);
        this.#align(connection.sideId, rotate(facing, 2), {
            ...connection,
            sideId: source,
        });
    }

    #log(): void {
        console.log(this.#sideId, this.#tile, Facing[this.#facing]);
    }

    #align(source: SideId, facing: Facing, connection: Connection): void {
        if (!this.#connections.has(source)) {
            this.#connections.set(source, new Map());
        }
        this.#connections.get(source)!.set(facing, connection);
    }

    #inBounds({ q, r }: Tile): boolean {
        return q >= 0 && q < this.scale && r >= 0 && r < this.scale;
    }

    #isWall(sideId: SideId, { q, r }: Tile): boolean {
        return this.#tiles[sideId][r][q] === TileKind.Wall;
    }
}

interface ForceField {
    readonly section: string;
    readonly instructions: InstructionList;
}

const traverse = (cursor: Cursor, instructions: InstructionList): number => {
    for (const instruction of instructions) {
        if (typeof instruction === "number") {
            cursor.move(instruction);
        } else {
            cursor.turn(instruction);
        }
    }
    return cursor.score();
};

function* parseInstructions(line: string): IterableIterator<Instruction> {
    let buffer: string[] = [];
    const finalize = (): number => {
        const value = IntSchema.parse(buffer.join(""));
        buffer = [];
        return value;
    };
    for (const char of line.trim()) {
        if (char === Turn.Left || char === Turn.Right) {
            yield finalize();
            yield char;
        } else {
            buffer.push(char);
        }
    }
    yield finalize();
}

const parse = (input: string): ForceField => {
    const sections = input.split("\n\n");
    const section = sections[0];
    const instructions = Array.from(parseInstructions(sections[1]));
    return { section, instructions };
};

const part1 = ({ section, instructions }: ForceField): number =>
    traverse(new Grid(section), instructions);

const part2 = ({ section, instructions }: ForceField): number => {
    const grid = new CubeGrid(section);
    if (grid.scale === 4) {
        grid.connect(3, Facing.Right, {
            sideId: 5,
            tileRotations: 3,
            facingRotations: 1,
        });
    }
    return traverse(grid, instructions);
};

main(module, parse, part1, part2);
