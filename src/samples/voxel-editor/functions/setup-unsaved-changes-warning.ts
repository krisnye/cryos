import { useEffect } from "@adobe/data/lit";
import { VoxelEditorService } from "../voxel-editor-service.js";

/**
 * Hook to setup browser beforeunload event to warn user about unsaved changes.
 * Automatically cleans up when the component unmounts.
 * 
 * @param service - The voxel editor service
 */
export const useUnsavedChangesWarning = (service: VoxelEditorService): void => {
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (service.store.resources.isDirty) {
                // Standard way to trigger browser's confirmation dialog
                event.preventDefault();
                // Chrome requires returnValue to be set
                event.returnValue = '';
            }
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        // Return cleanup function - useEffect will call this on unmount
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []); // Empty deps array = run once on mount, cleanup on unmount
};

/**
 * Shows a confirmation dialog for unsaved changes before a destructive action.
 * Returns true if user wants to proceed, false if they want to cancel.
 * 
 * @param action - Description of the action (e.g., "close", "load new file")
 * @returns Promise that resolves to 'save', 'discard', or 'cancel'
 */
export const confirmUnsavedChanges = async (
    action: string = "continue"
): Promise<'save' | 'discard' | 'cancel'> => {
    // Use native confirm dialog for now
    // In a real implementation, this would be a custom dialog with 3 buttons
    const message = `You have unsaved changes. Save before ${action}?`;
    
    // For now, using a simple confirm dialog
    // True = save, False = cancel (user would need to manually choose discard)
    const result = window.confirm(message);
    
    if (result) {
        return 'save';
    } else {
        // Ask if they want to discard
        const discardConfirm = window.confirm(`Discard unsaved changes?`);
        return discardConfirm ? 'discard' : 'cancel';
    }
};

