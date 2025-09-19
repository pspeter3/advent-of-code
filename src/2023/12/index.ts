import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";
import { memoize } from "../../common/functools.ts";

type NumberList = ReadonlyArray<number>;
type SpringRow = readonly [status: string, groups: NumberList];
type SpringRowList = ReadonlyArray<SpringRow>;

const SpringStatusSchema = z.string().regex(/^[\.#\?]+$/);
const NumberListSchema = z
    .string()
    .transform((chunk) => chunk.split(","))
    .pipe(z.array(IntSchema));
const Schema = LinesSchema(
    z
        .string()
        .transform((line) => line.split(/\s+/))
        .pipe(z.tuple([SpringStatusSchema, NumberListSchema])),
);

const estimated = (groups: NumberList): number =>
    groups.reduce((sum, value) => sum + value) + groups.length - 1;

const count = memoize((status: string, groups: NumberList): number => {
    if (status.length === 0) {
        return groups.length === 0 ? 1 : 0;
    }
    if (groups.length === 0) {
        return status.includes("#") ? 0 : 1;
    }
    if (status.length < estimated(groups)) {
        return 0;
    }
    switch (status.at(0)) {
        case ".": {
            return count(status.replace(/^\.+/, ""), groups);
        }
        case "#": {
            const [group, ...remaining] = groups;
            if (status.length > group && status.at(group) === "#") {
                return 0;
            }
            if (status.match(new RegExp(`^[#\?]{${group}}`)) === null) {
                return 0;
            }
            return count(status.slice(group + 1), remaining);
        }
        case "?": {
            const next = status.slice(1);
            return count("#" + next, groups) + count(next, groups);
        }
        default: {
            throw new Error("Invalid spring status");
        }
    }
});

const unfold = ([status, groups]: SpringRow): SpringRow => [
    Array.from({ length: 5 }, () => status).join("?"),
    Array.from({ length: 5 }, () => groups).flat(),
];

const parse = (input: string): SpringRowList => Schema.parse(input);

const part1 = (rows: SpringRowList): number =>
    rows.reduce((sum, row) => sum + count(...row), 0);

const part2 = (rows: SpringRowList): number =>
    rows.reduce((sum, row) => sum + count(...unfold(row)), 0);

await main(import.meta, parse, part1, part2);
