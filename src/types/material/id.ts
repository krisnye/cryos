import { MaterialName, materialDefinitions } from "./material-definitions.js";

export const id = Object.fromEntries(
    Object.keys(materialDefinitions).map(
        (name, index) => [name, index]
    )
) as Record<MaterialName, number>;
