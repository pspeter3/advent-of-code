import { z } from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema, StringSchema } from "../../utils/schemas.ts";

const VariableSchema = z.enum(["w", "x", "y", "z"]);
const InstructionSchema = z.enum(["add", "mul", "div", "mod", "eql"]);
const InputSchema = z.tuple([z.literal("inp"), VariableSchema]);
const LogicSchema = z.tuple([
  InstructionSchema,
  VariableSchema,
  z.union([VariableSchema, IntSchema]),
]);
const CommandSchema = z.union([InputSchema, LogicSchema]);

type InputCommand = z.infer<typeof InputSchema>;
type Command = z.infer<typeof CommandSchema>;

const isInput = (command: Command): command is InputCommand => command[0] === "inp";

const schema = LinesSchema(
  z.preprocess((line) => StringSchema.parse(line).trim().split(" "), CommandSchema),
);

const groupBy = (
  commands: ReadonlyArray<Command>,
  isGroup: (command: Command) => boolean,
): ReadonlyArray<ReadonlyArray<Command>> => {
  const groups: Command[][] = [];
  for (const command of commands) {
    if (isGroup(command)) {
      groups.push([]);
    }
    groups[groups.length - 1].push(command);
  }
  return groups;
};

type Group = readonly [a: number, b: number, c: number];

const scan = (commands: ReadonlyArray<Command>, a: number, b: number): number => {
  const groups = groupBy(commands, isInput).map(
    (group) => [group[4][2], group[5][2], group[15][2]] as Group,
  );
  const deps = new Map<number, number>();
  const stack: number[] = [];
  for (const [index, group] of groups.entries()) {
    switch (group[0]) {
      case 1: {
        stack.push(index);
        break;
      }
      case 26: {
        const input = stack.pop();
        if (input === undefined) {
          throw new Error("Invalid stack");
        }
        deps.set(input, index);
        break;
      }
      default: {
        throw new Error("Invalid command");
      }
    }
  }
  const digits = Array.from({ length: 14 }, () => -1);
  const keys = Array.from(deps.keys()).sort();
  const sign = Math.sign(b - a);
  for (const key of keys) {
    const next = deps.get(key)!;
    for (let i = a; i !== b + sign; i += sign) {
      const value = i + groups[key][2] + groups[next][1];
      if (1 <= value && value <= 9) {
        digits[key] = i;
        digits[next] = value;
        break;
      }
    }
  }
  return parseInt(digits.join(""));
};

const part1 = (commands: ReadonlyArray<Command>): number => scan(commands, 9, 1);

const part2 = (commands: ReadonlyArray<Command>): number => scan(commands, 1, 9);

await main(import.meta, (input) => schema.parse(input), part1, part2);
