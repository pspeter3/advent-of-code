import { main } from "../../utils/host.ts";

const parse = (input: string): ReadonlyArray<string> => input.trim().split("\n");

const part1 = (input: ReadonlyArray<string>): number => {
  let code = 0;
  let memory = 0;
  for (const line of input) {
    code += line.length;
    memory += eval(line).length;
  }
  return code - memory;
};

const part2 = (input: ReadonlyArray<string>): number => {
  let encoded = 0;
  let original = 0;
  for (const line of input) {
    original += line.length;
    encoded += JSON.stringify(line).length;
  }
  return encoded - original;
};

await main(import.meta, parse, part1, part2);
