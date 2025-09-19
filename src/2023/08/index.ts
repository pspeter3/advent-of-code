import z from "zod";
import { main } from "../../utils/host.ts";
import { leastCommonMultiple } from "../../common/math.ts";

const Instruction = { Left: "L", Right: "R" } as const;
type Instruction = (typeof Instruction)[keyof typeof Instruction];

type Node = string;
type NodeEdges = readonly [left: Node, right: Node];
type InstructionList = ReadonlyArray<Instruction>;
type NodeMap = ReadonlyMap<Node, NodeEdges>;

interface Network {
    readonly instructions: InstructionList;
    readonly nodes: NodeMap;
}

const InstructionListSchema = z
    .string()
    .transform((line) => line.split(""))
    .pipe(z.array(z.enum(Instruction)));

const NodeSchema = z.string().length(3);
const NodeEdgesSchema = z
    .string()
    .transform((part) => {
        const match = part.match(/^\((\w+),\s+(\w+)\)$/);
        if (match === null) {
            throw new Error("Invalid match");
        }
        const [_, left, right] = match;
        return [left, right];
    })
    .pipe(z.tuple([NodeSchema, NodeSchema]));
const NodeEntrySchema = z
    .string()
    .transform((line) => line.split(/\s+=\s+/))
    .pipe(z.tuple([NodeSchema, NodeEdgesSchema]));
const NodeMapSchema = z
    .string()
    .transform((chunk) => chunk.split("\n"))
    .pipe(z.array(NodeEntrySchema))
    .transform((entries) => new Map(entries));
const NetworkSchema = z
    .string()
    .transform((input) => {
        const [instructions, nodes] = input.trim().split("\n\n");
        return { instructions, nodes };
    })
    .pipe(
        z.object({ instructions: InstructionListSchema, nodes: NodeMapSchema }),
    );

function findCycle({ instructions, nodes }: Network, start: Node): number {
    let count = 0;
    let current = start;
    while (!current.endsWith("Z")) {
        const edges = nodes.get(current)!;
        const instruction = instructions[count % instructions.length];
        const index = instruction === Instruction.Left ? 0 : 1;
        current = edges[index];
        count++;
    }
    return count;
}

const parse = (input: string): Network => NetworkSchema.parse(input);

const part1 = (network: Network): number => {
    const start = "AAA";
    if (!network.nodes.has(start)) {
        return 0;
    }
    return findCycle(network, start);
};

const part2 = (network: Network): number => {
    const cycles: number[] = [];
    for (const node of network.nodes.keys()) {
        if (!node.endsWith("A")) {
            continue;
        }
        cycles.push(findCycle(network, node));
    }
    return cycles.reduce((lcm, cycle) => leastCommonMultiple(lcm, cycle), 1);
};

await main(import.meta, parse, part1, part2);
