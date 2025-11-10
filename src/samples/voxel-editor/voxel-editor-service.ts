import { GameService } from "game-service/game-service.js";
import * as voxelEditorTransactions from "./transactions/index.js";
import * as voxelEditorSystems from "./systems/index.js";
import { schema } from "./voxel-editor-store.js";

export function createVoxelEditorService() {
    const service = GameService.create(
        schema,
        voxelEditorTransactions,
    ).initializeSystems({
        ...voxelEditorSystems,
    });
    // Create some test data
    service.database.transactions.setModelSize(service.store.resources.modelSize);
    service.database.transactions.createTestModels();
    return service;
}

export type VoxelEditorService = ReturnType<typeof createVoxelEditorService>;



