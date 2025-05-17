import { TypedBuffer } from "data/typed-buffer";
import { Writer } from "./writer";

/**
 * Creates a writer for writing to a typed buffer.
 * This will efficiently grow the buffer as needed.
 * @param buffer 
 */
export const createList = <T>(buffer: TypedBuffer<T>): Writer<T> => {
    const growFactor: number = 2;
    const minimumGrowSize: number = 16;

    let size = buffer.size;
    let count: number = 0;

    const writer: Writer<T> = {
        buffer,
        get count() {
            return count;
        },
        write(value: T): void {
            if (count >= size) {
                buffer.size = size = Math.ceil(Math.max(minimumGrowSize, size) * growFactor);
            }
            buffer.set(count++, value);
        },
        reset(): void {
            count = 0;
        },
    }
    return writer;
}
