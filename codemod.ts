import { Project } from "ts-morph";

const project = new Project({
    tsConfigFilePath: "tsconfig.json",
});

for (const sourceFile of project.getSourceFiles()) {
    const enums = sourceFile.getEnums();
    if (enums.length === 0) {
        continue;
    }
    for (const e of enums) {
        const name = e.getName();
        const fields: string[] = [];
        for (const member of e.getMembers()) {
            const value = member.getValue();
            fields.push(
                `${member.getName()}: ${typeof value === "string" ? JSON.stringify(value) : value}`,
            );
        }
        const decl = `const ${name} = {${fields.join(", ")}} as const; type ${name} = (typeof ${name})[keyof typeof ${name}];`;
        e.replaceWithText(decl);
    }
}

project.saveSync();
