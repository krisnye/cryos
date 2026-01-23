import { MaterialName, materialDefinitions } from "./material-definitions.js";
import { MaterialId } from "./material-id.js";

export const id = Object.fromEntries(
    Object.keys(materialDefinitions).map(
        (name, index) => [name, index]
    )
) as Record<MaterialName, MaterialId>;
