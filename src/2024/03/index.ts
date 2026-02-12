import { sum } from "../../common/itertools.ts";
import { main } from "../../utils/host.ts";

const parse = (input: string): string => input.trim();

const part1 = (input: string): number => {
  const match = input.match(/mul\((\d{1,3}),(\d{1,3})\)/g);
  if (match === null) {
    return 0;
  }
  return sum(
    match.values().map((m) => {
      const [, a, b] = m.match(/mul\((\d{1,3}),(\d{1,3})\)/)!;
      return parseInt(a, 10) * parseInt(b, 10);
    }),
  );
};

const part2 = (input: string): number => {
  const match = input.match(/do\(\)|don't\(\)|mul\((\d{1,3}),(\d{1,3})\)/g);
  if (match === null) {
    return 0;
  }
  let enabled = true;
  let result = 0;
  for (const m of match) {
    switch (m) {
      case "do()": {
        enabled = true;
        break;
      }
      case "don't()": {
        enabled = false;
        break;
      }
      default: {
        if (enabled) {
          const [, a, b] = m.match(/mul\((\d{1,3}),(\d{1,3})\)/)!;
          result += parseInt(a, 10) * parseInt(b, 10);
        }
      }
    }
  }
  return result;
};

await main(import.meta, parse, part1, part2);
