import { main } from "../../utils/host";

const Blizzard = { Up: "^", Right: ">", Down: "v", Left: "<" } as const;
type Blizzard = (typeof Blizzard)[keyof typeof Blizzard];

const Direction = { Up: 0, Right: 1, Down: 2, Left: 3 } as const;
type Direction = (typeof Direction)[keyof typeof Direction];

const MOVES = {
    [Blizzard.Up]: Direction.Up,
    [Blizzard.Right]: Direction.Right,
    [Blizzard.Down]: Direction.Down,
    [Blizzard.Left]: Direction.Left,
};

const BLIZZARDS = new Set([
    Blizzard.Up,
    Blizzard.Right,
    Blizzard.Down,
    Blizzard.Left,
]);

const isBlizzard = (char: string): char is Blizzard =>
    BLIZZARDS.has(char as Blizzard);

const modulo = (value: number, base: number): number => {
    const result = value % base;
    return result < 0 ? base + result : result;
};

class Tile {
    static fromId(board: Tile, id: number): Tile {
        const q = id % board.q;
        const r = Math.floor(id / board.q);
        return new Tile(q, r);
    }

    readonly q: number;
    readonly r: number;

    constructor(q: number, r: number) {
        this.q = q;
        this.r = r;
    }

    contains(tile: Tile): boolean {
        if (tile.equals(this.source()) || tile.equals(this.target())) {
            return true;
        }
        const { q, r } = tile;
        return q >= 0 && q < this.q && r >= 0 && r < this.r;
    }

    source(): Tile {
        return new Tile(0, -1);
    }

    target(): Tile {
        return new Tile(this.q - 1, this.r);
    }

    toId(tile: Tile): number {
        if (!this.contains(tile)) {
            console.error(tile);
            throw new Error("Invalid grid tile");
        }
        const { q, r } = tile;
        return this.q * r + q;
    }

    move(direction: Direction, x: number = 1): Tile {
        const { q, r } = this;
        switch (direction) {
            case Direction.Up: {
                return new Tile(q, r - x);
            }
            case Direction.Right: {
                return new Tile(q + x, r);
            }
            case Direction.Down: {
                return new Tile(q, r + x);
            }
            case Direction.Left: {
                return new Tile(q - x, r);
            }
        }
    }

    distance({ q, r }: Tile): number {
        return Math.abs(this.q - q) + Math.abs(this.r - r);
    }

    normalize({ q, r }: Tile) {
        return new Tile(modulo(q, this.q), modulo(r, this.r));
    }

    equals({ q, r }: Tile): boolean {
        return this.q === q && this.r === r;
    }
}

class Forecast {
    readonly blizzards: Readonly<
        Record<Blizzard, ReadonlyArray<ReadonlySet<number>>>
    >;

    constructor(
        blizzards: Readonly<
            Record<Blizzard, ReadonlyArray<ReadonlySet<number>>>
        >,
    ) {
        this.blizzards = blizzards;
    }

    hasBlizzard(board: Tile, time: number, tile: Tile): boolean {
        if (board.source().equals(tile) || board.target().equals(tile)) {
            return false;
        }
        const { q, r } = tile;
        return (
            this.blizzards[Blizzard.Right][r].has(modulo(q - time, board.q)) ||
            this.blizzards[Blizzard.Left][r].has(modulo(q + time, board.q)) ||
            this.blizzards[Blizzard.Down][q].has(modulo(r - time, board.r)) ||
            this.blizzards[Blizzard.Up][q].has(modulo(r + time, board.r))
        );
    }
}

class State {
    readonly minute: number;
    readonly elf: Tile;
    readonly key: string;

    constructor(minute: number, elf: Tile) {
        this.minute = minute;
        this.elf = elf;
        this.key = [this.minute, this.elf.q, this.elf.r].join(",");
    }

    *evolve(board: Tile, forecast: Forecast): IterableIterator<State> {
        const nextMinute = this.minute + 1;
        for (const direction of [
            Direction.Up,
            Direction.Right,
            Direction.Down,
            Direction.Left,
        ]) {
            const nextElf = this.elf.move(direction);
            if (!board.contains(nextElf)) {
                continue;
            }
            if (forecast.hasBlizzard(board, nextMinute, nextElf)) {
                continue;
            }
            yield new State(nextMinute, nextElf);
        }
        if (!forecast.hasBlizzard(board, nextMinute, this.elf)) {
            yield new State(nextMinute, this.elf);
        }
    }
}

interface Input {
    readonly board: Tile;
    readonly forecast: Forecast;
    readonly state: State;
}

const parse = (input: string): Input => {
    const lines = input.trim().split("\n");
    const q = lines[0].length;
    const r = lines.length;
    const board = new Tile(q - 2, r - 2);
    const elf = board.source();
    const blizzards: Record<Blizzard, Array<Set<number>>> = {
        [Blizzard.Up]: Array.from({ length: board.q }, () => new Set()),
        [Blizzard.Down]: Array.from({ length: board.q }, () => new Set()),
        [Blizzard.Right]: Array.from({ length: board.r }, () => new Set()),
        [Blizzard.Left]: Array.from({ length: board.r }, () => new Set()),
    };
    for (const [r, line] of lines.entries()) {
        for (const [q, char] of Array.from(line).entries()) {
            if (isBlizzard(char)) {
                const x = q - 1;
                const y = r - 1;
                const isVertical =
                    char === Blizzard.Up || char === Blizzard.Down;
                const index = isVertical ? x : y;
                const value = isVertical ? y : x;
                blizzards[char][index].add(value);
            }
        }
    }
    const forecast = new Forecast(blizzards);
    const state = new State(0, elf);
    return { board, forecast, state };
};

const traverse = (
    board: Tile,
    forecast: Forecast,
    state: State,
    target: Tile,
): State => {
    let queue = new Map<string, State>([[state.key, state]]);
    while (queue.size > 0) {
        const next = new Map<string, State>();
        for (const state of queue.values()) {
            for (const n of state.evolve(board, forecast)) {
                if (!next.has(n.key)) {
                    next.set(n.key, n);
                }
                if (n.elf.equals(target)) {
                    return n;
                }
            }
        }
        queue = next;
    }
    throw new Error("Did not find end");
};

const part1 = ({ board, forecast, state }: Input): number =>
    traverse(board, forecast, state, board.target()).minute;

const part2 = ({ board, forecast, state }: Input): number => {
    const first = traverse(board, forecast, state, board.target());
    const second = traverse(board, forecast, first, board.source());
    const final = traverse(board, forecast, second, board.target());
    return final.minute;
};

main(module, parse, part1, part2);
