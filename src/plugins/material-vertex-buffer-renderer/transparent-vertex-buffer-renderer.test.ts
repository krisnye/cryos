import { expect, test, describe } from "vitest";
import { Database } from "@adobe/data/ecs";
import { graphics } from "../graphics.js";
import { geometry } from "../geometry.js";
import { renderTransparentVertexBuffers } from "./transparent-vertex-buffer-renderer.js";
import { materialVertexBuffers } from "../material-vertex-buffers.js";

describe("renderTransparentVertexBuffers", () => {
    test("should create system without errors", () => {
        const db = Database.create(
            Database.Plugin.combine(
                graphics,
                geometry,
                materialVertexBuffers,
                renderTransparentVertexBuffers
            )
        );

        // System should be created successfully
        expect(db.system.functions.renderTransparentVertexBuffers).toBeDefined();
    });

    test("should handle empty query gracefully", () => {
        const db = Database.create(
            Database.Plugin.combine(
                graphics,
                geometry,
                materialVertexBuffers,
                renderTransparentVertexBuffers
            )
        );

        // Run system with no entities (should not error)
        const system = db.system.functions.renderTransparentVertexBuffers;
        expect(() => system()).not.toThrow();
    });
});

