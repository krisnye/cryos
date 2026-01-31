import { MaterialName } from "./definitions.js";
import { Material } from "./material.js";
import { ids } from "./ids.js";

/**
 * Reverse mapping from Material.Id to MaterialName.
 * Created once and reused for all lookups.
 */
const idToName = new Map<Material.Id, MaterialName>(
    Object.entries(ids).map(([name, id]) => [id, name as MaterialName])
);

/**
 * Gets the material name from a Material.Id.
 * @param id The Material.Id to get the name for
 * @returns The material name, or null if the ID is invalid
 */
export const getName = (id: Material.Id): MaterialName | null => {
    return idToName.get(id) ?? null;
};

