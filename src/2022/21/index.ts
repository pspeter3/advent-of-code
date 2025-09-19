import { z } from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";

const Operation = { Add: "+", Sub: "-", Mul: "*", Div: "/" } as const;
type Operation = (typeof Operation)[keyof typeof Operation];

const ExpressionSchema = z
    .string()
    .transform((text) => text.trim().split(" "))
    .pipe(z.tuple([z.string(), z.enum(Operation), z.string()]));

type Expression = readonly [lhs: string, op: Operation, rhs: string];

type Job = number | Expression;

type MonkeyMap = ReadonlyMap<string, Job>;

const schema = LinesSchema(
    z
        .string()
        .transform((line) => line.split(":"))
        .pipe(z.tuple([z.string(), z.union([IntSchema, ExpressionSchema])])),
).transform((pairs) => new Map(pairs));

const parse = (input: string): MonkeyMap => schema.parse(input);

const expr = (l: number, op: Operation, r: number): number => {
    switch (op) {
        case Operation.Add: {
            return l + r;
        }
        case Operation.Sub: {
            return l - r;
        }
        case Operation.Mul: {
            return l * r;
        }
        case Operation.Div: {
            return l / r;
        }
    }
};

interface Context<T> {
    readonly monkeys: MonkeyMap;
    readonly cache: Map<string, T>;
}

const evaluate = (ctx: Context<number>, key: string): number => {
    const { monkeys, cache } = ctx;
    const cached = cache.get(key);
    if (cached !== undefined) {
        return cached;
    }
    const job = monkeys.get(key);
    if (job === undefined) {
        throw new Error(`Invalid monkey ${key}`);
    }
    if (typeof job === "number") {
        cache.set(key, job);
        return job;
    }
    const [lhs, op, rhs] = job;
    const l = evaluate(ctx, lhs);
    const r = evaluate(ctx, rhs);
    const result = expr(l, op, r);
    cache.set(key, result);
    return result;
};

const dependency = (ctx: Context<boolean>, key: string): boolean => {
    const { monkeys, cache } = ctx;
    const cached = cache.get(key);
    if (cached !== undefined) {
        return cached;
    }
    const job = monkeys.get(key);
    if (job === undefined) {
        throw new Error(`Invalid monkey ${key}`);
    }
    if (key === "humn") {
        cache.set(key, true);
        return true;
    }
    if (typeof job === "number") {
        cache.set(key, false);
        return false;
    }
    const [lhs, _, rhs] = job;
    const result = dependency(ctx, lhs) || dependency(ctx, rhs);
    cache.set(key, result);
    return result;
};

const invert = (
    target: number,
    op: Operation,
    known: number,
    leftX: boolean,
): number => {
    switch (op) {
        case Operation.Add: {
            return target - known;
        }
        case Operation.Sub: {
            return leftX ? target + known : known - target;
        }
        case Operation.Mul: {
            return target / known;
        }
        case Operation.Div: {
            return leftX ? target * known : target / known;
        }
    }
};

const search = (
    dc: Context<boolean>,
    ec: Context<number>,
    key: string,
    target: number,
): number => {
    const job = dc.monkeys.get(key);
    if (job === undefined) {
        throw new Error(`Invalid monkey ${key}`);
    }
    if (key === "humn") {
        return target;
    }
    if (typeof job === "number") {
        throw new Error(`Reached literal ${key}`);
    }
    const [lhs, op, rhs] = job;
    const l = dependency(dc, lhs);
    const r = dependency(dc, rhs);
    if (l && r) {
        throw new Error(`Invalid pair`);
    }
    const known = l ? evaluate(ec, rhs) : evaluate(ec, lhs);
    const next = invert(target, op, known, l);
    return search(dc, ec, l ? lhs : rhs, next);
};

const part1 = (monkeys: MonkeyMap): number =>
    evaluate({ monkeys, cache: new Map() }, "root");

const part2 = (monkeys: MonkeyMap): number => {
    const evaluated = new Map<string, number>();
    const ec = { monkeys, cache: evaluated };
    const dependent = new Map<string, boolean>();
    const dc = { monkeys, cache: dependent };
    const job = monkeys.get("root");
    if (job === undefined || typeof job === "number") {
        throw new Error("Invalid root");
    }
    const [lhs, _, rhs] = job;
    const l = dependency(dc, lhs);
    const r = dependency(dc, rhs);
    if (l && r) {
        throw new Error(`Invalid pair`);
    }
    const target = l ? evaluate(ec, rhs) : evaluate(ec, lhs);
    return search(dc, ec, l ? lhs : rhs, target);
};

await main(import.meta, parse, part1, part2);
