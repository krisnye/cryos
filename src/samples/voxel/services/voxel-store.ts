import { GraphicsContext } from "graphics/graphics-context.js";
import { createStore, createStoreSchema, Entity } from "@adobe/data/ecs";
import { Vec2Schema, Vec3Schema, Vec4Schema } from "math/index.js";
import { createGraphicsStoreSchema } from "graphics/database/graphics-database.js";
import { Schema, TrueSchema, U32Schema } from "@adobe/data/schema";
import { KeyCode } from "../types/key-code.js";
import { Camera, CameraSchema } from "graphics/camera/camera.js";
import { SpatialMap } from "../types/spatial-map/spatial-map.js";
import { createBasicVoxelMaterials } from "physics/basic-voxel-materials.js";
import { VOXEL_MODEL_SIZE } from "./voxel-constants.js";

export const GPUBindGroupSchema = {
    default: null as unknown as GPUBindGroup,
} as const satisfies Schema;

console.log("materials", createBasicVoxelMaterials(VOXEL_MODEL_SIZE));

const createVoxelStoreSchema = (context: GraphicsContext) => {
    const graphicsStoreSchema = createGraphicsStoreSchema(context);

    return createStoreSchema(
        {
            ...graphicsStoreSchema.components,
            velocity: Vec3Schema,
            particle: TrueSchema,
            static: TrueSchema,
            position_scale: Vec4Schema,
            color: Vec4Schema,
            flags: U32Schema,
            material: U32Schema,
            label: { type: 'string' },
        },
        {
            ...graphicsStoreSchema.resources,
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
            hoverPosition: { ...Vec3Schema, default: [-1000, -1000, -1000] },
            hoverFace: { ...U32Schema, default: 0 },
            mousePosition: Vec2Schema,
            pressedKeys: { 
                type: "object", 
                default: {} as Partial<Record<KeyCode, { frames: number, repeat: number, lastRepeatCount: number }>>,
            } as const satisfies Schema,
            mapSize: {
                ...Vec2Schema,
                default: [256, 256],
            },
            mapColumns: {
                default: new Map<number, Array<Entity | Entity[]>>() as SpatialMap,
                transient: true,
                mutable: true,
            },
            materials: {
                default: createBasicVoxelMaterials(VOXEL_MODEL_SIZE),
                transient: true,
                mutable: true,
            }
        },
        {
            ...graphicsStoreSchema.archetypes,
            Particle: ["particle", "position_scale", "color", "velocity", "flags", "boundingBox", "material"],
            StaticParticle: ["particle", "position_scale", "color", "flags", "boundingBox", "static", "material"],
        },
    );
};

export const createVoxelStore = (context: GraphicsContext) => {
    const schema = createVoxelStoreSchema(context);
    return createStore(schema.components, schema.resources, schema.archetypes);
}

export type VoxelStore = ReturnType<typeof createVoxelStore>;
