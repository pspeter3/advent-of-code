import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";
import { sum } from "../../common/itertools.ts";

type Equation = readonly [target: number, values: ReadonlyArray<number>];
type EquationList = ReadonlyArray<Equation>;

const ValuesSchema = z
    .string()
    .transform((value) => value.split(" "))
    .pipe(z.array(IntSchema));
const EquationSchema = z
    .string()
    .transform((line) => line.split(": "))
    .pipe(z.tuple([IntSchema, ValuesSchema]));
const EquationListSchema = LinesSchema(EquationSchema);

const baseValue = (value: number, index: number, base: number): number =>
    Math.floor(value / Math.pow(base, index)) % base;

const evaluate = (a: number, b: number, op: number): number => {
    switch (op) {
        case 0:
            return a + b;
        case 1:
            return a * b;
        case 2:
            return parseInt(`${a}${b}`, 10);
        default:
            throw new Error(`Invalid operator: ${op}`);
    }
};

const isValid = (
    [target, values]: Equation,
    mask: number,
    base: number,
): boolean =>
    target ===
    values.reduce((acc, value, index) =>
        evaluate(acc, value, baseValue(mask, index - 1, base)),
    );

const hasValid = (equation: Equation, base: number): boolean => {
    const max = Math.pow(base, equation[1].length - 1);
    for (let mask = 0; mask < max; mask++) {
        if (isValid(equation, mask, base)) {
            return true;
        }
    }
    return false;
};

const solve = (equations: EquationList, base: number): number =>
    sum(
        equations
            .values()
            .filter((equation) => hasValid(equation, base))
            .map(([target, _]) => target),
    );

const parse = (input: string): EquationList => EquationListSchema.parse(input);

const part1 = (equations: EquationList): number => solve(equations, 2);

const part2 = (equations: EquationList): number => solve(equations, 3);

await main(import.meta, parse, part1, part2);
