import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { jsonKey, memoize } from "./functools.ts";

describe("jsonKey", () => {
  it("should serialize the arguments", () => {
    assert.equal(jsonKey(1, "a", true), '[1,"a",true]');
  });
});

describe("memoize", () => {
  it("should cache by JSON.stringify by default", () => {
    let calls = 0;
    const add = memoize((a: number, b: number): number => {
      calls++;
      return a + b;
    });
    assert.equal(add(1, 2), 3);
    assert.equal(add(1, 2), 3);
    assert.equal(add(2, 1), 3);
    assert.equal(calls, 2);
  });

  it("should support a custom key function", () => {
    let calls = 0;
    const add = memoize(
      (a: number, b: number): number => {
        calls++;
        return a + b;
      },
      (a, b) => Math.min(a, b) * 1000 + Math.max(a, b),
    );
    assert.equal(add(1, 2), 3);
    assert.equal(add(2, 1), 3);
    assert.equal(calls, 1);
  });
});
