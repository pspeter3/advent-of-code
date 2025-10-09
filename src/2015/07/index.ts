import z from "zod";
import { main } from "../../utils/host.ts";
import { LinesSchema } from "../../utils/schemas.ts";

const Command = {
    AND: "AND",
    OR: "OR",
    LSHIFT: "LSHIFT",
    RSHIFT: "RSHIFT",
} as const;

type Command = (typeof Command)[keyof typeof Command];

type InstructionValue = string | number;

type CommandInstruction = readonly [
    a: InstructionValue,
    command: Command,
    b: InstructionValue,
];
type NotInstruction = readonly ["NOT", InstructionValue];
type ValueInstruction = readonly [InstructionValue];

type Instruction = CommandInstruction | NotInstruction | ValueInstruction;
type Circuit = ReadonlyMap<string, Instruction>;

const InstructionValueSchema = z
    .string()
    .transform((value) => (value.match(/^\d+$/) ? parseInt(value, 10) : value));
const CommandInstructionSchema = z.tuple([
    InstructionValueSchema,
    z.enum(Command),
    InstructionValueSchema,
]);
const NotInstructionSchema = z.tuple([
    z.literal("NOT"),
    InstructionValueSchema,
]);
const InstructionSchema = z.union([
    NotInstructionSchema,
    CommandInstructionSchema,
    z.tuple([InstructionValueSchema]),
]);

const InstructionPairSchema = z
    .string()
    .transform((line) => {
        const [instruction, id] = line.split(" -> ");
        return [id, instruction.split(" ")];
    })
    .pipe(z.tuple([z.string(), InstructionSchema]));

const CircuitSchema = LinesSchema(InstructionPairSchema).transform(
    (pairs) => new Map(pairs),
);

const parse = (input: string): Circuit => CircuitSchema.parse(input);

const isValueInstruction = (
    instruction: Instruction,
): instruction is ValueInstruction => instruction.length === 1;

const isNotInstruction = (
    instruction: Instruction,
): instruction is NotInstruction =>
    Array.isArray(instruction) && instruction[0] === "NOT";

class CircuitEmulator {
    readonly #cache: Map<string, number> = new Map();
    readonly #circuit: Circuit;

    constructor(circuit: Circuit) {
        this.#circuit = circuit;
    }

    evaluate(id: string): number {
        if (this.#cache.has(id)) {
            return this.#cache.get(id)!;
        }
        const instruction = this.#circuit.get(id);
        if (instruction === undefined) {
            throw new Error(`Unknown wire: ${id}`);
        }
        const result = this.#resolve(instruction) & 0xffff;
        this.#cache.set(id, result);
        return result;
    }

    #resolve(instruction: Instruction): number {
        if (isValueInstruction(instruction)) {
            const value = instruction[0];
            if (typeof value === "number") {
                return value;
            }
            return this.evaluate(value);
        }
        if (isNotInstruction(instruction)) {
            const value = instruction[1];
            if (typeof value === "number") {
                return ~value;
            }
            return ~this.evaluate(value);
        }
        const [a, command, b] = instruction;
        const aValue = typeof a === "number" ? a : this.evaluate(a);
        const bValue = typeof b === "number" ? b : this.evaluate(b);
        switch (command) {
            case Command.AND:
                return aValue & bValue;
            case Command.OR:
                return aValue | bValue;
            case Command.LSHIFT:
                return aValue << bValue;
            case Command.RSHIFT:
                return aValue >> bValue;
        }
    }

    set(id: string, value: number): void {
        this.#cache.set(id, value);
    }
}

const part1 = (circuit: Circuit): number =>
    new CircuitEmulator(circuit).evaluate(circuit.size === 8 ? "i" : "a");

const part2 = (circuit: Circuit): number => {
    const emulator = new CircuitEmulator(circuit);
    emulator.set("b", 956);
    return emulator.evaluate(circuit.size === 8 ? "i" : "a");
};

await main(import.meta, parse, part1, part2);
