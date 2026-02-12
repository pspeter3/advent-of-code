import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";
import { sum } from "../../common/itertools.ts";

interface MachinePart {
  readonly x: number;
  readonly m: number;
  readonly a: number;
  readonly s: number;
}
type MachinePartKey = keyof MachinePart;

type WorkflowKey = string;
const WorkflowFilterOp = { LT: "<", GT: ">" } as const;
type WorkflowFilterOp = (typeof WorkflowFilterOp)[keyof typeof WorkflowFilterOp];
interface WorkflowFilter {
  readonly key: MachinePartKey;
  readonly op: WorkflowFilterOp;
  readonly value: number;
  readonly target: WorkflowKey;
}
type WorkflowRule = WorkflowFilter | WorkflowKey;
type WorkflowRuleList = ReadonlyArray<WorkflowRule>;
type WorkflowMap = ReadonlyMap<WorkflowKey, WorkflowRuleList>;

interface System {
  readonly workflows: WorkflowMap;
  readonly parts: ReadonlyArray<MachinePart>;
}

const WorkflowFilterSchema = z.object({
  key: z.enum(["x", "m", "a", "s"]),
  op: z.enum(WorkflowFilterOp),
  value: IntSchema,
  target: z.string(),
});
const WorkflowRuleSchema = z
  .string()
  .transform((rule) => {
    const match = rule.match(/^([xmas])([<>])(\d+):(\w+)$/);
    if (!match) {
      return rule;
    }
    const [_, key, op, value, target] = match;
    return { key, op, value, target };
  })
  .pipe(z.union([WorkflowFilterSchema, z.string()]));
const WorkflowEntrySchema = z
  .string()
  .transform((line) => {
    const [key, value] = line.replace("}", "").split("{");
    return [key, value.split(",")];
  })
  .pipe(z.tuple([z.string(), z.array(WorkflowRuleSchema)]));
const WorkflowMapSchema = LinesSchema(WorkflowEntrySchema).transform((entries) => new Map(entries));

const MachinePartSchema = z
  .string()
  .transform((line) =>
    Object.fromEntries(
      line
        .replace("{", "")
        .replace("}", "")
        .split(",")
        .map((part) => part.split("=")),
    ),
  )
  .pipe(z.object({ x: IntSchema, m: IntSchema, a: IntSchema, s: IntSchema }));
const MachinePartListSchema = LinesSchema(MachinePartSchema);

const SystemSchema = z
  .string()
  .transform((input) => {
    const [workflows, parts] = input.split("\n\n");
    return { workflows, parts };
  })
  .pipe(
    z.object({
      workflows: WorkflowMapSchema,
      parts: MachinePartListSchema,
    }),
  );

function matchesFilter(part: MachinePart, { key, op, value }: WorkflowFilter): boolean {
  const v = part[key];
  switch (op) {
    case WorkflowFilterOp.LT: {
      return v < value;
    }
    case WorkflowFilterOp.GT: {
      return v > value;
    }
  }
}

function isAccepted(workflows: WorkflowMap, part: MachinePart, key: WorkflowKey = "in"): boolean {
  switch (key) {
    case "A": {
      return true;
    }
    case "R": {
      return false;
    }
    default: {
      const rules = workflows.get(key);
      if (rules === undefined) {
        throw new Error(`Invalid key ${key}`);
      }
      for (const rule of rules) {
        if (typeof rule === "string") {
          return isAccepted(workflows, part, rule);
        }
        if (matchesFilter(part, rule)) {
          return isAccepted(workflows, part, rule.target);
        }
      }
      throw new Error(`Invalid rule list ${key}`);
    }
  }
}

const rating = (part: MachinePart): number => sum(Object.values(part));

type Range = readonly [min: number, max: number];

const contains = ([min, max]: Range, value: number): boolean => min <= value && value <= max;

type RangeSplit = readonly [left: Range, right: Range];

function split(range: Range, { op, value }: WorkflowFilter): RangeSplit {
  if (!contains(range, value)) {
    throw new Error("Invalid split");
  }
  const [min, max] = range;
  switch (op) {
    case WorkflowFilterOp.LT: {
      return [
        [min, value - 1],
        [value, max],
      ];
    }
    case WorkflowFilterOp.GT: {
      return [
        [value + 1, max],
        [min, value],
      ];
    }
  }
}

type MachinePartRangeRecord = Readonly<Record<MachinePartKey, Range>>;

const parse = (input: string): System => SystemSchema.parse(input);

const part1 = ({ workflows, parts }: System): number =>
  sum(
    parts
      .values()
      .filter((part) => isAccepted(workflows, part))
      .map(rating),
  );

const part2 = ({ workflows }: System): number => {
  const accepted: MachinePartRangeRecord[] = [];
  const traverse = (ranges: MachinePartRangeRecord, key: WorkflowKey = "in"): void => {
    switch (key) {
      case "A": {
        accepted.push(ranges);
        return;
      }
      case "R": {
        return;
      }
      default: {
        const rules = workflows.get(key);
        if (rules === undefined) {
          throw new Error(`Invalid key ${key}`);
        }
        for (const rule of rules) {
          if (typeof rule === "string") {
            return traverse(ranges, rule);
          }
          const [l, r] = split(ranges[rule.key], rule);
          traverse({ ...ranges, [rule.key]: l }, rule.target);
          ranges = { ...ranges, [rule.key]: r };
        }
      }
    }
  };
  const valid: Range = [1, 4000];
  traverse({ x: valid, m: valid, a: valid, s: valid });
  return sum(
    accepted
      .values()
      .map((part) =>
        Object.values(part).reduce((product, [min, max]) => product * (max - min + 1), 1),
      ),
  );
};

await main(import.meta, parse, part1, part2);
