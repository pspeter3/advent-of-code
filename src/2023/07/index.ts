import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";

const CAMEL_CARDS = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "T",
    "J",
    "Q",
    "K",
    "A",
] as const;
type CamelCard = (typeof CAMEL_CARDS)[number];
type CamelHand = readonly [
    CamelCard,
    CamelCard,
    CamelCard,
    CamelCard,
    CamelCard,
];

interface CamelRound {
    readonly hand: CamelHand;
    readonly bid: number;
}

interface CamelRoundWithType extends CamelRound {
    readonly type: CamelHandType;
}

const CamelHandType = {
    HighCard: 0,
    Pair: 1,
    TwoPair: 2,
    ThreeOfAKind: 3,
    FullHouse: 4,
    FourOfAKind: 5,
    FiveOfAKind: 6,
} as const;
type CamelHandType = (typeof CamelHandType)[keyof typeof CamelHandType];

type CamelRoundList = ReadonlyArray<CamelRound>;

const CamelCardSchema = z.enum(CAMEL_CARDS);
const CamelHandSchema = z.tuple([
    CamelCardSchema,
    CamelCardSchema,
    CamelCardSchema,
    CamelCardSchema,
    CamelCardSchema,
]);
const CamelRoundSchema = z
    .string()
    .transform((line) => {
        const [cards, bid] = line.split(/\s+/);
        const hand = Array.from(cards);
        return { hand, bid };
    })
    .pipe(z.object({ hand: CamelHandSchema, bid: IntSchema }));
const CamelRoundListSchema = LinesSchema(CamelRoundSchema);

type CamelHandCounts = ReadonlyMap<CamelCard, number>;

function countHand(hand: CamelHand): CamelHandCounts {
    const counts = new Map<CamelCard, number>();
    for (const card of hand) {
        counts.set(card, (counts.get(card) ?? 0) + 1);
    }
    return counts;
}

function assignJokers(counts: CamelHandCounts): CamelHandCounts {
    const jokers = counts.get("J");
    if (jokers === undefined) {
        return counts;
    }
    if (jokers === 5) {
        return new Map([["A", 5]]);
    }
    const keys = Array.from(counts.keys())
        .filter((key) => key !== "J")
        .sort((aCard, bCard) => {
            const aCount = counts.get(aCard)!;
            const bCount = counts.get(bCard)!;
            if (aCount !== bCount) {
                return bCount - aCount;
            }
            return CAMEL_CARDS.indexOf(bCard) - CAMEL_CARDS.indexOf(aCard);
        });
    const key = keys[0];
    const result = new Map();
    for (const [card, count] of counts) {
        if (card === "J") {
            continue;
        }
        result.set(card, card === key ? count + jokers : count);
    }
    return result;
}

function toHandType(counts: CamelHandCounts): CamelHandType {
    const [most, next] = Array.from(counts.values()).sort((a, b) => b - a);
    switch (most) {
        case 5: {
            return CamelHandType.FiveOfAKind;
        }
        case 4: {
            return CamelHandType.FourOfAKind;
        }
        case 3: {
            return next === 2
                ? CamelHandType.FullHouse
                : CamelHandType.ThreeOfAKind;
        }
        case 2: {
            return next === 2 ? CamelHandType.TwoPair : CamelHandType.Pair;
        }
        case 1: {
            return CamelHandType.HighCard;
        }
        default: {
            throw new Error("Invalid CamelHandCounts");
        }
    }
}

type CamelCardRanker = (card: CamelCard) => number;
type CamelRoundWithTypeSorter = (
    a: CamelRoundWithType,
    b: CamelRoundWithType,
) => number;

const createRoundSorter =
    (ranker: CamelCardRanker): CamelRoundWithTypeSorter =>
    (a, b) => {
        if (a.type !== b.type) {
            return a.type - b.type;
        }
        for (const [index, aCard] of a.hand.entries()) {
            const bCard = b.hand[index];
            const aRank = ranker(aCard);
            const bRank = ranker(bCard);
            if (aRank !== bRank) {
                return aRank - bRank;
            }
        }
        return 0;
    };

function calculateWinnings(
    rounds: Array<CamelRoundWithType>,
    sorter: CamelRoundWithTypeSorter,
): number {
    rounds.sort(sorter);
    return rounds.reduce((sum, { bid }, index) => sum + bid * (index + 1), 0);
}

const parse = (input: string): CamelRoundList =>
    CamelRoundListSchema.parse(input);

const part1 = (rounds: CamelRoundList): number =>
    calculateWinnings(
        rounds.map((round) => ({
            ...round,
            type: toHandType(countHand(round.hand)),
        })),
        createRoundSorter((card) => CAMEL_CARDS.indexOf(card)),
    );

const part2 = (rounds: CamelRoundList): number =>
    calculateWinnings(
        rounds.map((round) => ({
            ...round,
            type: toHandType(assignJokers(countHand(round.hand))),
        })),
        createRoundSorter((card) =>
            card === "J" ? -1 : CAMEL_CARDS.indexOf(card),
        ),
    );

main(module, parse, part1, part2);
