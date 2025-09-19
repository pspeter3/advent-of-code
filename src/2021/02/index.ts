import { z } from "zod";
import { main } from "../../utils/host.ts";
import { LinesSchema, StringSchema } from "../../utils/schemas.ts";

const SubmarineCommand = {
    Forward: "forward",
    Down: "down",
    Up: "up",
} as const;
type SubmarineCommand =
    (typeof SubmarineCommand)[keyof typeof SubmarineCommand];

type SubmarineAction = readonly [command: SubmarineCommand, amount: number];

const schema = LinesSchema(
    z.preprocess(
        (line) => StringSchema.parse(line).split(" "),
        z.tuple([
            z.enum(SubmarineCommand),
            z.preprocess((value) => parseInt(value as string), z.number()),
        ]),
    ),
);

const part1 = (actions: ReadonlyArray<SubmarineAction>): number => {
    const { position, depth } = actions.reduce(
        (state, [command, amount]) => {
            switch (command) {
                case SubmarineCommand.Forward: {
                    state.position += amount;
                    return state;
                }
                case SubmarineCommand.Down: {
                    state.depth += amount;
                    return state;
                }
                case SubmarineCommand.Up: {
                    state.depth -= amount;
                    return state;
                }
            }
        },
        { position: 0, depth: 0 },
    );
    return position * depth;
};

const part2 = (actions: ReadonlyArray<SubmarineAction>): number => {
    const { position, depth } = actions.reduce(
        (state, [command, amount]) => {
            switch (command) {
                case SubmarineCommand.Forward: {
                    state.position += amount;
                    state.depth += amount * state.aim;
                    return state;
                }
                case SubmarineCommand.Down: {
                    state.aim += amount;
                    return state;
                }
                case SubmarineCommand.Up: {
                    state.aim -= amount;
                    return state;
                }
            }
        },
        { position: 0, depth: 0, aim: 0 },
    );
    return position * depth;
};

await main(import.meta, (input) => schema.parse(input), part1, part2);
