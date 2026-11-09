import { z } from "zod";
import { main } from "../../utils/host.ts";

const ValveSchema = z.object({
  label: z.string(),
  rate: z.coerce.number(),
  tunnels: z
    .string()
    .transform((values) => values.split(", "))
    .pipe(z.array(z.string()))
    .transform((valves) => new Set(valves)),
});

interface Valve {
  readonly label: string;
  readonly rate: number;
  readonly tunnels: ReadonlySet<string>;
}

type ValveMap = ReadonlyMap<string, Valve>;
type ValveGraph = ReadonlyMap<string, ReadonlyMap<string, number>>;

interface Network {
  readonly valves: ValveMap;
  readonly graph: ValveGraph;
}

const distance = (valves: ValveMap, source: string, target: string): number => {
  const frontier = [source];
  const costs = new Map([[source, 0]]);
  while (frontier.length > 0) {
    const label = frontier.shift()!;
    const valve = valves.get(label)!;
    const cost = costs.get(label)!;
    if (label === target) {
      return cost;
    }
    for (const v of valve.tunnels) {
      if (!costs.has(v)) {
        frontier.push(v);
        costs.set(v, Infinity);
      }
      costs.set(v, Math.min(costs.get(v)!, cost + 1));
    }
  }
  throw new Error(`Could not find ${target} from ${source}`);
};

const toGraph = (valves: ValveMap, start: string): ValveGraph => {
  const result = new Map<string, Map<string, number>>([[start, new Map()]]);
  for (const valve of valves.values()) {
    if (valve.rate === 0) {
      continue;
    }
    result.set(valve.label, new Map());
  }
  const keys = Array.from(result.keys());
  for (const [i, source] of keys.entries()) {
    for (let j = i + 1; j < keys.length; j++) {
      const target = keys[j];
      const d = distance(valves, source, target);
      result.get(source)!.set(target, d);
      result.get(target)!.set(source, d);
    }
  }
  return result;
};
const parse = (input: string): Network => {
  const valves = new Map(
    input
      .trim()
      .split("\n")
      .map((line) => {
        const match = line.match(
          /^Valve (\w+) has flow rate=(\d+); tunnels? leads? to valves? (.+)$/,
        );
        if (match === null) {
          throw new Error("Line does not match");
        }
        const valve = ValveSchema.parse({
          label: match[1],
          rate: match[2],
          tunnels: match[3],
        });
        return [valve.label, valve];
      }),
  );
  const graph = toGraph(valves, "AA");
  return { valves, graph };
};

const traverse = (
  network: Network,
  limit: number,
  label: string,
  minute: number,
  open: ReadonlySet<string>,
): number => {
  const { valves, graph } = network;
  const opened = new Set(open);
  opened.add(label);
  const valve = valves.get(label)!;
  const flow = (limit - minute) * valve.rate;
  let max = 0;
  for (const [v, time] of graph.get(label)!) {
    const next = minute + time + 1;
    if (next >= limit || open.has(v)) {
      continue;
    }
    max = Math.max(max, traverse(network, limit, v, next, opened));
  }
  return flow + max;
};

type Arrival = readonly [label: string, arrive: number];
type Team = readonly [a: Arrival, b: Arrival];

const doubleTraverse = (
  network: Network,
  limit: number,
  team: Team,
  minute: number,
  open: ReadonlySet<string>,
): number => {
  const { valves, graph } = network;
  const arriving = team.filter(([_, arrive]) => arrive === minute).map(([label, _]) => label);
  if (arriving.length === 0) {
    throw new Error("No arriving team members");
  }
  const opened = new Set(open);
  let flow = 0;
  for (const label of arriving) {
    opened.add(label);
    flow += (limit - minute) * valves.get(label)!.rate;
  }
  let max = 0;
  if (arriving.length === 2) {
    const loop = new Set();
    for (const [a, aTime] of graph.get(arriving[0])!) {
      const aNext = minute + aTime + 1;
      if (aNext >= limit || opened.has(a)) {
        continue;
      }
      loop.add(a);
      for (const [b, bTime] of graph.get(arriving[1])!) {
        const bNext = minute + bTime + 1;
        if (bNext >= limit || opened.has(b) || loop.has(b)) {
          continue;
        }
        max = Math.max(
          max,
          doubleTraverse(
            network,
            limit,
            [
              [a, aNext],
              [b, bNext],
            ],
            Math.min(aNext, bNext),
            opened,
          ),
        );
      }
    }
  } else {
    const current = arriving[0];
    const transit = team.find(([label, _]) => label !== current)!;
    const [label, arrive] = transit;
    let count = 0;
    for (const [v, time] of graph.get(current)!) {
      const next = minute + time + 1;
      if (next >= limit || opened.has(v) || v === label) {
        continue;
      }
      count++;
      max = Math.max(
        max,
        doubleTraverse(network, limit, [[v, next], transit], Math.min(next, arrive), opened),
      );
    }
    if (count === 0) {
      max = (limit - arrive) * valves.get(label)!.rate;
    }
  }
  return flow + max;
};

const part1 = (network: Network): number => traverse(network, 30, "AA", 0, new Set());

const part2 = (network: Network): number =>
  doubleTraverse(
    network,
    26,
    [
      ["AA", 0],
      ["AA", 0],
    ],
    0,
    new Set(),
  );

await main(import.meta, parse, part1, part2);
