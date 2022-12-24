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
            throw new Error("Invalid grid tile");
        }
        const { q, r } = tile;
        return this.q * r + q;
    }

    move(direction: Direction): Tile {
        const { q, r } = this;
        switch (direction) {
            case Direction.Up: {
                return new Tile(q, r - 1);
            }
            case Direction.Right: {
                return new Tile(q + 1, r);
            }
            case Direction.Down: {
                return new Tile(q, r + 1);
            }
            case Direction.Left: {
                return new Tile(q - 1, r);
            }
        }
    }

    distance({q, r}: Tile): number {
        return Math.abs(this.q - q) + Math.abs(this.r - r);
    }
}

class State {
    readonly minute: number;
    readonly elf: Tile;
    readonly blizzards: ReadonlyMap<number, ReadonlyArray<Blizzard>>;
    readonly key: string;

    constructor(
        minute: number,
        elf: Tile,
        blizzards: ReadonlyMap<number, ReadonlyArray<Blizzard>>
    ) {
        this.minute = minute;
        this.elf = elf;
        this.blizzards = blizzards;
        this.key = JSON.stringify({
            minute: this.minute,
            elf: this.elf,
            blizzards: Array.from(this.blizzards),
        });
    }

    isFinal(board: Tile): boolean {
        return this.#isEnd(board, this.elf);
    }

    *evolve(board: Tile): IterableIterator<State> {
        const nextMinute = this.minute + 1;
        const nextBlizzards = new Map<number, Blizzard[]>();
        for (const [id, blizzards] of this.blizzards) {
            const tile = Tile.fromId(board, id);
            for (const blizzard of blizzards) {
                const next = board.toId(
                    this.#normalize(board, blizzard, tile.move(MOVES[blizzard]))
                );
                if (!nextBlizzards.has(next)) {
                    nextBlizzards.set(next, []);
                }
                nextBlizzards.get(next)!.push(blizzard);
            }
        }
        const elfId = board.toId(this.elf);
        if (!nextBlizzards.has(elfId)) {
            yield new State(nextMinute, this.elf, nextBlizzards);
        }
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
            if (nextBlizzards.has(board.toId(nextElf))) {
                continue;
            }
            if (
                this.#isWall(board, nextElf) &&
                !this.#isStart(nextElf) &&
                !this.#isEnd(board, nextElf)
            ) {
                continue;
            }
            yield new State(nextMinute, nextElf, nextBlizzards);
        }
    }

    #normalize(board: Tile, blizzard: Blizzard, tile: Tile): Tile {
        switch (blizzard) {
            case Blizzard.Up: {
                return this.#isWall(board, tile)
                    ? new Tile(tile.q, board.r - 2)
                    : tile;
            }
            case Blizzard.Right: {
                return this.#isWall(board, tile) ? new Tile(1, tile.r) : tile;
            }
            case Blizzard.Down: {
                return this.#isWall(board, tile) ? new Tile(tile.q, 1) : tile;
            }
            case Blizzard.Left: {
                return this.#isWall(board, tile)
                    ? new Tile(board.q - 2, tile.r)
                    : tile;
            }
        }
    }

    #isWall(board: Tile, { q, r }: Tile): boolean {
        return q === 0 || q === board.q - 1 || r === 0 || r === board.r - 1;
    }

    #isStart({ q, r }: Tile): boolean {
        return q === 1 && r === 0;
    }

    #isEnd(board: Tile, { q, r }: Tile): boolean {
        return q === board.q - 2 && r === board.r - 1;
    }
}

interface Input {
    readonly board: Tile;
    readonly state: State;
}

const parse = (input: string): Input => {
    const lines = input.trim().split("\n");
    const q = lines[0].length;
    const r = lines.length;
    const board = new Tile(q, r);
    const elf = new Tile(1, 0);
    const blizzards = new Map();
    for (const [r, line] of lines.entries()) {
        for (const [q, char] of Array.from(line).entries()) {
            if (isBlizzard(char)) {
                const tile = new Tile(q, r);
                blizzards.set(board.toId(tile), [char]);
            }
        }
    }
    const state = new State(0, elf, blizzards);
    return { board, state };
};

const closest = (queue: State[], target: Tile): State => {
    let index = -1;
    let min = Infinity;
    for (const [i, {elf}] of queue.entries()) {
        const distance = elf.distance(target);
        if ( distance < min) {
            min = distance;
            index = i
        }
    }
    return queue.splice(index, 1)[0];
}

const part1 = ({ board, state }: Input): number => {
    const target = new Tile(board.q - 2, board.r - 1);
    const queue = [state];
    const visited = new Set<string>();
    while (queue.length > 0) {
        const state = closest(queue, target);
        visited.add(state.key);
        for (const n of state.evolve(board)) {
            if (n.isFinal(board)) {
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

main(module, parse, part1, part2);
