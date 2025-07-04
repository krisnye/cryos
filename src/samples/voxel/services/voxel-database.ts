import { GraphicsContext } from "graphics/graphics-context.js";
import { createDatabaseSchema } from "@adobe/data/ecs";
import { Vec2, Vec2Schema, Vec3Schema, Vec4, Vec4Schema } from "math/index.js";
import { createGraphicsDatabaseSchema } from "graphics/database/graphics-database.js";
import { Schema, TrueSchema, U32Schema } from "@adobe/data/schema";
import { VoxelColumnSchema } from "../types/static-voxel/voxel-column.js";
import { StaticVoxelChunkSchema } from "../types/static-voxel-chunk/static-voxel-chunk.js";

const GPUBufferSchema = {
    type: "object",
    default: null as unknown as GPUBuffer,
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
            staticVoxelChunkRenderCount: U32Schema,
        },
        {
            ...graphicsDatabaseSchema.resources,
            mousePosition: Vec2Schema,
        },
        {
            ...graphicsDatabaseSchema.archetypes,
            Particle: ["particle", "position", "color", "velocity", "boundingBox"],
            StaticVoxelChunk: ["staticVoxelChunk", "position", "staticVoxelChunkPositionsBuffer", "staticVoxelChunkColorsBuffer", "staticVoxelChunkRenderCount"],
        },
        (store) => {
            return ({ 
                ...graphicsDatabaseSchema.transactions(store),
                setMousePosition: (position: Vec2) => {
                    store.resources.mousePosition = position;
                },
                setColor: ({ id, color }: { id: number, color: Vec4 }) => {
                    store.update(id, { color });
                }
            })
        }
    );
}


