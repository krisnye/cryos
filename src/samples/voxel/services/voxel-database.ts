import { GraphicsContext } from "graphics/graphics-context.js";
import { createDatabaseSchema } from "@adobe/data/ecs";
import { Vec2, Vec2Schema, Vec3Schema, Vec4, Vec4Schema } from "math/index.js";
import { createGraphicsDatabaseSchema } from "graphics/database/graphics-database.js";
import { I32Schema, Schema, TrueSchema, U32Schema } from "@adobe/data/schema";
import { StaticVoxelChunkSchema } from "../types/static-voxel-chunk/static-voxel-chunk.js";
import { KeyCode } from "../types/key-code.js";
import { Camera, CameraSchema } from "graphics/camera/camera.js";

const GPUBufferSchema = {
    type: "object",
    default: null as unknown as GPUBuffer,
} as const satisfies Schema;

export const GPUBindGroupSchema = {
    type: "object",
    default: null as unknown as GPUBindGroup,
} as const satisfies Schema;

export const createVoxelDatabaseSchema = (context: GraphicsContext) => {
    const graphicsDatabaseSchema = createGraphicsDatabaseSchema(context);

    return createDatabaseSchema(
        {
            ...graphicsDatabaseSchema.components,
            velocity: Vec3Schema,
            particle: TrueSchema,
            position: Vec3Schema,
            color: Vec4Schema,
            staticVoxelChunk: StaticVoxelChunkSchema,
            staticVoxelChunkPositionsBuffer: GPUBufferSchema,
            staticVoxelChunkColorsBuffer: GPUBufferSchema,
            staticVoxelChunkBindGroup: GPUBindGroupSchema,
            staticVoxelChunkRenderCount: U32Schema,
            dirtyFrame: I32Schema,
            cleanFrame: I32Schema,
        },
        {
            ...graphicsDatabaseSchema.resources,
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
            mousePosition: Vec2Schema,
            pressedKeys: { 
                type: "object", 
                default: {} as Partial<Record<KeyCode, number>>,
            } as const satisfies Schema,
        },
        {
            ...graphicsDatabaseSchema.archetypes,
            Particle: ["particle", "position", "color", "velocity", "boundingBox"],
            StaticVoxelChunk: ["staticVoxelChunk", "position", "staticVoxelChunkPositionsBuffer", "staticVoxelChunkColorsBuffer", "staticVoxelChunkBindGroup", "staticVoxelChunkRenderCount", "dirtyFrame", "cleanFrame"],
        },
        (store) => {
            return ({ 
                ...graphicsDatabaseSchema.transactions(store),
                setMousePosition: (position: Vec2) => {
                    store.resources.mousePosition = position;
                },
                setColor: ({ id, color }: { id: number, color: Vec4 }) => {
                    store.update(id, { color });
                },
                pressKey: (key: KeyCode) => {
                    store.resources.pressedKeys = { ...store.resources.pressedKeys, [key]: 0 };
                },
                releaseKey: (key: KeyCode) => {
                    const copy = { ...store.resources.pressedKeys };
                    delete copy[key];
                    store.resources.pressedKeys = copy;
                },
                incrementPressedKeys: () => {
                    store.resources.pressedKeys = Object.fromEntries(
                        Object.entries(store.resources.pressedKeys).map(([key, value]) => [key, value + 1])
                    );
                },
            })
        }
    );
}


