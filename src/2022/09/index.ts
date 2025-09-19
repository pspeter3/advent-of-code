import { z } from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";

const Direction = { Up: "U", Right: "R", Down: "D", Left: "L" } as const;
type Direction = (typeof Direction)[keyof typeof Direction];

const schema = LinesSchema(
    z
        .string()
        .transform((line) => line.split(" "))
        .pipe(z.tuple([z.enum(Direction), IntSchema])),
);

type Move = readonly [direction: Direction, amount: number];
type MoveList = ReadonlyArray<Move>;

const zigZag = (value: number): bigint => {
    const result = 2 * value;
    return value < 0 ? BigInt(Math.abs(result) - 1) : BigInt(result);
};

class GridCell {
    readonly q: number;
    readonly r: number;

    constructor(q: number, r: number) {
        this.q = q;
        this.r = r;
    }

    get id(): bigint {
        const { q, r } = this;
        const x = zigZag(q);
        const y = zigZag(r);
        return (x * x + x + 2n * x * y + 3n * y + y * y) / 2n;
    }

    move(direction: Direction): GridCell {
        const { q, r } = this;
        switch (direction) {
            case Direction.Up: {
                return new GridCell(q, r - 1);
            }
            case Direction.Right: {
                return new GridCell(q + 1, r);
            }
            case Direction.Down: {
                return new GridCell(q, r + 1);
            }
            case Direction.Left: {
                return new GridCell(q - 1, r);
            }
        }
    }

    moves({ q, r }: GridCell): MoveList {
        const moves: Move[] = [];
        if (this.q !== q) {
            moves.push([
                q < this.q ? Direction.Left : Direction.Right,
                Math.abs(this.q - q),
            ]);
        }
        if (this.r !== r) {
            moves.push([
                r < this.r ? Direction.Up : Direction.Down,
                Math.abs(this.r - r),
            ]);
        }
        return moves;
    }

    equals({ q, r }: GridCell): boolean {
        return this.q === q && this.r === r;
    }
}

const parse = (input: string): MoveList => schema.parse(input);

const chase = (head: GridCell, tail: GridCell): GridCell => {
    let cell = tail;
    const moves = tail.moves(head);
    switch (moves.length) {
        case 0: {
            return cell;
        }
        case 1: {
            const [direction, amount] = moves[0];
            switch (amount) {
                case 1: {
                    return cell;
                }
                case 2: {
                    return cell.move(direction);
                }
                default: {
                    throw new Error(`Invalid step ${moves}`);
                }
            }
        }
        case 2: {
            const magnitude = moves.reduce(
                (sum, [_, amount]) => sum + amount,
                0,
            );
            if (magnitude < 2) {
                throw new Error(`Invalid step ${moves}`);
            }
            if (magnitude > 2) {
                for (const [direction, _] of moves) {
                    cell = cell.move(direction);
                }
            }

            return cell;
        }
        default: {
            throw new Error(`Invalid delta ${moves}`);
        }
    }
};

const part1 = (moves: MoveList): number => {
    let head = new GridCell(0, 0);
    let tail = new GridCell(0, 0);
    const cells = new Set<bigint>([tail.id]);
    for (const [direction, amount] of moves) {
        for (let i = 0; i < amount; i++) {
            head = head.move(direction);
            const next = chase(head, tail);
            if (!tail.equals(next)) {
                tail = next;
                cells.add(tail.id);
            }
        }
    }
    return cells.size;
};

const part2 = (moves: MoveList): number => {
    const knots = Array.from({ length: 10 }, () => new GridCell(0, 0));
    const tail = knots.length - 1;
    const cells = new Set<bigint>([knots[tail].id]);
    for (const [direction, amount] of moves) {
        for (let i = 0; i < amount; i++) {
            knots[0] = knots[0].move(direction);
            for (let k = 1; k < knots.length; k++) {
                knots[k] = chase(knots[k - 1], knots[k]);
            }
            cells.add(knots[tail].id);
        }
    }
    return cells.size;
};

await main(import.meta, parse, part1, part2);
