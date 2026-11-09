import { main } from "../../utils/host.ts";
import { enumerate, sum } from "../../common/itertools.ts";
import { NumberRange } from "../../common/number-range.ts";

const Operation = {
  Add: "+",
  Mul: "*",
} as const;
type Operation = (typeof Operation)[keyof typeof Operation];

type IntList = ReadonlyArray<string>;
type IntMatrix = ReadonlyArray<IntList>;
type OperationList = ReadonlyArray<Operation>;

interface Worksheet {
  readonly values: IntMatrix;
  readonly operations: OperationList;
}

const isOperation = (char: string): char is Operation => char === "+" || char === "*";

const parse = (input: string): Worksheet => {
  const lines = input.split("\n");
  const values: string[][] = [];
  const last = lines.length - 1;
  const operations: Operation[] = [];
  const ranges: NumberRange[] = [];
  let curr: number | null = null;
  for (const [index, char] of enumerate(lines[last])) {
    if (isOperation(char)) {
      if (curr !== null) {
        ranges.push(new NumberRange(curr, index - 1));
      }
      operations.push(char);
      curr = index;
    }
  }
  if (curr === null) {
    throw new Error("No operations found");
  }
  ranges.push(new NumberRange(curr, lines[last].length + 1));
  for (let r = 0; r < last; r++) {
    const row: string[] = [];
    const line = lines[r];
    for (const range of ranges) {
      row.push(line.slice(range.min, range.max));
    }
    values.push(row);
  }
  return { values, operations };
};

type OperationEvaluator = (a: number, b: number) => number;
const add: OperationEvaluator = (a, b) => a + b;
const mul: OperationEvaluator = (a, b) => a * b;
const toEvaluator = (op: Operation): OperationEvaluator => (op === Operation.Add ? add : mul);

function* column(values: IntMatrix, q: number): Generator<number> {
  for (let r = 0; r < values.length; r++) {
    yield parseInt(values[r][q].trim(), 10);
  }
}

function* cephalopod(values: IntMatrix, q: number): Generator<number> {
  const col = Array.from(values, (row) => row[q]);
  const maxLength = col[0].length;
  for (let i = maxLength - 1; i >= 0; i--) {
    const digits = col
      .map((row) => row[i])
      .join("")
      .trimEnd()
      .replaceAll(" ", "0");
    const value = parseInt(digits, 10);
    yield value;
  }
}

type ColumnGenerator = (values: IntMatrix, q: number) => Generator<number>;

const solve = ({ values, operations }: Worksheet, col: ColumnGenerator): number =>
  sum(operations.entries().map(([index, op]) => col(values, index).reduce(toEvaluator(op))));

const part1 = (worksheet: Worksheet): number => solve(worksheet, column);

const part2 = (worksheet: Worksheet): number => solve(worksheet, cephalopod);

await main(import.meta, parse, part1, part2);
