import { MaterialName, definitions } from "./definitions.js";
import { Material } from "./material.js";

export const ids = Object.fromEntries(
    Object.keys(definitions).map(
        (name, index) => [name, index]
    )
) as Record<MaterialName, Material.Id>;
