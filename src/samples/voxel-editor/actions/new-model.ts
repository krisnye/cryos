import { VoxelEditorCoreService } from '../voxel-editor-service.js';
import { confirmUnsavedChanges } from '../functions/setup-unsaved-changes-warning.js';
import { showStatus } from '../elements/voxel-editor-status-message.js';

export const newModel = (service: VoxelEditorCoreService) => async () => {
    const { isDirty } = service.store.resources;
    
    if (isDirty) {
        const action = await confirmUnsavedChanges('start new model');
        if (action === 'cancel') return;
        
        if (action === 'save') {
            const currentFile = service.store.resources.currentFile;
            const { saveModel } = await import('../functions/save-model.js');
            const handle = await saveModel(service.store, currentFile ?? undefined);
            if (!handle) return;
        }
    }
    
    service.database.transactions.newModel();
    showStatus('New model created', 'success');
};

