import { z } from "zod";
import { main } from "../../utils/host";

enum SubmarineCommand {
    Forward = "forward",
    Down = "down",
    Up = "up",
}

interface SubmarineAction {
    readonly command: SubmarineCommand;
    readonly amount: number;
}

const schema = z.tuple([
    z.nativeEnum(SubmarineCommand),
    z.preprocess((value) => parseInt(value as string), z.number()),
]);

const setup = (input: string): ReadonlyArray<SubmarineAction> =>
    input.split("\n").map((line) => {
        const [command, amount] = schema.parse(line.split(" "));
        return { command, amount };
    });

const part1 = (actions: ReadonlyArray<SubmarineAction>): number => {
    const { position, depth } = actions.reduce(
        (state, { command, amount }) => {
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
        { position: 0, depth: 0 }
    );
    return position * depth;
};

const part2 = (actions: ReadonlyArray<SubmarineAction>): number => {
    const { position, depth } = actions.reduce(
        (state, { command, amount }) => {
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
        { position: 0, depth: 0, aim: 0 }
    );
    return position * depth;
};

main(module, { setup, part1, part2 });
