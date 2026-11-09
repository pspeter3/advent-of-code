import { z } from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, StringSchema } from "../../utils/schemas.ts";

type Draws = ReadonlyArray<number>;
type Board = ReadonlyArray<ReadonlyArray<number>>;
type MarkedBoard = ReadonlyArray<ReadonlyArray<boolean>>;

interface Bingo {
  readonly draws: Draws;
  readonly boards: ReadonlyArray<Board>;
}

const schema = z.preprocess(
  (input) => {
    const groups = StringSchema.parse(input).trim().split("\n\n");
    return { draws: groups[0], boards: groups.slice(1) };
  },
  z.object({
    draws: z.preprocess((line) => StringSchema.parse(line).split(","), z.array(IntSchema)),
    boards: z.array(
      z.preprocess(
        (lines) => StringSchema.parse(lines).split("\n"),
        z.array(
          z.preprocess((line) => StringSchema.parse(line).trim().split(/\s+/), z.array(IntSchema)),
        ),
      ),
    ),
  }),
);

const mark = (draws: ReadonlySet<number>, board: Board): MarkedBoard =>
  board.map((row) => row.map((value) => draws.has(value)));

const isBingo = (marked: MarkedBoard): boolean => {
  const size = marked.length;
  for (let i = 0; i < size; i++) {
    let row = true;
    let col = true;
    for (let j = 0; j < size; j++) {
      row = row && marked[i][j];
      col = col && marked[j][i];
    }
    if (row || col) {
      return true;
    }
  }
  return false;
};

const score = (draw: number, board: Board, marked: MarkedBoard): number =>
  board.reduce(
    (sum, cells, row) => cells.reduce((sum, cell, col) => sum + (marked[row][col] ? 0 : cell), sum),
    0,
  ) * draw;

const part1 = ({ draws, boards }: Bingo): number | null => {
  for (let draw = 1; draw <= draws.length; draw++) {
    const candidates = new Set(draws.slice(0, draw));
    for (const board of boards) {
      const marked = mark(candidates, board);
      if (isBingo(marked)) {
        return score(draws[draw - 1], board, marked);
      }
    }
  }
  return null;
};

const part2 = ({ draws, boards }: Bingo): number | null => {
  let options = boards;
  for (let draw = 1; draw <= draws.length; draw++) {
    const candidates = new Set(draws.slice(0, draw));
    if (options.length === 1) {
      const board = options[0];
      const marked = mark(candidates, board);
      if (isBingo(marked)) {
        return score(draws[draw - 1], board, marked);
      }
    }
    options = options.filter((board) => !isBingo(mark(candidates, board)));
  }
  return null;
};

await main(import.meta, (input) => schema.parse(input), part1, part2);
