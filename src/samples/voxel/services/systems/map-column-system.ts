import { System } from "graphics/systems/system.js";
import { MainService } from "../main-service.js";
import { addToSpatialMap } from "samples/voxel/types/spatial-map/add-to-spatial-map.js";

export const mapColumnSystem = ({ store }: MainService): System => {
    return {
        name: "mapColumnSystem",
        phase: "preUpdate",
        run: () => {
            // find any particles which are not static but have no velocity.
            for (const archetype of store.queryArchetypes(["particle", "position_scale"], { exclude: ["static", "velocity"]})) {
                const idColumn = archetype.columns.id;
                const positionScaleColumn = archetype.columns.position_scale;
                // iterating backwards because these will all be removed
                // and by going backwards we don't have to move to infill the gaps.
                for (let i = archetype.rowCount - 1; i >= 0; i--) {
                    const id = idColumn.get(i);
                    const positionScale = positionScaleColumn.get(i);
                    addToSpatialMap(store.resources.mapColumns, positionScale, id);
                    store.update(id, { static: true });
                }
            }
        }
    }
};
