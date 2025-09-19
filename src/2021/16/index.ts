import { main } from "../../utils/host.ts";
import { StringSchema } from "../../utils/schemas.ts";

const PacketType = {
    Sum: 0,
    Product: 1,
    Minimum: 2,
    Maximum: 3,
    Literal: 4,
    GreaterThan: 5,
    LessThan: 6,
    EqualTo: 7,
} as const;
type PacketType = (typeof PacketType)[keyof typeof PacketType];

interface Header {
    readonly version: number;
    readonly typeID: PacketType;
}

interface Packet extends Header {
    readonly size: number;
}

interface Literal extends Packet {
    readonly typeID: (typeof PacketType)["Literal"];
    readonly value: number;
}

interface Wrapper extends Packet {
    readonly packets: ReadonlyArray<Packet>;
}

const schema = StringSchema.transform((input) => input.trim());

const binary = (bits: string): number => parseInt(bits, 2);

const decodeHeader = (bits: string): Header => {
    const version = binary(bits.slice(0, 3));
    const typeID = binary(bits.slice(3, 6)) as PacketType;
    return { version, typeID };
};

const decodeLiteral = (
    version: number,
    typeID: number,
    bits: string,
): Literal => {
    if (typeID !== PacketType.Literal) {
        throw new Error("Invalid packet header");
    }
    const groups: string[] = [];
    let index = 6;
    let current = bits.slice(index, index + 5);
    while (current[0] === "1") {
        groups.push(current.slice(1));
        index += 5;
        current = bits.slice(index, index + 5);
    }
    const size = index + 5;
    groups.push(bits.slice(index + 1, size));
    const value = binary(groups.join(""));
    return { version, typeID, size, value };
};

const decodeWrapper = (
    version: number,
    typeID: PacketType,
    bits: string,
): Wrapper => {
    const index = 7;
    const lengthTypeID = binary(bits[6]);
    if (lengthTypeID === 0) {
        const offset = index + 15;
        const length = binary(bits.slice(index, offset));
        const size = offset + length;
        return {
            version,
            typeID,
            size,
            packets: decode(bits.slice(offset, size)),
        };
    }
    const offset = index + 11;
    const count = binary(bits.slice(index, offset));
    const packets: Packet[] = [];
    let size = offset;
    for (let i = 0; i < count; i++) {
        const packet = decodePacket(bits.slice(size));
        size += packet.size;
        packets.push(packet);
    }
    return { version, typeID, size, packets };
};

const decodePacket = (bits: string): Packet => {
    const { version, typeID } = decodeHeader(bits);
    switch (typeID) {
        case 4: {
            return decodeLiteral(version, typeID, bits);
        }
        default: {
            return decodeWrapper(version, typeID, bits);
        }
    }
};

const decode = (bits: string): ReadonlyArray<Packet> => {
    const packets: Packet[] = [];
    let index = 0;
    while (index < bits.length) {
        const current = bits.slice(index);
        if (current.match(/^0+$/)) {
            break;
        }
        const packet = decodePacket(current);
        index += packet.size;
        packets.push(packet);
    }
    return packets;
};

const isWrapper = (packet: Packet): packet is Wrapper =>
    Array.isArray((packet as unknown as Wrapper).packets);

const sum = (values: ReadonlyArray<number>): number =>
    values.reduce((sum, element) => sum + element);

const product = (values: ReadonlyArray<number>): number =>
    values.reduce((sum, element) => sum * element);

const versionSum = (packet: Packet): number => {
    let total = packet.version;
    if (isWrapper(packet)) {
        total += sum(packet.packets.map(versionSum));
    }
    return total;
};

const evaluate = (packet: Packet): number => {
    const values: number[] = isWrapper(packet)
        ? packet.packets.map(evaluate)
        : [(packet as Literal).value];
    switch (packet.typeID) {
        case PacketType.Sum: {
            return sum(values);
        }
        case PacketType.Product: {
            return product(values);
        }
        case PacketType.Minimum: {
            return Math.min(...values);
        }
        case PacketType.Maximum: {
            return Math.max(...values);
        }
        case PacketType.Literal: {
            return values[0];
        }
        case PacketType.GreaterThan: {
            return Number(values[0] > values[1]);
        }
        case PacketType.LessThan: {
            return Number(values[0] < values[1]);
        }
        case PacketType.EqualTo: {
            return Number(values[0] === values[1]);
        }
    }
};

const toBits = (data: string): string =>
    data
        .split("")
        .map((char) => parseInt(char, 16).toString(2).padStart(4, "0"))
        .join("");

const part1 = (data: string): number =>
    sum(decode(toBits(data)).map(versionSum));

const part2 = (data: string): number => evaluate(decode(toBits(data))[0]);

await main(import.meta, (input) => schema.parse(input), part1, part2);
