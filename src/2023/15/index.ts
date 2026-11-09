import { enumerate, sum } from "../../common/itertools.ts";
import { main } from "../../utils/host.ts";

const REMOVE = "-";
const ADD = "=";

interface RemoveOperation {
  readonly kind: "-";
  readonly label: string;
}

interface AddOperation {
  readonly kind: "=";
  readonly label: string;
  readonly focal: number;
}

type Operation = RemoveOperation | AddOperation;

const hash = (label: string): number =>
  Array.from(label).reduce((value, char) => ((value + char.charCodeAt(0)) * 17) % 256, 0);

function toOperation(step: string): Operation {
  if (step.endsWith(REMOVE)) {
    return {
      kind: REMOVE,
      label: step.replace(REMOVE, ""),
    };
  }
  const [label, value] = step.split(ADD);
  return { kind: ADD, label, focal: parseInt(value, 10) };
}

function* toPower(boxes: ReadonlyArray<ReadonlyMap<string, number>>): Iterable<number> {
  for (const [index, box] of boxes.entries()) {
    for (const [offset, focal] of enumerate(box.values())) {
      yield (index + 1) * (offset + 1) * focal;
    }
  }
}

const parse = (input: string): ReadonlyArray<string> => input.trim().split(",");

const part1 = (sequence: ReadonlyArray<string>): number => sum(sequence.values().map(hash));

const part2 = (sequence: ReadonlyArray<string>): number => {
  const boxes: ReadonlyArray<Map<string, number>> = Array.from({ length: 256 }, () => new Map());
  for (const step of sequence) {
    const op = toOperation(step);
    const index = hash(op.label);
    const box = boxes[index];
    switch (op.kind) {
      case REMOVE: {
        box.delete(op.label);
        break;
      }
      case ADD: {
        box.set(op.label, op.focal);
        break;
      }
    }
  }
  return sum(toPower(boxes));
};

await main(import.meta, parse, part1, part2);
