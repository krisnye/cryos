import { expect, test } from "vitest";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { PositionNormalMaterialVertex } from "./position-normal-material.js";

test("PositionNormalMaterialVertex schema defines position, normal, and materialIndex", () => {
    const buffer = createTypedBuffer(PositionNormalMaterialVertex.schema, 1);
    
    const vertex = {
        position: [1.0, 2.0, 3.0] as const,
        normal: [0.0, 1.0, 0.0] as const,
        materialIndex: 5,
    };
    
    buffer.set(0, vertex);
    const retrieved = buffer.get(0);
    
    expect(retrieved.position).toEqual([1.0, 2.0, 3.0]);
    expect(retrieved.normal).toEqual([0.0, 1.0, 0.0]);
    expect(retrieved.materialIndex).toBe(5);
});

test("PositionNormalMaterialVertex uses packed layout", () => {
    const layout = PositionNormalMaterialVertex.layout;
    expect(layout).toBeDefined();
    expect(layout.size).toBeGreaterThan(0);
});

