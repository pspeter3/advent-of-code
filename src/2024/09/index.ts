import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema } from "../../utils/schemas.ts";
import { enumerate, sum } from "../../common/itertools.ts";

type DiskMap = ReadonlyArray<number>;

const DiskMapSchema = z
    .string()
    .transform((input) => input.trim().split(""))
    .pipe(z.array(IntSchema));

class DiskChunk {
    readonly #size: number;
    #files: Map<number, number>;

    static empty(size: number): DiskChunk {
        return new DiskChunk(size, new Map());
    }

    static fromFile(size: number, id: number): DiskChunk {
        return new DiskChunk(size, new Map([[id, size]]));
    }

    private constructor(size: number, files: Map<number, number>) {
        this.#size = size;
        this.#files = files;
    }

    moveBlocks(chunk: DiskChunk): void {
        if (this.isFull()) {
            throw new Error("Cannot move blocks to a full chunk");
        }
        if (chunk.isEmpty()) {
            throw new Error("Cannot move blocks from an empty chunk");
        }
        if (chunk.#files.size !== 1) {
            throw new Error("Cannot move partial files");
        }
        const id = chunk.#files.keys().next().value!;
        if (this.#files.has(id)) {
            throw new Error("Cannot move blocks to the same chunk");
        }
        const delta = Math.min(this.#space(), chunk.#files.get(id)!);
        this.#files.set(id, delta);
        if (delta === chunk.#files.get(id)) {
            chunk.#files.delete(id);
        } else {
            chunk.#files.set(id, chunk.#files.get(id)! - delta);
        }
    }

    moveFile(chunk: DiskChunk): void {
        if (this.isFull()) {
            throw new Error("Cannot move blocks to a full chunk");
        }
        if (chunk.isEmpty()) {
            throw new Error("Cannot move blocks from an empty chunk");
        }
        const id = chunk.id();
        if (this.#files.has(id)) {
            throw new Error("Cannot move blocks to the same chunk");
        }
        const delta = chunk.#files.get(id)!;
        if (this.#space() < delta) {
            throw new Error(
                "Cannot move file to a chunk with insufficient space",
            );
        }
        this.#files.set(id, delta);
        chunk.#files.delete(id);
    }

    canMoveFile(chunk: DiskChunk): boolean {
        if (chunk.#files.size !== 1) {
            return false;
        }
        return this.#space() >= chunk.#blocks();
    }

    isEmpty(): boolean {
        return this.#blocks() === 0;
    }

    isFull(): boolean {
        return this.#blocks() === this.#size;
    }

    *values(): Generator<number> {
        for (const [id, count] of this.#files) {
            for (let i = 0; i < count; i++) {
                yield id;
            }
        }
        const space = this.#space();
        for (let i = 0; i < space; i++) {
            yield 0;
        }
    }

    id(): number {
        if (this.#files.size !== 1) {
            throw new Error("Cannot get id of a chunk with multiple files");
        }
        return this.#files.keys().next().value!;
    }

    #blocks(): number {
        return sum(this.#files.values());
    }

    #space(): number {
        return this.#size - this.#blocks();
    }
}

const toDisk = (diskMap: DiskMap): ReadonlyArray<DiskChunk> =>
    diskMap.map((size, index) =>
        index % 2 === 0
            ? DiskChunk.fromFile(size, index / 2)
            : DiskChunk.empty(size),
    );

const defragBlocks = (
    disk: ReadonlyArray<DiskChunk>,
): ReadonlyArray<DiskChunk> => {
    let open = 1;
    let file = disk.length - 1;
    while (open < file) {
        const openChunk = disk[open];
        const fileChunk = disk[file];
        if (openChunk.isFull()) {
            open += 2;
            continue;
        }
        if (fileChunk.isEmpty()) {
            file -= 2;
            continue;
        }
        openChunk.moveBlocks(fileChunk);
    }
    return disk;
};

function* range(size: number): Generator<number> {
    for (let i = 0; i < size; i++) {
        yield i;
    }
}

const defragFiles = (
    disk: ReadonlyArray<DiskChunk>,
): ReadonlyArray<DiskChunk> => {
    for (let file = disk.length - 1; file > 0; file -= 2) {
        const fileChunk = disk[file];
        const chunk = range(file)
            .map((id) => disk[id])
            .find((chunk) => chunk.canMoveFile(fileChunk));
        if (chunk !== undefined) {
            chunk.moveFile(fileChunk);
        }
    }
    return disk;
};

const checksum = (disk: ReadonlyArray<DiskChunk>): number =>
    sum(
        enumerate(disk.values().flatMap((chunk) => chunk.values())).map(
            ([index, id]) => index * id,
        ),
    );

const parse = (input: string): DiskMap => DiskMapSchema.parse(input);

const part1 = (diskMap: DiskMap): number =>
    checksum(defragBlocks(toDisk(diskMap)));

const part2 = (diskMap: DiskMap): number =>
    checksum(defragFiles(toDisk(diskMap)));

main(module, parse, part1, part2);
