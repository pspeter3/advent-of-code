import { z } from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema } from "../../utils/schemas.ts";

const Facing = { Right: 0, Down: 1, Left: 2, Up: 3 } as const;
type Facing = (typeof Facing)[keyof typeof Facing];

const TileKind = { Open: ".", Wall: "#" } as const;
type TileKind = (typeof TileKind)[keyof typeof TileKind];
const TileKindSchema = z.enum(TileKind);

const Turn = { Left: "L", Right: "R" } as const;
type Turn = (typeof Turn)[keyof typeof Turn];

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
                `Invalid value ${value} for bounds (${this.min}, ${this.max})`,
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
}

const score = ({ q, r }: Tile, facing: Facing): number =>
    1000 * (r + 1) + 4 * (q + 1) + facing;

const toAmount = (turn: Turn): number => (turn === Turn.Left ? 3 : 1);

const rotate = (facing: Facing, amount: number): Facing =>
    ((facing + amount) % 4) as Facing;

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
                -Infinity,
            ),
            lines.length,
        );
        const cols: Bounds[] = [];
        const rowMin: number[] = Array.from({ length: size.q }, () => Infinity);
        const rowMax: number[] = Array.from(
            { length: size.q },
            () => -Infinity,
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
    readonly facing: Facing;
    readonly op: Operation;
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
                -Infinity,
            ),
            lines.length,
        );
        const scaledSize = CubeGrid.scale(size, scale);
        const sides: Tile[] = [];
        const tiles: TileKind[][][] = [];
        for (let r = 0; r < scaledSize.r; r++) {
            const chars: string[] = [];
            const row = r * scale;
            const line = lines[row];
            for (let q = 0; q < scaledSize.q; q++) {
                const col = q * scale;
                if (col >= line.length || line[col] === " ") {
                    chars.push(".");
                    continue;
                }
                chars.push(sides.length.toString());
                sides.push(new Tile(q, r));
                tiles.push(
                    lines
                        .slice(row, row + scale)
                        .map(
                            (line) =>
                                Array.from(
                                    line.slice(col, col + scale),
                                ) as TileKind[],
                        ),
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
        for (let i = 0; i < count; i++) {
            let nextFacing = this.#facing;
            let nextSideId = this.#sideId;
            let nextTile = this.#tile.neighbor(this.#facing);
            if (!this.#inBounds(nextTile)) {
                const neighbor = this.#sides[this.#sideId].neighbor(
                    this.#facing,
                );
                const index = this.#sides.findIndex((tile) =>
                    tile.equals(neighbor),
                );
                if (index !== -1) {
                    nextSideId = index as SideId;
                    nextTile = new Tile(
                        modulo(nextTile.q, this.scale),
                        modulo(nextTile.r, this.scale),
                    );
                } else {
                    const connection = this.#connections
                        .get(this.#sideId)
                        ?.get(this.#facing);
                    if (connection === undefined) {
                        throw new Error(
                            `Undefined connection for ${this.#sideId} ${this.#facing}`,
                        );
                    }
                    nextFacing = connection.facing;
                    nextSideId = connection.sideId;
                    nextTile = connection.op(this.#tile);
                }
            }
            if (this.#isWall(nextSideId, nextTile)) {
                break;
            }
            this.#facing = nextFacing;
            this.#sideId = nextSideId;
            this.#tile = nextTile;
        }
    }

    score(): number {
        const { q, r } = this.#sides[this.#sideId];
        return score(
            new Tile(
                q * this.scale + this.#tile.q,
                r * this.scale + this.#tile.r,
            ),
            this.#facing,
        );
    }

    connect(source: SideId, facing: Facing, connection: Connection): void {
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
    for (const [_, instruction] of instructions.entries()) {
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

type Operation = (tile: Tile) => Tile;

type ConnectionParams = readonly [
    source: SideId,
    direction: Facing,
    target: SideId,
    facing: Facing,
    op: Operation,
];

const configure = (grid: CubeGrid): void => {
    const max = grid.scale - 1;
    const R = Facing.Right;
    const D = Facing.Down;
    const L = Facing.Left;
    const U = Facing.Up;
    const a: Operation = ({ q }) => new Tile(0, q);
    const b: Operation = ({ r }) => new Tile(0, max - r);
    const c: Operation = ({ q }) => new Tile(q, max);
    const d: Operation = ({ r }) => new Tile(max, max - r);
    const e: Operation = ({ q }) => new Tile(max, q);
    const f: Operation = ({ r }) => new Tile(r, max);
    const g: Operation = ({ q }) => new Tile(q, 0);
    const h: Operation = ({ r }) => new Tile(r, 0);
    const params: ReadonlyArray<ConnectionParams> = [
        [0, U, 5, R, a],
        [0, L, 3, R, b],
        [1, U, 5, U, c],
        [1, R, 4, L, d],
        [1, D, 2, L, e],
        [2, L, 3, D, h],
        [2, R, 1, U, f],
        [4, R, 1, L, d],
        [4, D, 5, L, e],
        [3, U, 2, R, a],
        [3, L, 0, R, b],
        [5, R, 4, U, f],
        [5, D, 1, D, g],
        [5, L, 0, D, h],
    ];
    for (const [source, direction, sideId, facing, op] of params) {
        grid.connect(source, direction, { sideId, facing, op });
    }
};

const part2 = ({ section, instructions }: ForceField): number => {
    const grid = new CubeGrid(section);
    const max = grid.scale - 1;
    if (grid.scale === 4) {
        grid.connect(3, Facing.Right, {
            sideId: 5,
            facing: Facing.Down,
            op: ({ r }) => new Tile(max - r, 0),
        });
        grid.connect(4, Facing.Down, {
            sideId: 1,
            facing: Facing.Up,
            op: ({ q }) => new Tile(max - q, max),
        });
        grid.connect(2, Facing.Up, {
            sideId: 0,
            facing: Facing.Right,
            op: ({ q }) => new Tile(0, q),
        });
    } else {
        configure(grid);
    }
    return traverse(grid, instructions);
};

await main(import.meta, parse, part1, part2);
