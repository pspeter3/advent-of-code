import { main } from "../../utils/host.ts";

type PacketValue = number | ReadonlyArray<PacketValue>;
type Packet = ReadonlyArray<PacketValue>;
type PacketPair = readonly [a: Packet, b: Packet];

const parse = (input: string): ReadonlyArray<PacketPair> =>
    input
        .trim()
        .split("\n\n")
        .map(
            (group) =>
                group
                    .split("\n")
                    .map(
                        (line) => JSON.parse(line) as Packet,
                    ) as unknown as PacketPair,
        );

function compareInt(left: number, right: number): boolean | null {
    if (left === right) {
        return null;
    }
    return left < right;
}

function compareList(left: Packet, right: Packet): boolean | null {
    for (const [index, item] of left.entries()) {
        if (index >= right.length) {
            return false;
        }
        const result = compareValue(item, right[index]);
        if (result !== null) {
            return result;
        }
    }
    return right.length > left.length ? true : null;
}

function toList(value: PacketValue): Packet {
    return Array.isArray(value) ? value : [value];
}

function compareValue(left: PacketValue, right: PacketValue): boolean | null {
    if (typeof left === "number" && typeof right === "number") {
        return compareInt(left, right);
    }
    return compareList(toList(left), toList(right));
}

const part1 = (pairs: ReadonlyArray<PacketPair>): number => {
    let valid = 0;
    for (const [index, [left, right]] of pairs.entries()) {
        const result = compareList(left, right);
        if (result === null) {
            throw new Error(`Invalid pair ${index}`);
        }
        if (result) {
            valid += index + 1;
        }
    }
    return valid;
};

const part2 = (pairs: ReadonlyArray<PacketPair>): number => {
    const a: Packet = [[2]];
    const b: Packet = [[6]];
    const packets: Packet[] = [a, b];
    for (const [left, right] of pairs) {
        packets.push(left, right);
    }
    packets.sort((i, j) => {
        const result = compareList(i, j);
        if (result === null) {
            throw new Error("Invalid packet comparison");
        }
        return result ? -1 : 1;
    });
    return (packets.indexOf(a) + 1) * (packets.indexOf(b) + 1);
};

main(module, parse, part1, part2);
