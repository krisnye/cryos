import { VoxelEditorCoreService } from '../voxel-editor-service.js';
import { confirmUnsavedChanges } from '../functions/setup-unsaved-changes-warning.js';
import { showStatus } from '../elements/voxel-editor-status-message.js';

export const openModel = (service: VoxelEditorCoreService) => async () => {
    const { isDirty } = service.store.resources;
    
    if (isDirty) {
        const action = await confirmUnsavedChanges('open file');
        if (action === 'cancel') return;
        
        if (action === 'save') {
            const currentFile = service.store.resources.currentFile;
            const { saveModel } = await import('../functions/save-model.js');
            const handle = await saveModel(service.store, currentFile ?? undefined);
            if (!handle) return;
        }
    }
    
    try {
        const { loadModel } = await import('../functions/load-model.js');
        const handle = await loadModel(service.store);
        if (handle) {
            showStatus(`Model loaded: ${handle.name}`, 'success');
        }
    } catch (error) {
        console.error('Failed to load model:', error);
        showStatus(`Failed to load: ${error instanceof Error ? error.message : String(error)}`, 'danger');
    }
};

