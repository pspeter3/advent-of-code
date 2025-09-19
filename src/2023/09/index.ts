import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";

type History = ReadonlyArray<number>;
type Report = ReadonlyArray<History>;

const HistorySchema = z
    .string()
    .transform((line) => line.split(/\s+/))
    .pipe(z.array(IntSchema));
const ReportSchema = LinesSchema(HistorySchema);

const toDeltas = (history: History): History =>
    Array.from(
        { length: history.length - 1 },
        (_, i) => history[i + 1] - history[i],
    );

const isFinal = (history: History): boolean =>
    history.every((value) => value === 0);

function createDeltaQueue(history: History): ReadonlyArray<History> {
    const deltas: Array<History> = [history];
    while (!isFinal(deltas[0])) {
        deltas.unshift(toDeltas(deltas[0]));
    }
    return deltas;
}

function predictNext(history: History): number {
    const deltas = createDeltaQueue(history);
    let next = 0;
    for (const history of deltas.slice(1)) {
        next = history.at(-1)! + next;
    }
    return next;
}

function predictPrev(history: History): number {
    const deltas = createDeltaQueue(history);
    let next = 0;
    for (const history of deltas.slice(1)) {
        next = history.at(0)! - next;
    }
    return next;
}

const parse = (input: string): Report => ReportSchema.parse(input);

const part1 = (report: Report): number =>
    report.reduce((sum, history) => sum + predictNext(history), 0);

const part2 = (report: Report): number =>
    report.reduce((sum, history) => sum + predictPrev(history), 0);

await main(import.meta, parse, part1, part2);
