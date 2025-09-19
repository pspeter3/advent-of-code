import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NumberRange } from "./number-range.ts";

describe("NumberRange", () => {
    it("should have the correct length", () => {
        assert.equal(new NumberRange(1, 5).length, 4);
    });

    it("should support includes", () => {
        const range = new NumberRange(1, 5);
        assert.equal(range.includes(2), true);
        assert.equal(range.includes(0), false);
        assert.equal(range.includes(5), false);
    });

    it("should support intersection", () => {
        assert.deepEqual(
            new NumberRange(1, 5).intersection({ min: 2, max: 6 }),
            new NumberRange(2, 5),
        );
        assert.deepEqual(
            new NumberRange(1, 5).intersection({ min: 5, max: 10 }),
            null,
        );
        assert.deepEqual(
            new NumberRange(1, 5).intersection({ min: 0, max: 1 }),
            null,
        );
    });

    it("should support split", () => {
        const range = new NumberRange(1, 5);
        assert.throws(() => range.split(0));
        assert.deepEqual(range.split(3), [
            new NumberRange(1, 3),
            new NumberRange(3, 5),
        ]);
    });

    it("should support equals", () => {
        assert.equal(new NumberRange(1, 5).equals({ min: 1, max: 5 }), true);
    });
});
