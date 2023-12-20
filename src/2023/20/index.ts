import z from "zod";
import { main } from "../../utils/host";
import { LinesSchema } from "../../utils/schemas";
import { every, map, reduce, some } from "../../common/itertools";
import { leastCommonMultiple } from "../../common/math";

enum Pulse {
    Low = 0,
    High = 1,
}

enum PulseModuleKind {
    FlipFlop = "%",
    Conjuction = "&",
}

interface PulseModuleRecord {
    readonly name: string;
    readonly kind?: PulseModuleKind;
    readonly outputs: ReadonlyArray<string>;
}

type PulseModuleRecordList = ReadonlyArray<PulseModuleRecord>;

const parseKey = (key: string): Pick<PulseModuleRecord, "name" | "kind"> =>
    key.startsWith(PulseModuleKind.FlipFlop) ||
    key.startsWith(PulseModuleKind.Conjuction)
        ? { name: key.slice(1), kind: key[0] as PulseModuleKind }
        : { name: key };

const PulseModuleRecordSchema = z
    .string()
    .transform((line) => {
        const [key, list] = line.split(/\s+->\s+/);
        return { ...parseKey(key), outputs: list.split(/,\s+/g) };
    })
    .pipe(
        z.object({
            name: z.string(),
            kind: z.nativeEnum(PulseModuleKind).optional(),
            outputs: z.array(z.string()),
        }),
    );

const PulseModuleRecordListSchema = LinesSchema(PulseModuleRecordSchema);

interface PulseMessage {
    readonly source: string;
    readonly target: string;
    readonly pulse: Pulse;
}

abstract class PulseModule {
    readonly name: string;
    readonly outputs: ReadonlyArray<string>;

    constructor(name: string, outputs: ReadonlyArray<string>) {
        this.name = name;
        this.outputs = outputs;
    }

    abstract process(message: PulseMessage): Pulse | null;
}

class PassthroughPulseModule extends PulseModule {
    process({ pulse }: PulseMessage): Pulse {
        return pulse;
    }
}

class FlipFlopPulseModule extends PulseModule {
    #on: boolean = false;

    process({ pulse }: PulseMessage): Pulse | null {
        if (pulse === Pulse.High) {
            return null;
        }
        this.#on = !this.#on;
        return this.#on ? Pulse.High : Pulse.Low;
    }
}

class ConjuctionPulseModule extends PulseModule {
    readonly #inputs: Map<string, Pulse>;

    constructor(
        name: string,
        outputs: ReadonlyArray<string>,
        inputs: ReadonlySet<string>,
    ) {
        super(name, outputs);
        this.#inputs = new Map(map(inputs, (key) => [key, Pulse.Low]));
    }

    process({ source, pulse }: PulseMessage): Pulse | null {
        this.#inputs.set(source, pulse);
        return every(this.#inputs.values(), (p) => p === Pulse.High)
            ? Pulse.Low
            : Pulse.High;
    }
}

class PulseSystem {
    readonly #inputs: ReadonlyMap<string, ReadonlySet<string>>;
    readonly #modules: ReadonlyMap<string, PulseModule>;

    static #buildInputs(
        records: PulseModuleRecordList,
    ): ReadonlyMap<string, ReadonlySet<string>> {
        const inputs = new Map<string, Set<string>>();
        for (const { name, outputs } of records) {
            for (const output of outputs) {
                if (!inputs.has(output)) {
                    inputs.set(output, new Set());
                }
                inputs.get(output)!.add(name);
            }
        }
        return inputs;
    }

    static #buildModule(
        { name, kind, outputs }: PulseModuleRecord,
        inputs: ReadonlyMap<string, ReadonlySet<string>>,
    ): PulseModule {
        switch (kind) {
            case undefined:
                return new PassthroughPulseModule(name, outputs);
            case PulseModuleKind.FlipFlop:
                return new FlipFlopPulseModule(name, outputs);
            case PulseModuleKind.Conjuction:
                return new ConjuctionPulseModule(
                    name,
                    outputs,
                    inputs.get(name)!,
                );
        }
    }

    static #buildModules(
        records: PulseModuleRecordList,
        inputs: ReadonlyMap<string, ReadonlySet<string>>,
    ): ReadonlyMap<string, PulseModule> {
        return new Map(
            map(
                map(records, (record) =>
                    PulseSystem.#buildModule(record, inputs),
                ),
                (m) => [m.name, m],
            ),
        );
    }

    constructor(records: PulseModuleRecordList) {
        this.#inputs = PulseSystem.#buildInputs(records);
        this.#modules = PulseSystem.#buildModules(records, this.#inputs);
    }

    inputs(name: string): ReadonlySet<string> | undefined {
        return this.#inputs.get(name);
    }

    *press(): Iterable<PulseMessage> {
        const queue: PulseMessage[] = [
            { source: "button", target: "broadcaster", pulse: Pulse.Low },
        ];
        for (const message of queue) {
            yield message;
            const mod = this.#modules.get(message.target);
            if (mod === undefined) {
                continue;
            }
            const source = message.target;
            const pulse = mod.process(message);
            if (pulse !== null) {
                for (const target of mod.outputs) {
                    queue.push({ source, target, pulse });
                }
            }
        }
    }
}

function simulate(system: PulseSystem, n: number): number {
    const result: [low: number, high: number] = [0, 0];
    for (let i = 0; i < n; i++) {
        for (const { pulse } of system.press()) {
            result[pulse]++;
        }
    }
    return result.reduce((product, value) => product * value);
}

const parse = (input: string): PulseModuleRecordList =>
    PulseModuleRecordListSchema.parse(input);

const part1 = (records: PulseModuleRecordList): number =>
    simulate(new PulseSystem(records), 1_000);

const part2 = (records: PulseModuleRecordList): number => {
    const system = new PulseSystem(records);
    const targetInputs = system.inputs("rx");
    if (targetInputs === undefined) {
        return Infinity;
    }
    if (targetInputs.size !== 1) {
        throw new Error("Invalid target input set");
    }
    const target = Array.from(targetInputs)[0];
    if (
        records.find(({ name }) => name === target)?.kind !==
        PulseModuleKind.Conjuction
    ) {
        throw new Error("Invalid target");
    }
    const inputs = system.inputs(target);
    if (inputs === undefined) {
        throw new Error("Invalid input set");
    }
    const cycles = new Map<string, number>();
    let count = 0;
    while (some(inputs, (name) => !cycles.has(name))) {
        count++;
        for (const message of system.press()) {
            if (
                message.target === target &&
                message.pulse === Pulse.High &&
                !cycles.has(message.source)
            ) {
                cycles.set(message.source, count);
            }
        }
    }
    return reduce(
        cycles.values(),
        (lcm, cycle) => leastCommonMultiple(lcm, cycle),
        1,
    );
};

main(module, parse, part1, part2);
