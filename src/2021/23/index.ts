import { z } from "zod";
import { main } from "../../utils/host.ts";
import { StringSchema } from "../../utils/schemas.ts";

type Amphipod = "A" | "B" | "C" | "D";

type Node = Amphipod | null;
type Line = ReadonlyArray<Node>;
type Grid = ReadonlyArray<Line>;

type Cell = readonly [line: number, node: number];

const HALL = 4;

const ROOMS: Readonly<Record<Amphipod, number>> = {
    A: 0,
    B: 1,
    C: 2,
    D: 3,
};

const COSTS: Readonly<Record<Amphipod, number>> = {
    A: 1,
    B: 10,
    C: 100,
    D: 1000,
};

const AMPHIPODS: ReadonlyArray<Amphipod> = ["A", "B", "C", "D"];

const DOORS: ReadonlyArray<number> = [2, 4, 6, 8];
const WAITING: ReadonlyArray<number> = Array.from(
    { length: 11 },
    (_, i) => i,
).filter((i) => !DOORS.includes(i));

const toKey = (grid: Grid): string => JSON.stringify(grid);
const fromKey = (key: string): Grid => JSON.parse(key);

const swap = (grid: Grid, [al, an]: Cell, [bl, bn]: Cell): Grid =>
    grid.map((line, l) =>
        line.map((node, n) => {
            if (l === al && n === an) {
                return grid[bl][bn];
            }
            if (l === bl && n == bn) {
                return grid[al][an];
            }
            return node;
        }),
    );

const toNode = (grid: Grid, [line, node]: Cell): Node => grid[line][node];

const hasPath = (line: Line, a: number, b: number): boolean => {
    const sign = Math.sign(b - a);
    for (let i = a + sign; i !== b + sign; i += sign) {
        if (line[i] !== null) {
            return false;
        }
    }
    return true;
};

const toHall = ([line, node]: Cell): readonly [node: number, cost: number] => {
    if (line === HALL) {
        return [node, 0];
    }
    return [DOORS[line], node + 1];
};

const distance = (a: Cell, b: Cell): number => {
    const [an, ac] = toHall(a);
    const [bn, bc] = toHall(b);
    return Math.abs(bn - an) + ac + bc;
};

const isValid = (room: Line): boolean => {
    let prev: Node = null;
    for (const node of room) {
        if (prev !== null && node === null) {
            return false;
        }
        prev = node;
    }
    return true;
};

const findOptions = (
    rooms: ReadonlyArray<Line>,
): readonly [
    moves: ReadonlyArray<Cell | null>,
    slots: ReadonlyArray<Cell | null>,
] => {
    const moves: Array<Cell | null> = [];
    const slots: Array<Cell | null> = [];
    for (const [line, room] of rooms.entries()) {
        if (!isValid(room)) {
            throw new Error("Invalid room");
        }
        const isOpen = room.every(
            (node) => node === null || node === AMPHIPODS[line],
        );
        if (isOpen) {
            moves.push(null);
            const node = room.lastIndexOf(null);
            slots.push(node === -1 ? null : [line, node]);
        } else {
            slots.push(null);
            const node = room.findIndex((value) => value !== null);
            moves.push(node === -1 ? null : [line, node]);
        }
    }
    return [moves, slots];
};

type Entry = readonly [key: string, cost: number];
const toEntry = (grid: Grid, a: Cell, b: Cell, cost: number): Entry => [
    toKey(swap(grid, a, b)),
    cost * distance(a, b),
];

const edges = (grid: Grid): ReadonlyMap<string, number> => {
    const entries: Entry[] = [];
    const hall = grid[HALL];
    const rooms = grid.slice(0, HALL);
    const [moves, slots] = findOptions(rooms);
    for (const move of moves) {
        if (move === null) {
            continue;
        }
        const node = toNode(grid, move);
        if (node === null) {
            throw new Error(`Invalid move ${JSON.stringify(move)}`);
        }
        const cost = COSTS[node];
        const room = ROOMS[node];
        const slot = slots[room];
        const door = DOORS[move[0]];
        if (slot !== null && hasPath(hall, door, DOORS[room])) {
            entries.push(toEntry(grid, move, slot, cost));
            continue;
        }
        for (const i of WAITING) {
            if (hasPath(hall, door, i)) {
                entries.push(toEntry(grid, move, [HALL, i], cost));
            }
        }
    }
    for (const [index, node] of hall.entries()) {
        if (node === null) {
            continue;
        }
        const room = ROOMS[node];
        const slot = slots[room];
        if (slot === null) {
            continue;
        }
        if (hasPath(hall, index, DOORS[room])) {
            entries.push(toEntry(grid, [HALL, index], slot, COSTS[node]));
        }
    }
    return new Map(entries);
};

const dequeue = (queue: Map<string, number>): Entry => {
    let key: string | null = null;
    let cost = Infinity;
    for (const [k, v] of queue) {
        if (v < cost) {
            cost = v;
            key = k;
        }
    }
    if (key === null) {
        throw new Error("Invalid queue");
    }
    queue.delete(key);
    return [key, cost];
};

const seek = (start: Grid, final: Grid): number => {
    const target = toKey(final);
    const queue = new Map<string, number>([[toKey(start), 0]]);
    const visited = new Set<string>();
    while (queue.size > 0) {
        const [key, cost] = dequeue(queue);
        visited.add(key);
        if (key === target) {
            return cost;
        }
        for (const [next, delta] of edges(fromKey(key))) {
            const total = cost + delta;
            if (!visited.has(next) && total < (queue.get(next) ?? Infinity)) {
                queue.set(next, total);
            }
        }
    }
    throw new Error("Could not find path");
};

const createHall = (): Line => Array.from({ length: 11 }, () => null);

const createFinal = (size: number): Grid =>
    AMPHIPODS.map(
        (amphipod: Amphipod): Line =>
            Array.from({ length: size }, () => amphipod),
    ).concat([createHall()]);

const schema = z.preprocess(
    (input) => {
        const data = StringSchema.parse(input)
            .trim()
            .split("\n")
            .map((line) => line.split(""));
        return [
            ...DOORS.map((door) => [data[2][door + 1], data[3][door + 1]]),
            createHall(),
        ];
    },
    z.array(z.array(z.enum(["A", "B", "C", "D"]).nullable())),
);

const part1 = (grid: Grid): number => seek(grid, createFinal(2));

const part2 = (grid: Grid): number => {
    const extensions: Grid = [
        ["D", "D"],
        ["C", "B"],
        ["B", "A"],
        ["A", "C"],
    ];
    const rooms = grid.slice(0, HALL);
    const input: Grid = [
        ...rooms.map((room, index) => {
            const extension = extensions[index];
            return [room[0], extension[0], extension[1], room[1]];
        }),
        grid[HALL],
    ];
    return seek(input, createFinal(4));
};

await main(import.meta, (input) => schema.parse(input), part1, part2);
