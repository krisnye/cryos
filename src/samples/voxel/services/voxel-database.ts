import { GraphicsContext } from "graphics/graphics-context.js";
import { createDatabase } from "@adobe/data/ecs";
import { createGraphicsDatabaseTransactions } from "graphics/database/graphics-database.js";
import { Schema } from "@adobe/data/schema";
import * as transactions from "./transactions/index.js";
import { VoxelStore } from "./voxel-store.js";

const GPUBufferSchema = {
    default: null as unknown as GPUBuffer,
} as const satisfies Schema;

export const GPUBindGroupSchema = {
    default: null as unknown as GPUBindGroup,
} as const satisfies Schema;

const createVoxelTransactions = (context: GraphicsContext) => {
    return {
        ...createGraphicsDatabaseTransactions(context),
        ...transactions
    }
}

export const createVoxelDatabase = (store: VoxelStore, context: GraphicsContext) => {
    return createDatabase(store, createVoxelTransactions(context));
}
