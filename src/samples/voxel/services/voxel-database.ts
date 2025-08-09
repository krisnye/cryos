import { GraphicsContext } from "graphics/graphics-context.js";
import { createDatabaseSchema } from "@adobe/data/ecs";
import { Vec2, Vec2Schema, Vec3Schema, Vec4, Vec4Schema } from "math/index.js";
import { createGraphicsDatabaseSchema } from "graphics/database/graphics-database.js";
import { I32Schema, Schema, TrueSchema, U32Schema } from "@adobe/data/schema";
import { StaticVoxelChunkSchema } from "../types/static-voxel-chunk/static-voxel-chunk.js";
import { KeyCode } from "../types/key-code.js";
import { Camera, CameraSchema } from "graphics/camera/camera.js";

const GPUBufferSchema = {
    default: null as unknown as GPUBuffer,
} as const satisfies Schema;

export const GPUBindGroupSchema = {
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
            position_scale: Vec4Schema,
            color: Vec4Schema,
            flags: U32Schema,
            staticVoxelChunk: StaticVoxelChunkSchema,
            staticVoxelChunkPositionsBuffer: GPUBufferSchema,
            staticVoxelChunkColorsBuffer: GPUBufferSchema,
            staticVoxelChunkFlagsBuffer: GPUBufferSchema,
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
            Particle: ["particle", "position_scale", "color", "velocity", "flags", "boundingBox"],
            StaticVoxelChunk: ["staticVoxelChunk", "position", "staticVoxelChunkPositionsBuffer", "staticVoxelChunkColorsBuffer", "staticVoxelChunkFlagsBuffer", "staticVoxelChunkBindGroup", "staticVoxelChunkRenderCount", "dirtyFrame", "cleanFrame"],
        },
        { 
            ...graphicsDatabaseSchema.transactions,
            setMousePosition: (t, position: Vec2) => {
                t.resources.mousePosition = position;
            },
            setColor: (t, { id, color }: { id: number, color: Vec4 }) => {
                t.update(id, { color });
            },
            pressKey: (t, key: KeyCode) => {
                t.resources.pressedKeys = { ...t.resources.pressedKeys, [key]: 0 };
            },
            releaseKey: (t, key: KeyCode) => {
                const copy = { ...t.resources.pressedKeys };
                delete copy[key];
                t.resources.pressedKeys = copy;
            },
            incrementPressedKeys: (t) => {
                t.resources.pressedKeys = Object.fromEntries(
                    Object.entries(t.resources.pressedKeys).map(([key, value]) => [key, value + 1])
                );
            },
        }
    );
};


