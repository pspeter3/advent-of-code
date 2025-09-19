import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";
import { len } from "../../common/itertools.ts";

type Report = ReadonlyArray<number>;
type ReportList = ReadonlyArray<Report>;

const ReportSchema = z
    .string()
    .transform((line) => line.split(/\s+/))
    .pipe(z.array(IntSchema));
const ReportListSchema = LinesSchema(ReportSchema);

function isSafe(report: Report): boolean {
    let sign: number | null = null;
    for (let i = 1; i < report.length; i++) {
        const delta = report[i] - report[i - 1];
        if (delta === 0 || Math.abs(delta) > 3) {
            return false;
        }
        if (sign === null) {
            sign = Math.sign(delta);
        } else if (sign !== Math.sign(delta)) {
            return false;
        }
    }
    return true;
}
const parse = (input: string): ReportList => ReportListSchema.parse(input);

const part1 = (reports: ReportList): number =>
    len(reports.values().filter(isSafe));

const part2 = (reports: ReportList): number =>
    len(
        reports.values().filter((report) => {
            if (isSafe(report)) {
                return true;
            }
            return report
                .keys()
                .some((i) =>
                    isSafe(report.slice(0, i).concat(report.slice(i + 1))),
                );
        }),
    );

await main(import.meta, parse, part1, part2);
