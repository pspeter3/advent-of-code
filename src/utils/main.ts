async function main(): Promise<void> {
    console.log("Advent of Code");
}

if (require.main === module) {
    main().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
