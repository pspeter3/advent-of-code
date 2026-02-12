import { z } from "zod";
import { main } from "../../utils/host.ts";
import { LinesSchema } from "../../utils/schemas.ts";

const schema = LinesSchema(
  z
    .string()
    .transform((line) => line.split(""))
    .pipe(z.array(z.string())),
);

const intersection = (a: ReadonlySet<string>, b: ReadonlySet<string>): ReadonlySet<string> => {
  const source = a.size < b.size ? a : b;
  const target = a.size < b.size ? b : a;
  const result = new Set<string>();
  for (const letter of source) {
    if (target.has(letter)) {
      result.add(letter);
    }
  }
  return result;
};

type Rucksack = ReadonlyArray<string>;

const score = (letter: string): number => {
  if (letter.length !== 1) {
    throw new Error(`Invalid letter ${letter}`);
  }
  const isUpperCase = letter.toUpperCase() === letter;
  const base = isUpperCase ? 65 : 97;
  const offset = isUpperCase ? 27 : 1;
  return letter.charCodeAt(0) - base + offset;
};

const part1 = (rucksacks: ReadonlyArray<Rucksack>): number =>
  rucksacks.reduce((sum, rucksack) => {
    const split = Math.floor(rucksack.length / 2);
    const items = intersection(new Set(rucksack.slice(0, split)), new Set(rucksack.slice(split)));
    for (const letter of items) {
      sum += score(letter);
    }
    return sum;
  }, 0);

const part2 = (input: ReadonlyArray<Rucksack>): number => {
  let result = 0;
  const delta = 3;
  for (let i = 0; i < input.length; i += delta) {
    const items = input
      .slice(i, i + delta)
      .map((letters) => new Set(letters) as ReadonlySet<string>)
      .reduce((a, b) => intersection(a, b));
    for (const letter of items) {
      result += score(letter);
    }
  }
  return result;
};

await main(import.meta, (input) => schema.parse(input), part1, part2);
