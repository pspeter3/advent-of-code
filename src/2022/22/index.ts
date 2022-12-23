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

const SIDES = [
    [2, 4, 3, 1], // 1
    [2, 0, 3, 5], // 2
    [5, 4, 0, 1], // 3
    [0, 4, 5, 1], // 4
    [2, 5, 3, 0], // 5
    [2, 0, 3, 4], // 6
];

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

    step(value: number, direction: -1 | 1) {
        if (!this.contains(value)) {
            throw new Error(
                `Invalid value ${value} for bounds (${this.min}, ${this.max})`
            );
        }
        const next = value + direction;
        if (this.contains(next)) {
            return next;
        }
        return direction === -1 ? this.max : this.min;
    }

    *[Symbol.iterator](): IterableIterator<number> {
        for (let i = this.min; i <= this.max; i++) {
            yield i;
        }
    }
}

class Tile {
    readonly q: number;
    readonly r: number;

    constructor(q: number, r: number) {
        this.q = q;
        this.r = r;
    }
}

class Grid {
    private static toId(size: Tile, { q, r }: Tile): number {
        if (q < 0 || q >= size.q || r < 0 || r >= size.r) {
            throw new Error("Tile is out of bounds");
        }
        return r * size.q + q;
    }

    readonly size: Tile;
    readonly cols: ReadonlyArray<Bounds>;
    readonly rows: ReadonlyArray<Bounds>;
    readonly #data: ReadonlyMap<number, TileKind>;

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
                entries.push([Grid.toId(size, tile), kind]);
                rowMin[q] = Math.min(rowMin[q], r);
                rowMax[q] = Math.max(rowMax[q], r);
            }
            cols.push(new Bounds(offset, line.length - 1));
        }
        this.size = size;
        this.cols = cols;
        this.rows = rowMin.map((min, index) => new Bounds(min, rowMax[index]));
        this.#data = new Map(entries);
    }

    kind(tile: Tile): TileKind {
        const kind = this.#data.get(Grid.toId(this.size, tile));
        if (kind === undefined) {
            throw new Error(`Invalid tile ${JSON.stringify(tile)}`);
        }
        return kind;
    }

    start(): Tile {
        const r = 0;
        for (const q of this.cols[r]) {
            const tile = new Tile(q, r);
            if (this.kind(tile) === TileKind.Open) {
                return tile;
            }
        }
        throw new Error("Invalid grid");
    }
}

interface ForceField {
    readonly grid: Grid;
    readonly instructions: InstructionList;
}

const rotate = (facing: Facing, turn: Turn): Facing => {
    const next = (facing + (turn === Turn.Left ? -1 : 1)) % 4;
    return next < 0 ? 3 : next;
};

interface Mover {
    move(tile: Tile, facing: Facing): Tile;
}

class WrapMover implements Mover {
    readonly grid: Grid;

    constructor(grid: Grid) {
        this.grid = grid;
    }

    move({ q, r }: Tile, facing: Facing): Tile {
        switch (facing) {
            case Facing.Right: {
                return new Tile(this.grid.cols[r].step(q, 1), r);
            }
            case Facing.Down: {
                return new Tile(q, this.grid.rows[q].step(r, 1));
            }
            case Facing.Left: {
                return new Tile(this.grid.cols[r].step(q, -1), r);
            }
            case Facing.Up: {
                return new Tile(q, this.grid.rows[q].step(r, -1));
            }
        }
    }
}

type Side = 0 | 1 | 2 | 3 | 4 | 5;

class CubeMover {
    readonly grid: Grid;
    readonly scale: number;
    readonly sides: ReadonlyArray<ReadonlyArray<Side | null>>;
    readonly rotations: ReadonlyMap<Side, Facing>;

    constructor(
        grid: Grid,
        scale: number,
        sides: ReadonlyArray<ReadonlyArray<Side | null>>,
        rotations: ReadonlyMap<Side, Facing>
    ) {
        this.grid = grid;
        this.scale = scale;
        this.sides = sides;
        this.rotations = rotations;
    }

    move(tile: Tile): Tile {
        return tile;
    }
}

const score = ({ q, r }: Tile, facing: Facing): number =>
    1000 * (r + 1) + 4 * (q + 1) + facing;

const traverse = ({ grid, instructions }: ForceField, mover: Mover): number => {
    let tile = grid.start();
    let facing = Facing.Right;
    for (const instruction of instructions) {
        if (typeof instruction === "number") {
            for (let i = 0; i < instruction; i++) {
                const next = mover.move(tile, facing);
                if (grid.kind(next) === TileKind.Wall) {
                    break;
                }
                tile = next;
            }
        } else {
            facing = rotate(facing, instruction);
        }
    }
    return score(tile, facing);
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
    const grid = new Grid(sections[0]);
    const instructions = Array.from(parseInstructions(sections[1]));
    return { grid, instructions };
};

const part1 = (field: ForceField): number =>
    traverse(field, new WrapMover(field.grid));

const part2 = (field: ForceField): number => {
    const isExample = field.instructions.length === 13;
    const scale = isExample ? 5 : 50;
    const sides: ReadonlyArray<ReadonlyArray<Side | null>> = isExample
        ? [
              [null, null, 0, null],
              [1, 2, 3, null],
              [null, null, 4, 5],
          ]
        : [[]];
    const rotations = isExample ? new Map([[0, Facing.Right]]) : new Map();
    return traverse(field, new CubeMover(field.grid, scale, sides, rotations));
};

main(module, parse, part1, part2);
