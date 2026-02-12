import z from "zod";
import { main } from "../../utils/host.ts";

type Register = "A" | "B" | "C";

const OpCode = {
  adv: 0,
  bxl: 1,
  bst: 2,
  jnz: 3,
  bxc: 4,
  out: 5,
  bdv: 6,
  cdv: 7,
} as const;
type OpCode = (typeof OpCode)[keyof typeof OpCode];

interface Debugger {
  readonly registers: Readonly<Record<Register, bigint>>;
  readonly program: ReadonlyArray<OpCode>;
}

const RegisterSchema = z.enum(["A", "B", "C"]);
const RegisterInitSchema = z
  .string()
  .transform((line) => {
    const match = line.match(/^Register (\w): (\d+)$/);
    if (match === null) {
      return match;
    }
    const [, register, value] = match;
    return [register, value];
  })
  .pipe(z.tuple([RegisterSchema, z.coerce.bigint<string>()]));
const RegistersSchema = z
  .string()
  .transform((chunk) => chunk.split("\n"))
  .pipe(z.array(RegisterInitSchema))
  .transform((entries) => Object.fromEntries(entries) as Record<Register, bigint>);

const ProgramSchema = z
  .string()
  .transform((line) =>
    line
      .split(": ")[1]
      .trim()
      .split(",")
      .map((value) => parseInt(value, 10)),
  )
  .pipe(z.array(z.enum(OpCode)));

const DebuggerSchema = z
  .string()
  .transform((input) => {
    const [registers, program] = input.split("\n\n");
    return { registers, program };
  })
  .pipe(z.object({ registers: RegistersSchema, program: ProgramSchema }));

class Computer {
  readonly #registers: Record<Register, bigint>;
  readonly #program: ReadonlyArray<OpCode>;
  #instruction = 0;
  readonly #out: number[] = [];

  constructor(registers: Record<Register, bigint>, program: ReadonlyArray<OpCode>) {
    this.#registers = registers;
    this.#program = program;
  }

  exec(): ReadonlyArray<number> {
    while (this.#instruction < this.#program.length) {
      const op = this.#program[this.#instruction];
      const value = this.#program[this.#instruction + 1];
      this.#eval(op, value);
    }
    return this.#out;
  }

  #eval(op: OpCode, value: number): void {
    switch (op) {
      case OpCode.adv: {
        this.#divide("A", value);
        break;
      }
      case OpCode.bxl: {
        this.#registers.B = this.#registers.B ^ BigInt(value);
        this.#advance();
        break;
      }
      case OpCode.bst: {
        this.#registers.B = this.#combo(value as OpCode) % 8n;
        this.#advance();
        break;
      }
      case OpCode.jnz: {
        if (this.#registers.A !== 0n) {
          this.#instruction = value;
          break;
        }
        this.#advance();
        break;
      }
      case OpCode.bxc: {
        this.#registers.B = this.#registers.B ^ this.#registers.C;
        this.#advance();
        break;
      }
      case OpCode.out: {
        this.#out.push(Number(this.#combo(value as OpCode) % 8n));
        this.#advance();
        break;
      }
      case OpCode.bdv: {
        this.#divide("B", value);
        break;
      }
      case OpCode.cdv: {
        this.#divide("C", value);
        break;
      }
    }
  }

  #combo(op: OpCode): bigint {
    switch (op) {
      case 4: {
        return this.#registers.A;
      }
      case 5: {
        return this.#registers.B;
      }
      case 6: {
        return this.#registers.C;
      }
      case 7: {
        throw new Error("Invalid op code");
      }
      default: {
        return BigInt(op);
      }
    }
  }

  #advance(): void {
    this.#instruction += 2;
  }

  #divide(register: Register, value: number): void {
    this.#registers[register] = this.#registers.A >> this.#combo(value as OpCode);
    this.#advance();
  }
}

const parse = (input: string): Debugger => DebuggerSchema.parse(input);

const part1 = ({ registers, program }: Debugger): string =>
  new Computer(structuredClone(registers), program).exec().join(",");

const part2 = ({ registers, program }: Debugger): bigint => {
  const frontier = new Set<bigint>([0n]);
  for (const a of frontier) {
    const max = a + 8n;
    for (let A = a; A < max; A++) {
      const out = new Computer({ ...registers, A }, program).exec();
      const base = program.length - out.length;
      if (out.every((value, index) => value === program[base + index])) {
        if (base === 0) {
          return A;
        }
        frontier.add(A << 3n);
      }
    }
  }
  throw new Error("Answer not found");
};

await main(import.meta, parse, part1, part2);
