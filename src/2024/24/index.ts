import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";

type WireValue = 0 | 1;
const GateOp = { AND: "AND", OR: "OR", XOR: "XOR" } as const;
type GateOp = (typeof GateOp)[keyof typeof GateOp];
interface Gate {
  readonly lhs: string;
  readonly op: GateOp;
  readonly rhs: string;
}

interface Puzzle {
  readonly initial: ReadonlyMap<string, WireValue>;
  readonly gates: ReadonlyMap<string, Gate>;
}

const InitialValueSchema = z
  .string()
  .transform((line) => line.split(": "))
  .pipe(z.tuple([z.string(), IntSchema.pipe(z.union([z.literal(0), z.literal(1)]))]));
const InitialValuesSchema = LinesSchema(InitialValueSchema)
  .refine(
    (pairs) => {
      const keys = new Set<string>();
      for (const [k, _] of pairs) {
        if (keys.has(k)) {
          return false;
        }
        keys.add(k);
      }
      return true;
    },
    { message: "Keys must be unique" },
  )
  .transform((pairs) => new Map(pairs));

const GateSchema = z
  .string()
  .transform((str) => {
    const [lhs, op, rhs] = str.split(" ");
    return { lhs, op, rhs };
  })
  .pipe(
    z.object({
      lhs: z.string(),
      op: z.enum(GateOp),
      rhs: z.string(),
    }),
  );
const GatePairSchema = z
  .string()
  .transform((line) => line.split(" -> "))
  .pipe(z.tuple([GateSchema, z.string()]));
const GatesSchema = LinesSchema(GatePairSchema)
  .refine(
    (pairs) => {
      const keys = new Set<string>();
      for (const [_, k] of pairs) {
        if (keys.has(k)) {
          return false;
        }
        keys.add(k);
      }
      return true;
    },
    { message: "Keys must be unique" },
  )
  .transform((pairs) => new Map(pairs.values().map(([gate, key]) => [key, gate])));
const PuzzleSchema = z
  .string()
  .transform((input) => {
    const [initial, gates] = input.trim().split("\n\n");
    return { initial, gates };
  })
  .pipe(z.object({ initial: InitialValuesSchema, gates: GatesSchema }));

class Circuit {
  readonly #values: Map<string, WireValue>;
  readonly #gates: ReadonlyMap<string, Gate>;

  static #evaluate(op: GateOp, lhs: WireValue, rhs: WireValue): WireValue {
    switch (op) {
      case GateOp.AND:
        return (lhs & rhs) as WireValue;
      case GateOp.OR:
        return (lhs | rhs) as WireValue;
      case GateOp.XOR:
        return (lhs ^ rhs) as WireValue;
    }
  }

  constructor({ initial, gates }: Puzzle) {
    this.#values = new Map(initial);
    this.#gates = gates;
  }

  simulate(): void {
    for (const id of this.#roots()) {
      this.#value(id, new Set());
    }
  }

  #roots(): ReadonlySet<string> {
    const keys = new Set(this.#gates.keys());
    for (const gate of this.#gates.values()) {
      keys.delete(gate.lhs);
      keys.delete(gate.rhs);
    }
    return keys;
  }

  #value(id: string, path: ReadonlySet<string>): WireValue {
    if (this.#values.has(id)) {
      return this.#values.get(id)!;
    }
    if (path.has(id)) {
      throw new Error("Circuit contains a cycle");
    }
    const gate = this.#gates.get(id);
    if (gate === undefined) {
      throw new Error(`Unknown wire: ${id}`);
    }

    const next = new Set(path).add(id);
    this.#values.set(
      id,
      Circuit.#evaluate(gate.op, this.#value(gate.lhs, next), this.#value(gate.rhs, next)),
    );
    return this.#values.get(id)!;
  }

  [Symbol.iterator](): MapIterator<[string, WireValue]> {
    return this.#values.entries();
  }

  entries(): MapIterator<[string, WireValue]> {
    return this.#values.entries();
  }
}

const parse = (input: string): Puzzle => PuzzleSchema.parse(input);

const part1 = (puzzle: Puzzle): number => {
  const circuit = new Circuit(puzzle);
  circuit.simulate();
  const pattern = /^z\d+$/;
  return parseInt(
    circuit
      .entries()
      .filter(([k, _]) => pattern.test(k))
      .toArray()
      .sort(([ak, _], [bk, __]) => bk.localeCompare(ak))
      .map(([_, v]) => v)
      .join(""),
    2,
  );
};

const createConnections = (gates: ReadonlyMap<string, Gate>): ReadonlyMap<string, string> => {
  const inputs = new Map<string, string[]>();
  for (const { lhs, op, rhs } of gates.values()) {
    if (!inputs.has(lhs)) {
      inputs.set(lhs, []);
    }
    if (!inputs.has(rhs)) {
      inputs.set(rhs, []);
    }
    inputs.get(lhs)!.push(op);
    inputs.get(rhs)!.push(op);
  }
  return new Map(inputs.entries().map(([k, v]) => [k, v.sort().join("")]));
};

const part2 = ({ gates }: Puzzle): string => {
  const last = gates
    .keys()
    .filter((k) => k.startsWith("z"))
    .toArray()
    .sort()
    .at(-1)!;
  const prefixes = new Set("xyz");
  const connections = createConnections(gates);
  const wrong = new Set<string>();
  for (const [out, { lhs, op, rhs }] of gates) {
    switch (op) {
      case GateOp.OR: {
        if (connections.get(out) !== "ANDXOR" && out !== last) {
          wrong.add(out);
        }
        break;
      }
      case GateOp.AND: {
        if (connections.get(out) !== "OR" && lhs !== "x00" && rhs !== "x00") {
          wrong.add(out);
        }
        break;
      }
      case GateOp.XOR: {
        if (out.startsWith("z")) {
          break;
        }
        if (
          connections.get(out) !== "ANDXOR" ||
          [lhs, rhs, out].every((k) => !prefixes.has(k[0]))
        ) {
          wrong.add(out);
          break;
        }
        break;
      }
    }
  }
  console.log(wrong.size);
  return Array.from(wrong).sort().join(",");
};

await main(import.meta, parse, part1, part2);
