import { main } from "../../utils/host";

enum Blizzard {
    Up = "^",
    Right = ">",
    Down = "v",
    Left = "<",
}

enum Direction {
    Up,
    Right,
    Down,
    Left,
}

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

    contains({ q, r }: Tile): boolean {
        return q >= 0 && q < this.q && r >= 0 && r < this.r;
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

class State {
    readonly minute: number;
    readonly elf: Tile;
    readonly key: string;

    constructor(minute: number, elf: Tile) {
        this.minute = minute;
        this.elf = elf;
        this.key = [this.minute, this.elf.q, this.elf.r].join(",");
    }

    *evolve(
        board: Tile,
        blizzards: ReadonlyMap<Tile, Blizzard>,
        source: Tile,
        target: Tile
    ): IterableIterator<State> {
        const nextMinute = this.minute + 1;
        const nextBlizzards = new Set<number>();
        for (const [tile, blizzard] of blizzards) {
            nextBlizzards.add(
                board.toId(
                    board.normalize(tile.move(MOVES[blizzard], nextMinute))
                )
            );
        }
        if (source.equals(this.elf) || !nextBlizzards.has(board.toId(this.elf))) {
            yield new State(nextMinute, this.elf);
        }
        for (const direction of [
            Direction.Up,
            Direction.Right,
            Direction.Down,
            Direction.Left,
        ]) {
            const nextElf = this.elf.move(direction);
            if (nextElf.equals(target)) {
                yield new State(nextMinute, nextElf);
            }
            if (!board.contains(nextElf)) {
                continue;
            }
            if (nextBlizzards.has(board.toId(nextElf))) {
                continue;
            }
            yield new State(nextMinute, nextElf);
        }
    }
}

interface Input {
    readonly board: Tile;
    readonly blizzards: ReadonlyMap<Tile, Blizzard>;
    readonly state: State;
}

const parse = (input: string): Input => {
    const lines = input.trim().split("\n");
    const q = lines[0].length;
    const r = lines.length;
    const board = new Tile(q - 2, r - 2);
    const elf = new Tile(0, -1);
    const blizzards = new Map<Tile, Blizzard>();
    for (const [r, line] of lines.entries()) {
        for (const [q, char] of Array.from(line).entries()) {
            if (isBlizzard(char)) {
                const tile = new Tile(q - 1, r - 1);
                blizzards.set(tile, char);
            }
        }
    }
    const state = new State(0, elf);
    return { board, blizzards, state };
};

const closest = (queue: State[], target: Tile): State => {
    let index = -1;
    let min = Infinity;
    for (const [i, { elf }] of queue.entries()) {
        const distance = elf.distance(target);
        if (distance < min) {
            min = distance;
            index = i;
        }
    }
    return queue.splice(index, 1)[0];
};

const part1 = ({ board, blizzards, state }: Input): number => {
    const source = state.elf;
    const target = new Tile(board.q - 1, board.r);
    const queue = [state];
    const visited = new Set<string>();
    while (queue.length > 0) {
        const state = closest(queue, target);
        visited.add(state.key);
        for (const n of state.evolve(board, blizzards, source, target)) {
            if (n.elf.equals(target)) {
                return n.minute;
            }
            if (!visited.has(n.key)) {
                queue.push(n);
            }
        }
    }
    throw new Error("Did not find end");
};

const part2 = (input: unknown): number => 0;

main(module, parse, part1);
