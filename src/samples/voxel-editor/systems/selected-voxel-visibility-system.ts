import { SystemFactory } from "systems/system-factory.js";
import { VoxelEditorService } from "../voxel-editor-service.js";
import { AabbFace, Quat, Vec3, Vec4 } from "@adobe/data/math";

const SELECTED_FACE_COLOR: Vec4 = [0.2, 0.2, 1.0, 0.40];
const FACE_THICKNESS = 0.05;
const FACE_OFFSET = 0.5 + FACE_THICKNESS / 2;

/**
 * System that creates visual indicators for selected voxel faces.
 * Creates transparent blue overlays for each selected face on each SelectedVoxel.
 */
export const selectedVoxelVisibilitySystem: SystemFactory<VoxelEditorService> = (service) => {
    const { store } = service;
    return [{
        name: "selectedVoxelVisibilitySystem",
        phase: "update",
        run: () => {
            // Delete all existing SelectedVoxelFace entities
            for (const entity of store.select(store.archetypes.SelectedVoxelFace.components)) {
                store.delete(entity);
            }

            // Iterate all SelectedVoxel entities
            const selectedVoxelTables = store.queryArchetypes(store.archetypes.SelectedVoxel.components);
            for (const table of selectedVoxelTables) {
                for (let i = 0; i < table.rowCount; i++) {
                    const position = table.columns.position.get(i);
                    const selectedFaces = table.columns.selectedFaces.get(i);

                    // For each selected face, create a visual indicator
                    for (const face of AabbFace.getFaces(selectedFaces)) {
                        const normal = AabbFace.getNormal(face);
                        
                        // Calculate position offset along the normal
                        const facePosition: Vec3 = [
                            position[0] + normal[0] * FACE_OFFSET,
                            position[1] + normal[1] * FACE_OFFSET,
                            position[2] + normal[2] * FACE_OFFSET,
                        ];

                        // Calculate scale based on face orientation
                        // Make it thin in the direction of the normal
                        const scale: Vec3 = [
                            normal[0] !== 0 ? FACE_THICKNESS : 1,
                            normal[1] !== 0 ? FACE_THICKNESS : 1,
                            normal[2] !== 0 ? FACE_THICKNESS : 1,
                        ];

                        // Insert the face indicator particle
                        store.archetypes.SelectedVoxelFace.insert({
                            selectedVoxelFace: true,
                            position: facePosition,
                            color: SELECTED_FACE_COLOR,
                            scale: scale,
                            rotation: Quat.identity,
                            transient: true,
                        });
                    }
                }
            }
        }
    }];
};

