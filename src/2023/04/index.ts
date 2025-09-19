import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";

type NumericSet = ReadonlySet<number>;

interface ScratchCard {
    readonly id: number;
    readonly winning: NumericSet;
    readonly options: NumericSet;
}

type ScratchCardList = ReadonlyArray<ScratchCard>;

const NumericListSchema = z
    .string()
    .transform((line) => line.split(/\s+/g))
    .pipe(z.array(IntSchema))
    .transform((list) => new Set(list));

const ScratchCardSchema = z
    .string()
    .transform((line) => {
        const [card, numbers] = line.split(/:\s+/);
        const [winning, options] = numbers.split(/\s+\|\s+/);
        const id = card.replace(/^Card\s+/, "");
        return { id, winning, options };
    })
    .pipe(
        z.object({
            id: IntSchema,
            winning: NumericListSchema,
            options: NumericListSchema,
        }),
    );

const ScratchCardListSchema = LinesSchema(ScratchCardSchema);

const countMatches = ({ winning, options }: ScratchCard): number => {
    let count = 0;
    for (const value of winning) {
        if (options.has(value)) {
            count++;
        }
    }
    return count;
};

const parse = (input: string): ScratchCardList =>
    ScratchCardListSchema.parse(input);

const part1 = (cards: ScratchCardList): number => {
    let result = 0;
    for (const card of cards) {
        const matches = countMatches(card);
        if (matches > 0) {
            result += Math.pow(2, matches - 1);
        }
    }
    return result;
};

const part2 = (cards: ScratchCardList): number => {
    const copies = Array.from({ length: cards.length }, () => 1);
    for (const [index, card] of cards.entries()) {
        const count = copies[index];
        const matches = countMatches(card);
        for (let i = index + 1; i <= index + matches; i++) {
            copies[i] += count;
        }
    }
    return copies.reduce((sum, count) => sum + count);
};

await main(import.meta, parse, part1, part2);
