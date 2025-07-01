import { GraphicsContext } from "graphics/graphics-context.js";
import { createDatabaseSchema, Entity, Store } from "@adobe/data/ecs";
import { Frame, FrameSchema } from "graphics/frame.js";
import { DatabaseFromSchema, StoreFromSchema } from "../../../../data/dist/ecs/database/database-schema/database-schema.js";
import { FromSchemas } from "@adobe/data/schema";
import { Camera, CameraSchema } from "graphics/camera/camera.js";
import * as VEC3 from "math/vec3/index.js";
import { F32Schema } from "@adobe/data/schema";
import { AabbSchema } from "math/aabb/aabb.js";

export const createGraphicsDatabaseSchema = (context: GraphicsContext) => {
    return createDatabaseSchema({
        buffer: { default: null as unknown as GPUBuffer, transient: true },
        boundingBox: AabbSchema,
    }, {
        graphics: { default: context, transient: true },
        camera: {
            ...CameraSchema,
            default: {
                aspect: context.canvas.width / context.canvas.height,
                fieldOfView: Math.PI / 4,
                nearPlane: 0.1,
                farPlane: 100.0,
                position: [0, 0, 20],
                target: [0, 0, 0],
                up: [0, 1, 0],
            } satisfies Camera
        },
        timeScale: { ...F32Schema, default: 1.0 },
        lightDirection: { ...VEC3.Vec3Schema, default: VEC3.normalize([1, 2, 5.0]) },
        ambientStrength: { ...F32Schema, default: 0.5 },
        lightColor: { ...VEC3.Vec3Schema, default: [1.2, 1.2, 1.2] as VEC3.Vec3 },
        sceneBuffer: { default: null as unknown as GPUBuffer, transient: true },
        // valid during update phase
        commandEncoder: { default: null as unknown as GPUCommandEncoder, transient: true },
        updateFrame: FrameSchema,
        // valid during the render phase
        renderPassEncoder: { default: null as unknown as GPURenderPassEncoder, transient: true },
        renderFrame: FrameSchema,
    }, (store) => {
        return ({
            setUpdateFrame: (frame: Frame) => {
                store.resources.updateFrame = frame;
            },
            setRenderFrame: (frame: Frame) => {
                store.resources.renderFrame = frame;
            },
            updateBuffer: ({ entity, buffer }: { entity: Entity, buffer: GPUBuffer }) => {
                store.update(entity, { buffer });
            }
        })
    })
}

export type GraphicsDatabase = DatabaseFromSchema<ReturnType<typeof createGraphicsDatabaseSchema>>;
export type GraphicsStore = StoreFromSchema<ReturnType<typeof createGraphicsDatabaseSchema>>;
