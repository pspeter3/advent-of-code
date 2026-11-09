// TypeScript's esnext lib does not declare Iterator.concat yet, even though
// the Node version this repo runs on ships it. Delete this file once the lib
// includes it.
interface IteratorConstructor {
  /**
   * Creates an iterator that yields every value of each iterable in order.
   * @param iterables The iterables to concatenate
   */
  concat<T>(
    ...iterables: ReadonlyArray<Iterable<T, unknown, undefined>>
  ): IteratorObject<T, undefined, unknown>;
}
