import { z } from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";

const RESOURCES = ["ore", "clay", "obsidian", "geode"] as const;
const Resource = z.enum(RESOURCES);
type Resource = z.infer<typeof Resource>;

type ResourceMap = ReadonlyMap<Resource, number>;

interface Blueprint {
  readonly ore: ResourceMap;
  readonly clay: ResourceMap;
  readonly obsidian: ResourceMap;
  readonly geode: ResourceMap;
}

const BlueprintSchema = z.object({
  ore: z.map(z.literal("ore"), IntSchema),
  clay: z.map(z.literal("ore"), IntSchema),
  obsidian: z.map(z.union([z.literal("ore"), z.literal("clay")]), IntSchema),
  geode: z.map(z.union([z.literal("ore"), z.literal("obsidian")]), IntSchema),
});

const schema = LinesSchema(
  z
    .string()
    .transform((line) =>
      Object.fromEntries(
        line
          .split(": ")[1]
          .split(". ")
          .map((part) => {
            const match = part.trim().match(/^Each (.+) robot costs (.+?)\.?$/);
            if (match === null) {
              console.log(part);
              throw new Error("Invalid match");
            }
            return [
              match[1],
              new Map(
                match[2].split(" and ").map((cost) => {
                  const [amount, resource] = cost.split(" ");
                  return [resource, amount];
                }),
              ),
            ];
          }),
      ),
    )
    .pipe(BlueprintSchema),
);

const get = (resources: ResourceMap, resource: Resource): number => resources.get(resource) ?? 0;

const canBuild = (stores: ResourceMap, cost: ResourceMap): boolean => {
  for (const [key, amount] of cost) {
    if (get(stores, key) < amount) {
      return false;
    }
  }
  return true;
};

const build = (robots: ResourceMap, target: Resource): ResourceMap => {
  const result = new Map(robots);
  result.set(target, get(robots, target) + 1);
  return result;
};

const harvest = (
  next: number,
  robots: ResourceMap,
  stores: ResourceMap,
  limits: ResourceMap,
  costs?: ResourceMap,
) =>
  new Map(
    RESOURCES.map((resource) => {
      const cost = costs?.get(resource) ?? 0;
      let value = get(robots, resource) + get(stores, resource) - cost;
      const limit = limits.get(resource);
      if (limit !== undefined) {
        value = Math.min(limit * next, value);
      }
      return [resource, value];
    }),
  );

class Context {
  readonly blueprint: Blueprint;
  readonly limits: ResourceMap;
  readonly #duration: number;
  readonly #caches: ReadonlyArray<Map<string, number>>;
  #max: number;

  static toKey(robots: ResourceMap, stores: ResourceMap): string {
    const values: number[] = [];
    for (const resource of RESOURCES) {
      values.push(get(robots, resource), get(stores, resource));
    }
    return values.join(",");
  }

  private static limits(blueprint: Blueprint): ResourceMap {
    const limits = new Map<Resource, number>();
    for (const resource of RESOURCES) {
      for (const [key, amount] of blueprint[resource]) {
        limits.set(key, Math.max(limits.get(key) ?? 0, amount));
      }
    }
    return limits;
  }

  constructor(blueprint: Blueprint, duration: number) {
    this.blueprint = blueprint;
    this.limits = Context.limits(this.blueprint);
    this.#duration = duration;
    this.#caches = Array.from({ length: this.#duration }, () => new Map());
    this.#max = -Infinity;
  }

  cost(resource: Resource): ResourceMap {
    return this.blueprint[resource];
  }

  limit(resource: Resource): number {
    return this.limits.get(resource) ?? Infinity;
  }

  value(time: number, key: string): number | undefined {
    return this.#caches[this.#duration - time].get(key);
  }

  record(time: number, key: string, value: number): number {
    this.#caches[this.#duration - time].set(key, value);
    this.#max = Math.max(this.#max, value);
    return value;
  }

  get max(): number {
    return this.#max;
  }
}

const triangle = (n: number) => 0.5 * n * (n + 1);

const search = (ctx: Context, time: number, robots: ResourceMap, stores: ResourceMap): number => {
  const geodes = get(stores, Resource.enum.geode);
  if (time === 0) {
    return geodes;
  }
  const key = Context.toKey(robots, stores);
  const cached = ctx.value(time, key);
  if (cached !== undefined) {
    return cached;
  }
  let result = geodes;
  const next = time - 1;
  for (const resource of RESOURCES) {
    if (!canBuild(stores, ctx.cost(resource))) {
      continue;
    }
    if (get(robots, resource) >= ctx.limit(resource)) {
      continue;
    }
    if (resource === Resource.enum.geode) {
      const bots = get(robots, Resource.enum.geode);
      if (geodes + time * bots + triangle(time) <= ctx.max) {
        continue;
      }
    }
    result = Math.max(
      result,
      search(
        ctx,
        next,
        build(robots, resource),
        harvest(next, robots, stores, ctx.limits, ctx.cost(resource)),
      ),
    );
  }
  result = Math.max(result, search(ctx, next, robots, harvest(next, robots, stores, ctx.limits)));
  return ctx.record(time, key, result);
};

const parse = (input: string): ReadonlyArray<Blueprint> => schema.parse(input);

const part1 = (blueprints: ReadonlyArray<Blueprint>): number => {
  const duration = 24;
  const robots: ResourceMap = new Map([[Resource.enum.ore, 1]]);
  const stores: ResourceMap = new Map();
  return blueprints.reduce((sum, blueprint, index) => {
    const id = index + 1;
    console.group(`Blueprint ${id}`);
    console.time("Search");
    const result = search(new Context(blueprint, duration), duration, robots, stores);
    console.timeEnd("Search");
    console.log(result);
    console.groupEnd();
    return sum + id * result;
  }, 0);
};

const part2 = (blueprints: ReadonlyArray<Blueprint>): number => {
  const duration = 32;
  const robots: ResourceMap = new Map([[Resource.enum.ore, 1]]);
  const stores: ResourceMap = new Map();
  const scores = blueprints.slice(0, 3).map((blueprint, index) => {
    const id = index + 1;
    console.group(`Blueprint ${id}`);
    console.time("Search");
    const result = search(new Context(blueprint, duration), duration, robots, stores);
    console.timeEnd("Search");
    console.log(result);
    console.groupEnd();
    return result;
  });
  return scores.reduce((acc, score) => acc * score);
};

await main(import.meta, parse, part1, part2);
