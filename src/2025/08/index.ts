import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema } from "../../utils/schemas.ts";

type Vector3DTuple = readonly [x: number, y: number, z: number];
const Vector3DTupleSchema = z.tuple([IntSchema, IntSchema, IntSchema]);

type BoxMap = ReadonlyMap<string, Vector3DTuple>;

type BoxPair = readonly [a: string, b: string];

const parse = (input: string): BoxMap =>
  new Map(
    input
      .trim()
      .split("\n")
      .values()
      .map((key) => [key, Vector3DTupleSchema.parse(key.split(","))]),
  );

function* shortestDistances(boxes: BoxMap): Generator<BoxPair> {
  const distances: Array<Readonly<{ pair: BoxPair; d: number }>> = [];
  const keys = Array.from(boxes.keys());
  for (let i = 0; i < keys.length; i++) {
    const a = keys[i];
    const iv = boxes.get(a)!;
    for (let j = i + 1; j < keys.length; j++) {
      const b = keys[j];
      const jv = boxes.get(b)!;
      const d = Math.hypot(...iv.map((v, k) => v - jv[k]));
      distances.push({ pair: [a, b], d });
    }
  }
  distances.sort((a, b) => a.d - b.d);
  for (const { pair } of distances) {
    yield pair;
  }
}

const part1 = (boxes: BoxMap): number => {
  let circuits = new Set(boxes.keys().map((key) => new Set([key])));
  for (const pair of shortestDistances(boxes).take(boxes.size === 20 ? 10 : 1000)) {
    const parts = pair.map((k) => {
      const c = circuits.values().find((s) => s.has(k));
      if (c === undefined) {
        throw new Error(`Could not find circuit for ${k}`);
      }
      return c;
    }) as [Set<string>, Set<string>];
    for (const circuit of parts) {
      circuits.delete(circuit);
    }
    const [a, b] = parts;
    circuits.add(a.union(b));
  }
  return Array.from(circuits)
    .sort((a, b) => b.size - a.size)
    .values()
    .take(3)
    .reduce((a, e) => a * e.size, 1);
};

const part2 = (boxes: BoxMap): number => {
  let circuits = new Set(boxes.keys().map((key) => new Set([key])));
  for (const pair of shortestDistances(boxes)) {
    const parts = pair.map((k) => {
      const c = circuits.values().find((s) => s.has(k));
      if (c === undefined) {
        throw new Error(`Could not find circuit for ${k}`);
      }
      return c;
    }) as [Set<string>, Set<string>];
    for (const circuit of parts) {
      circuits.delete(circuit);
    }
    const [a, b] = parts;
    circuits.add(a.union(b));
    if (circuits.size === 1) {
      return pair
        .values()
        .map((k) => boxes.get(k)![0])
        .reduce((a, e) => a * e);
    }
  }
  throw new Error("Could not connect circuit");
};

await main(import.meta, parse, part1, part2);
