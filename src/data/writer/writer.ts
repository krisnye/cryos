import { TypedBuffer } from "data/typed-buffer";

export interface Writer<T> {
    /**
     * The number of elements written to the writer.
     */
    readonly count: number;
    /**
     * Writes a value to the writer.
     * @param value - The value to write.
     */
    write(value: T): void;
    /**
     * Resets count to 0.
     */
    reset(): void;

    /**
     * The buffer that the writer writes to.
     */
    buffer: TypedBuffer<T>;
}
