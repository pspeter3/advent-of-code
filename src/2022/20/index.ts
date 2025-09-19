import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";

const schema = LinesSchema(IntSchema);

const parse = (input: string): ReadonlyArray<number> => schema.parse(input);

interface Position {
    readonly value: number;
    readonly index: number;
}

const mix = (list: Array<Position>): void => {
    for (let i = 0; i < list.length; i++) {
        const index = list.findIndex(({ index }) => index === i);
        const [element] = list.splice(index, 1);
        list.splice((index + element.value) % list.length, 0, element);
    }
};

const coordinates = (list: ReadonlyArray<Position>): number => {
    const start = list.findIndex(({ value }) => value === 0);
    return [1000, 2000, 3000].reduce((sum, offset) => {
        return sum + list[(start + offset) % list.length].value;
    }, 0);
};

const part1 = (sequence: ReadonlyArray<number>): number => {
    let list: Position[] = sequence.map((value, index) => ({
        value,
        index,
    }));
    mix(list);
    return coordinates(list);
};

const part2 = (sequence: ReadonlyArray<number>): number => {
    let list: Position[] = sequence.map((value, index) => ({
        value: value * 811589153,
        index,
    }));
    for (let i = 0; i < 10; i++) {
        mix(list);
    }
    return coordinates(list);
};

await main(import.meta, parse, part1, part2);
