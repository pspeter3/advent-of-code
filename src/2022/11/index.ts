import { z } from "zod";
import { main } from "../../utils/host";
import { IntSchema } from "../../utils/schemas";

interface Monkey {
    readonly start: ReadonlyArray<number>;
    readonly operation: Operation;
    readonly test: Test;
}

type OperationValue = "old" | number;
type OperationCommand = "+" | "*";
type Operation = readonly [
    a: OperationValue,
    command: OperationCommand,
    b: OperationValue,
];

interface Test {
    readonly denominator: number;
    readonly success: number;
    readonly failure: number;
}

const toInt = (value: string): number => {
    const result = parseInt(value, 10);
    if (Number.isNaN(result)) {
        throw new Error(`Invalid ${value}`);
    }
    return result;
};

const parseStart = (line: string): ReadonlyArray<number> =>
    line.split(", ").map(toInt);

const parseTest = (
    denominatorLine: string,
    successLine: string,
    failureLine: string,
): Test => {
    const denominatorMatch = denominatorLine.match(/^divisible by (\d+)$/);
    const throwPattern = /^throw to monkey (\d+)$/;
    const successMatch = successLine.match(throwPattern);
    const failureMatch = failureLine.match(throwPattern);
    if (
        denominatorMatch === null ||
        successMatch === null ||
        failureMatch === null
    ) {
        throw new Error("Invalid test");
    }
    return {
        denominator: toInt(denominatorMatch[1]),
        success: toInt(successMatch[1]),
        failure: toInt(failureMatch[1]),
    };
};

const OperationValueSchema = z.union([z.literal("old"), IntSchema]);
const OperationCommandSchema = z.enum(["+", "*"]);
const OperationSchema = z.tuple([
    OperationValueSchema,
    OperationCommandSchema,
    OperationValueSchema,
]);

const parseMonkey = (group: string): Monkey => {
    const lines = group.split("\n").map((line) => line.split(":")[1].trim());
    return {
        start: parseStart(lines[1]),
        operation: OperationSchema.parse(lines[2].split(" = ")[1].split(" ")),
        test: parseTest(lines[3], lines[4], lines[5]),
    };
};

const evaluate = (value: number, [a, command, b]: Operation): number => {
    const x = a === "old" ? value : a;
    const y = b === "old" ? value : b;
    return command === "+" ? x + y : x * y;
};

const parse = (input: string): ReadonlyArray<Monkey> =>
    input.trimEnd().split("\n\n").map(parseMonkey);

const track = (
    monkeys: ReadonlyArray<Monkey>,
    limit: number,
    manage: (value: number) => number,
): number => {
    const inventories = Array.from(monkeys, ({ start }) => Array.from(start));
    const counts = Array.from(monkeys, () => 0);
    for (let i = 0; i < limit; i++) {
        for (const [index, inventory] of inventories.entries()) {
            while (inventory.length > 0) {
                const { operation, test } = monkeys[index];
                counts[index]++;
                const item = inventory.shift()!;
                const next = manage(evaluate(item, operation));
                const target =
                    next % test.denominator === 0 ? test.success : test.failure;
                inventories[target].push(next);
            }
        }
    }
    counts.sort((a, b) => b - a);
    return counts[0] * counts[1];
};

const part1 = (monkeys: ReadonlyArray<Monkey>): number =>
    track(monkeys, 20, (value) => Math.floor(value / 3));

const part2 = (monkeys: ReadonlyArray<Monkey>): number => {
    const base = monkeys.reduce(
        (product, { test }) => product * test.denominator,
        1,
    );
    return track(monkeys, 10000, (value) => value % base);
};

main(module, parse, part1, part2);
