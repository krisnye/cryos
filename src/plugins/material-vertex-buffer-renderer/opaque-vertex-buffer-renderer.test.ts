import { expect, test, describe } from "vitest";
import { Database } from "@adobe/data/ecs";
import { Vec3 } from "@adobe/data/math";
import { graphics } from "../graphics.js";
import { geometry } from "../geometry.js";
import { renderOpaqueVertexBuffers } from "./opaque-vertex-buffer-renderer.js";
import { materialVertexBuffers } from "../material-vertex-buffers.js";

describe("renderOpaqueVertexBuffers", () => {
    test("should create system without errors", () => {
        const db = Database.create(
            Database.Plugin.combine(
                graphics,
                geometry,
                materialVertexBuffers,
                renderOpaqueVertexBuffers
            )
        );

        // System should be created successfully
        expect(db.system.functions.renderOpaqueVertexBuffers).toBeDefined();
    });

    test("should handle empty query gracefully", () => {
        const db = Database.create(
            Database.Plugin.combine(
                graphics,
                geometry,
                materialVertexBuffers,
                renderOpaqueVertexBuffers
            )
        );

        // Run system with no entities (should not error)
        const system = db.system.functions.renderOpaqueVertexBuffers;
        expect(() => system()).not.toThrow();
    });
});

