import { expect, test, describe, vi } from "vitest";
import { parseComputeStorageAccess } from "./parse-shader-access.js";

describe("parseComputeStorageAccess", () => {
    test("should detect read-only access", () => {
        const source = `
            fn main() {
                let value = readOnlyBuffer[0];
                let x = readOnlyBuffer[1].x;
            }
        `;
        const access = parseComputeStorageAccess(source, ["readOnlyBuffer"]);
        expect(access.readOnlyBuffer).toEqual({ read: true, write: false });
    });

    test("should detect write access through array index", () => {
        const source = `
            fn main() {
                writeBuffer[0] = vec4(1.0);
            }
        `;
        const access = parseComputeStorageAccess(source, ["writeBuffer"]);
        expect(access.writeBuffer).toEqual({ read: false, write: true });
    });

    test("should detect write access through struct field", () => {
        const source = `
            fn main() {
                structBuffer[0].x = 1.0;
            }
        `;
        const access = parseComputeStorageAccess(source, ["structBuffer"]);
        expect(access.structBuffer).toEqual({ read: false, write: true });
    });

    test("should detect write access through store operation", () => {
        const source = `
            fn main() {
                store &storeBuffer[0], 1.0;
            }
        `;
        const access = parseComputeStorageAccess(source, ["storeBuffer"]);
        expect(access.storeBuffer).toEqual({ read: false, write: true });
    });

    test("should detect both read and write access", () => {
        const source = `
            fn main() {
                let value = readWriteBuffer[0];
                readWriteBuffer[1] = value * 2.0;
            }
        `;
        const access = parseComputeStorageAccess(source, ["readWriteBuffer"]);
        expect(access.readWriteBuffer).toEqual({ read: true, write: true });
    });

    test("should handle multiple buffers", () => {
        const source = `
            fn main() {
                let value = inputBuffer[0];
                outputBuffer[0] = value * 2.0;
                let temp = tempBuffer[0];
            }
        `;
        const access = parseComputeStorageAccess(source, ["inputBuffer", "outputBuffer", "tempBuffer"]);
        expect(access).toEqual({
            inputBuffer: { read: true, write: false },
            outputBuffer: { read: false, write: true },
            tempBuffer: { read: true, write: false }
        });
    });

    test("should warn if compute shader entry point is not found", () => {
        const consoleSpy = vi.spyOn(console, 'warn');
        const source = `
            fn wrong_main() {
                buffer[0] = 1.0;
            }
        `;
        const access = parseComputeStorageAccess(source, ["buffer"]);
        expect(consoleSpy).toHaveBeenCalledWith("Compute shader entry point not found");
        expect(access.buffer).toEqual({ read: false, write: false });
        consoleSpy.mockRestore();
    });

    test("should handle empty resource list", () => {
        const source = `
            fn main() {
                // Some code
            }
        `;
        const access = parseComputeStorageAccess(source, []);
        expect(access).toEqual({});
    });
}); 