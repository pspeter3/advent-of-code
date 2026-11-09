import { sum } from "../../common/itertools.ts";
import { main } from "../../utils/host.ts";

type Battery = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type BatteryBank = ReadonlyArray<Battery>;
type BatteryBankList = ReadonlyArray<BatteryBank>;

function assertBattery(value: number): asserts value is Battery {
  if (value < 1 || value > 9 || !Number.isInteger(value)) {
    throw new Error(`Invalid battery ${value}`);
  }
}

function toBattery(char: string): Battery {
  const value = parseInt(char, 10);
  assertBattery(value);
  return value;
}

function findMaxBatteryInRange(bank: BatteryBank, start: number, end: number): number {
  let max = 0;
  let index = -1;
  for (let i = start; i < end; i++) {
    const battery = bank[i];
    if (battery > max) {
      max = battery;
      index = i;
    }
  }
  if (index === -1) {
    throw new Error("No battery found");
  }
  return index;
}

function findJolts(bank: BatteryBank, digits: number): number {
  const batteries: Battery[] = [];
  let curr = 0;
  for (let i = 1; i <= digits; i++) {
    const index = findMaxBatteryInRange(bank, curr, bank.length - (digits - i));
    curr = index + 1;
    batteries.push(bank[index]);
  }
  return batteries.reduce(
    (result, battery, index) => result + battery * Math.pow(10, digits - index - 1),
    0,
  );
}

const solve = (list: BatteryBankList, digits: number): number =>
  sum(list.values().map((bank) => findJolts(bank, digits)));

const parse = (input: string): BatteryBankList =>
  input
    .trim()
    .split("\n")
    .map((line) => line.split("").map(toBattery));

const part1 = (list: BatteryBankList): number => solve(list, 2);

const part2 = (list: BatteryBankList): number => solve(list, 12);

await main(import.meta, parse, part1, part2);
