import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema } from "../../utils/schemas.ts";
import { sum } from "../../common/itertools.ts";
import { equalTo, solve, type Constraint, type Model } from "yalps";

interface Machine {
    readonly target: number;
    readonly buttons: ReadonlyArray<ReadonlySet<number>>;
    readonly joltages: ReadonlyArray<number>;
}

type MachineList = ReadonlyArray<Machine>;

const IntListSchema = z.array(IntSchema);

const unwrap = (chunk: string): string => chunk.slice(1, chunk.length - 1);

const parseList = (chunk: string): ReadonlyArray<number> =>
    IntListSchema.parse(unwrap(chunk).split(","));

const parseBinary = (value: string): number => parseInt(value, 2);

const parseIndicator = (chunk: string): number =>
    parseBinary(chunk.replaceAll(".", "0").replaceAll("#", "1"));

const parseButton = (chunk: string): Set<number> => new Set(parseList(chunk));

const parseMachine = (line: string): Machine => {
    const chunks = line.split(" ");
    const indicator = unwrap(chunks[0]);
    const target = parseIndicator(indicator);
    const buttons = chunks.slice(1, chunks.length - 1).map(parseButton);
    const joltages = parseList(chunks[chunks.length - 1]);
    if (joltages.length !== indicator.length) {
        throw new Error("Mismatched joltages");
    }
    return { target, buttons, joltages };
};

const findTarget = ({ target, buttons, joltages }: Machine): number => {
    const options = new Set(
        buttons
            .values()
            .map((set) =>
                parseBinary(
                    Array.from(joltages, (_, i) =>
                        set.has(i) ? "1" : "0",
                    ).join(""),
                ),
            ),
    );
    const frontier = new Map([[0, 0]]);
    for (const [curr, step] of frontier) {
        let found = false;
        for (const button of options) {
            const next = curr ^ button;
            if (frontier.has(next)) {
                continue;
            }
            frontier.set(next, step + 1);
            if (next === target) {
                found = true;
                break;
            }
        }
        if (found) {
            break;
        }
    }
    const value = frontier.get(target);
    if (value === undefined) {
        throw new Error("Cannot reach target");
    }
    return value;
};

const findJoltage = ({ buttons, joltages }: Machine): number => {
    const model: Model = {
        direction: "minimize",
        objective: "presses",
        constraints: joltages
            .values()
            .map((joltage, index) => [`c${index}`, equalTo(joltage)]),
        variables: buttons.values().map((button, index) => [
            `b${index}`,
            {
                presses: 1,
                ...Object.fromEntries(button.values().map((b) => [`c${b}`, 1])),
            },
        ]),
        integers: true,
    };
    const solution = solve(model);
    if (solution.status !== "optimal") {
        throw new Error("Invalid solution");
    }
    return solution.result;
};

const parse = (input: string): MachineList =>
    input.trim().split("\n").map(parseMachine);

const part1 = (machines: MachineList): number =>
    sum(machines.values().map(findTarget));

const part2 = (machines: MachineList): number =>
    sum(machines.values().map(findJoltage));

await main(import.meta, parse, part1, part2);
