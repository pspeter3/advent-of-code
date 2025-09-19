import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";
import { sum } from "../../common/itertools.ts";

type Rule = readonly [before: number, after: number];
type Update = ReadonlyArray<number>;
type Rules = ReadonlyMap<number, ReadonlySet<number>>;
type UpdateList = ReadonlyArray<Update>;

interface Puzzle {
    readonly rules: Rules;
    readonly updates: UpdateList;
}

const RuleSchema = z
    .string()
    .transform((line) => line.split("|"))
    .pipe(z.tuple([IntSchema, IntSchema]));
const UpdateSchema = z
    .string()
    .transform((line) => line.split(","))
    .pipe(z.array(IntSchema));
const RulesSchema = LinesSchema(RuleSchema).transform(
    (rules) =>
        new Map(
            Map.groupBy(rules, ([before]) => before)
                .entries()
                .map(([before, rules]) => [
                    before,
                    new Set(rules.map(([, after]) => after)),
                ]),
        ),
);
const UpdateListSchema = LinesSchema(UpdateSchema);
const PuzzleSchema = z.object({
    rules: RulesSchema,
    updates: UpdateListSchema,
});

const parse = (input: string): Puzzle => {
    const [rules, updates] = input.split("\n\n");
    return PuzzleSchema.parse({ rules, updates });
};

const isValid = (update: Update, rules: Rules): boolean => {
    const seen = new Set<number>();
    for (const page of update) {
        if (seen.intersection(rules.get(page) ?? new Set()).size > 0) {
            return false;
        }
        seen.add(page);
    }
    return true;
};

const middle = (update: Update): number =>
    update[Math.floor(update.length / 2)];

const part1 = ({ rules, updates }: Puzzle): number =>
    sum(
        updates
            .values()
            .filter((update) => isValid(update, rules))
            .map(middle),
    );

const part2 = ({ rules, updates }: Puzzle): number =>
    sum(
        updates
            .values()
            .filter((update) => !isValid(update, rules))
            .map((update) =>
                update.toSorted((a, b) => {
                    if (rules.get(a)?.has(b)) {
                        return -1;
                    }
                    if (rules.get(b)?.has(a)) {
                        return 1;
                    }
                    return 0;
                }),
            )
            .map(middle),
    );

main(module, parse, part1, part2);
