import { z } from "zod";
import { main } from "../../utils/host";
import { IntSchema } from "../../utils/schemas";

enum Direction {
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
}

const score = ({ q, r }: Tile, facing: Direction): number =>
    1000 * (r + 1) + 4 * (q + 1) + facing;

const rotate = (facing: Direction, turn: Turn): Direction =>
    (facing + (turn === Turn.Left ? 3 : 1)) % 4;

class Grid implements Cursor {
    private static toId(size: Tile, { q, r }: Tile): number {
        if (q < 0 || q >= size.q || r < 0 || r >= size.r) {
            throw new Error("Tile is out of bounds");
        }
        return r * size.q + q;
    }

    readonly #size: Tile;
    readonly #cols: ReadonlyArray<Bounds>;
    readonly #rows: ReadonlyArray<Bounds>;
    readonly #data: ReadonlyMap<number, TileKind>;
    #tile: Tile;
    #direction: Direction;

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
        this.#size = size;
        this.#cols = cols;
        this.#rows = rowMin.map((min, index) => new Bounds(min, rowMax[index]));
        this.#data = new Map(entries);
        this.#tile = this.#start();
        this.#direction = Direction.Right;
    }

    turn(turn: Turn): void {
        this.#direction = rotate(this.#direction, turn);
    }

    move(count: number): void {
        for (let i = 0; i < count; i++) {
            const next = this.#step(this.#tile, this.#direction);
            if (this.#kind(next) === TileKind.Wall) {
                break;
            }
            this.#tile = next;
        }
    }

    score(): number {
        return score(this.#tile, this.#direction);
    }

    #kind(tile: Tile): TileKind {
        const kind = this.#data.get(Grid.toId(this.#size, tile));
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

    #step({ q, r }: Tile, direction: Direction): Tile {
        switch (direction) {
            case Direction.Right: {
                return new Tile(this.#cols[r].step(q, 1), r);
            }
            case Direction.Down: {
                return new Tile(q, this.#rows[q].step(r, 1));
            }
            case Direction.Left: {
                return new Tile(this.#cols[r].step(q, -1), r);
            }
            case Direction.Up: {
                return new Tile(q, this.#rows[q].step(r, -1));
            }
        }
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

const part2 = (field: ForceField): number => {
    return 0;
};

main(module, parse, part1, part2);
