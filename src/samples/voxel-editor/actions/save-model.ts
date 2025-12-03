import { VoxelEditorCoreService } from '../voxel-editor-service.js';
import { showStatus } from '../elements/voxel-editor-status-message.js';

export const saveModel = (service: VoxelEditorCoreService) => async () => {
    const currentFile = service.store.resources.currentFile;
    
    try {
        const { saveModel: saveModelFunction } = await import('../functions/save-model.js');
        const handle = await saveModelFunction(service.store, currentFile ?? undefined);
        if (handle) {
            showStatus(`Model saved successfully`, 'success');
        }
    } catch (error) {
        console.error('Failed to save model:', error);
        showStatus(`Failed to save: ${error instanceof Error ? error.message : String(error)}`, 'danger');
    }
};

