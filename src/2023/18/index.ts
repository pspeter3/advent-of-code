import z from "zod";
import { main } from "../../utils/host";
import {
    CardinalDirection,
    GridVector2D,
    toGridDelta,
} from "../../common/grid2d";
import { IntSchema, LinesSchema } from "../../utils/schemas";

interface Trench {
    readonly direction: CardinalDirection;
    readonly amount: number;
    readonly color: string;
}
type TrenchList = ReadonlyArray<Trench>;

const RELATIVE_DIRECTIONS = ["U", "R", "D", "L"] as const;
const DirectionSchema = z
    .enum(RELATIVE_DIRECTIONS)
    .transform((d) => RELATIVE_DIRECTIONS.indexOf(d) as CardinalDirection);
const TrenchSchema = z
    .string()
    .transform((line) => {
        const [direction, amount, color] = line.split(/\s+/);
        return { direction, amount, color };
    })
    .pipe(
        z.object({
            direction: DirectionSchema,
            amount: IntSchema,
            color: z.string(),
        }),
    );
const Schema = LinesSchema(TrenchSchema);

function trenchArea(trenches: TrenchList): number {
    let current = GridVector2D.ORIGIN;
    let perimeter = 0;
    let total = 0;
    for (const { direction, amount } of trenches) {
        const next = current.add(toGridDelta(direction).scale(amount));
        perimeter += amount;
        total += (current.r + next.r) * (current.q - next.q);
        current = next;
    }
    const area = 0.5 * total;
    const interior = area - Math.floor(perimeter / 2) + 1;
    return perimeter + interior;
}

function parseColor({ color }: Trench): Trench {
    const match = color.match(/^\(#([0-9a-f]{6})\)$/);
    if (match === null) {
        throw new Error("Invalid color");
    }
    const chars = match[1];
    const direction: CardinalDirection = (parseInt(chars[5], 16) + 1) % 4;
    const amount = parseInt(chars.slice(0, 5), 16);
    return { direction, amount, color };
}

const parse = (input: string): TrenchList => Schema.parse(input);

const part1 = (trenches: TrenchList): number => trenchArea(trenches);

const part2 = (trenches: TrenchList): number =>
    trenchArea(trenches.map(parseColor));

main(module, parse, part1, part2);
