import z from "zod";
import { main } from "../../utils/host";
import { IntSchema } from "../../utils/schemas";
import { sum } from "../../common/itertools";

interface Vector2DRecord {
    readonly x: number;
    readonly y: number;
}

interface Machine {
    readonly a: Vector2DRecord;
    readonly b: Vector2DRecord;
    readonly prize: Vector2DRecord;
}

type MachineList = ReadonlyArray<Machine>;

const Vector2DRecordSchema = z.object({ x: IntSchema, y: IntSchema });

const ButtonSchema = z
    .string()
    .transform((line) => {
        const match = line.match(/Button [AB]: X\+(\d+), Y\+(\d+)/);
        if (match === null) {
            return match;
        }
        return { x: match[1], y: match[2] };
    })
    .pipe(Vector2DRecordSchema);

const PrizeSchema = z
    .string()
    .transform((line) => {
        const match = line.match(/Prize: X=(\d+), Y=(\d+)/);
        if (match === null) {
            return match;
        }
        return { x: match[1], y: match[2] };
    })
    .pipe(Vector2DRecordSchema);

const MachineSchema = z
    .string()
    .transform((chunk) => {
        const [a, b, prize] = chunk.split("\n");
        return { a, b, prize };
    })
    .pipe(z.object({ a: ButtonSchema, b: ButtonSchema, prize: PrizeSchema }));

const MachineListSchema = z
    .string()
    .transform((input) => input.trim().split("\n\n"))
    .pipe(z.array(MachineSchema));

type Solution = readonly [a: number, b: number];

const solve = (machine: Machine): Solution | null => {
    const i = machine.a.x,
        j = machine.b.x,
        k = machine.prize.x,
        l = machine.a.y,
        m = machine.b.y,
        n = machine.prize.y;
    const determinant = i * m - j * l;
    if (determinant === 0) {
        throw new Error("No solution");
    }
    const b = (n * i - k * l) / (i * m - j * l);
    const a = (k - j * b) / i;
    const result: Solution = [a, b];
    if (result.some((x) => !Number.isInteger(x))) {
        return null;
    }
    return result;
};

const parse = (input: string): MachineList => MachineListSchema.parse(input);

const part1 = (machines: MachineList): number =>
    sum(
        machines
            .values()
            .map((machine) => solve(machine))
            .filter((solution) => solution !== null)
            .map(([a, b]) => 3 * a + b),
    );

const part2 = (machines: MachineList): number =>
    sum(
        machines
            .values()
            .map(({ a, b, prize }) => ({
                a,
                b,
                prize: {
                    x: prize.x + 10000000000000,
                    y: prize.y + 10000000000000,
                },
            }))
            .map((machine) => solve(machine))
            .filter((solution) => solution !== null)
            .map(([a, b]) => 3 * a + b),
    );

main(module, parse, part1, part2);
