import { Archetype } from "ecs/archetype";
import { CoreComponents } from "./core-components";

export const createGetArchetypes = (archetypes: Archetype<CoreComponents>[]) =>
    function* <Include extends keyof CoreComponents, Exclude extends keyof CoreComponents = never>(
        components: Include[],
        options?: {
            exclude?: Exclude[]
        }
    ): Generator<Archetype<CoreComponents & { [K in Include]: CoreComponents[K] }>> {
        for (const archetype of archetypes) {
            const hasAllRequired = components.every(comp => archetype.columns[comp] !== undefined);
            const hasNoExcluded = !options?.exclude || options.exclude.every(comp => archetype.columns[comp] === undefined);
            if (hasAllRequired && hasNoExcluded) {
                yield archetype;
            }
        }
    }
