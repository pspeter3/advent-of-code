import { main } from "../../utils/host.ts";

interface FileSystemInfo {
    name: string;
    size: number;
}

class FileInfo implements FileSystemInfo {
    readonly name: string;
    readonly size: number;

    constructor(name: string, size: number) {
        this.name = name;
        this.size = size;
    }
}

class DirectoryInfo implements FileSystemInfo {
    readonly name: string;
    readonly parent: DirectoryInfo | null;
    readonly children: Map<string, DirectoryInfo | FileInfo>;

    constructor(name: string, parent: DirectoryInfo | null) {
        this.name = name;
        this.parent = parent;
        this.children = new Map();
    }

    get size(): number {
        return Array.from(this.children.values()).reduce(
            (sum, info) => sum + info.size,
            0,
        );
    }

    addChild(child: DirectoryInfo | FileInfo): void {
        if (this.children.has(child.name)) {
            throw new Error(`Duplicate child ${child.name}`);
        }
        this.children.set(child.name, child);
    }

    getChildDirectory(name: string): DirectoryInfo {
        const child = this.children.get(name);
        if (!(child instanceof DirectoryInfo)) {
            throw new Error(`Invalid child ${name}`);
        }
        return child;
    }

    log(): void {
        console.group(this.name);
        for (const child of this.children.values()) {
            if (child instanceof FileInfo) {
                console.log(child.name, child.size);
                continue;
            }
            child.log();
        }
        console.groupEnd();
    }

    *directories(): Generator<DirectoryInfo, void, unknown> {
        for (const child of this.children.values()) {
            if (child instanceof DirectoryInfo) {
                for (const grandchild of child.directories()) {
                    yield grandchild;
                }
                yield child;
            }
        }
    }
}

const traverse = (lines: ReadonlyArray<string>): DirectoryInfo => {
    let cwd: DirectoryInfo | null = null;
    let root: DirectoryInfo | null = null;
    for (const line of lines) {
        if (line.startsWith("$")) {
            const parts = line.split(" ");
            const cmd = parts[1];
            switch (cmd) {
                case "cd": {
                    const dirname = parts[2];
                    switch (dirname) {
                        case "/": {
                            if (root === null) {
                                root = new DirectoryInfo(dirname, cwd);
                            }
                            cwd = root;
                            break;
                        }
                        case "..": {
                            if (cwd === null) {
                                throw new Error(`Invalid cd up`);
                            }
                            cwd = cwd.parent;
                            break;
                        }
                        default: {
                            if (cwd === null) {
                                throw new Error(`Invalid cd ${dirname}`);
                            }
                            cwd = cwd.getChildDirectory(dirname);
                            break;
                        }
                    }
                    break;
                }
                case "ls": {
                    break;
                }
                default: {
                    throw new Error("Invalid command");
                }
            }
        } else {
            if (cwd === null) {
                throw new Error("cwd is null");
            }
            const parts = line.split(" ");
            const child =
                parts[0] === "dir"
                    ? new DirectoryInfo(parts[1], cwd)
                    : new FileInfo(parts[1], parseInt(parts[0], 10));
            cwd.addChild(child);
        }
    }
    if (root === null) {
        throw new Error("Invalid command list");
    }
    return root;
};

const parse = (input: string): DirectoryInfo =>
    traverse(input.trim().split("\n"));

const part1 = (root: DirectoryInfo): number => {
    let total = 0;
    for (const directory of root.directories()) {
        if (directory.size < 100000) {
            total += directory.size;
        }
    }
    return total;
};

const part2 = (root: DirectoryInfo): number => {
    const max = 70000000;
    const need = 30000000;
    const available = max - root.size;
    const delta = need - available;
    return Array.from(root.directories())
        .filter((dir) => dir.size >= delta)
        .sort((a, b) => a.size - b.size)[0].size;
};

await main(import.meta, parse, part1, part2);
