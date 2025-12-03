import { GameService } from "game-service/game-service.js";
import { createUndoRedoService } from "@adobe/data/ecs";
import * as voxelEditorTransactions from "./transactions/index.js";
import * as voxelEditorSystems from "./systems/index.js";
import { schema } from "./voxel-editor-store.js";
import { createActionsService } from "./actions/create-actions-service.js";
import { ActionsService } from "./actions/actions-service.js";

function createVoxelEditorCoreService() {
    const coreService = GameService.create(
        schema,
        voxelEditorTransactions,
    );
    
    // Create undo-redo service
    const undoRedo = createUndoRedoService(coreService.database);
    
    return {
        ...coreService,
        undoRedo,
    };
}

export function createVoxelEditorService() {
    const coreService = createVoxelEditorCoreService();
    // Create some test data
    coreService.database.transactions.setModelSize(coreService.store.resources.modelSize);
    coreService.database.transactions.createTestModels();
    
    // Create actions from the core service
    const actions = createActionsService(coreService);
    
    const service: VoxelEditorService = {
        ...coreService,
        actions,
    };
    service.initializeSystems({
        ...voxelEditorSystems,
    } as any); // Type cast needed because VoxelEditorService extends GameService with extra properties
    return service;
}

export type VoxelEditorCoreService = ReturnType<typeof createVoxelEditorCoreService>;

export type VoxelEditorService = VoxelEditorCoreService & { actions: ActionsService };



