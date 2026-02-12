import z from "zod";
import { main } from "../../utils/host.ts";
import { LinesSchema } from "../../utils/schemas.ts";

interface Galaxy {
  readonly q: number;
  readonly r: number;
}

type GalaxyList = ReadonlyArray<Galaxy>;

interface Cosmos {
  readonly cols: number;
  readonly rows: number;
  readonly galaxies: GalaxyList;
}

const LineSchema = z
  .string()
  .transform((line) => line.split(""))
  .pipe(z.array(z.enum([".", "#"])));
const CosmosSchema = LinesSchema(LineSchema).transform((grid) => {
  const rows = grid.length;
  const cols = grid[0].length;
  const galaxies: Galaxy[] = [];
  for (const [r, row] of grid.entries()) {
    for (const [q, tile] of row.entries()) {
      if (tile === ".") {
        continue;
      }
      galaxies.push({ q, r });
    }
  }
  return { cols, rows, galaxies };
});

function expandCosmos(cosmos: Cosmos, scalar: number): Cosmos {
  const s = scalar - 1;
  const galaxyCols = new Set<number>();
  const galaxyRows = new Set<number>();
  for (const galaxy of cosmos.galaxies) {
    galaxyCols.add(galaxy.q);
    galaxyRows.add(galaxy.r);
  }
  const emptyCols = Array.from({ length: cosmos.cols }, (_, i) => i).filter(
    (i) => !galaxyCols.has(i),
  );
  const emptyRows = Array.from({ length: cosmos.rows }, (_, i) => i).filter(
    (i) => !galaxyRows.has(i),
  );
  const cols = cosmos.cols + emptyCols.length * s;
  const rows = cosmos.rows + emptyRows.length * s;
  const galaxies = cosmos.galaxies.map((galaxy) => {
    const q = galaxy.q + emptyCols.filter((q) => q < galaxy.q).length * s;
    const r = galaxy.r + emptyRows.filter((r) => r < galaxy.r).length * s;
    return { q, r };
  });
  return { cols, rows, galaxies };
}

function distance(a: Galaxy, b: Galaxy): number {
  return Math.abs(a.q - b.q) + Math.abs(a.r - b.r);
}

function sumDistances({ galaxies }: Cosmos): number {
  let sum = 0;
  const size = galaxies.length;
  for (let i = 0; i < size; i++) {
    for (let j = i + 1; j < size; j++) {
      sum += distance(galaxies[i], galaxies[j]);
    }
  }
  return sum;
}

const parse = (input: string): Cosmos => CosmosSchema.parse(input);

const part1 = (cosmos: Cosmos): number => sumDistances(expandCosmos(cosmos, 2));

const part2 = (cosmos: Cosmos): number => sumDistances(expandCosmos(cosmos, 1_000_000));

await main(import.meta, parse, part1, part2);
