import { GraphicsContext } from "graphics/graphics-context.js";
import { System } from "../systems/system.js";
import { createDatabaseSchema, Entity } from "@adobe/data/ecs";
import { FrameSchema } from "graphics/frame.js";

export const createGraphicsDatabaseSchema = (context: GraphicsContext) => {
    return createDatabaseSchema({
        buffer: { default: null as unknown as GPUBuffer, transient: true },
    }, {
        graphics: { default: context, transient: true },
        // valid during update phase
        commandEncoder: { default: null as unknown as GPUCommandEncoder, transient: true },
        updateFrame: FrameSchema,
        // valid during the render phase
        renderPassEncoder: { default: null as unknown as GPURenderPassEncoder, transient: true },
        renderFrame: FrameSchema,
        systems: { default: {} as Record<string, System>, transient: true }
    }, (store) => ({
        updateBuffer: ({ entity, buffer }: { entity: Entity, buffer: GPUBuffer }) => {
            store.update(entity, { buffer });
        }
    }))
}


