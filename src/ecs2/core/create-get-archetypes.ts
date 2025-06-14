// import { Components } from "../components";
// import { Archetype } from "../archetype/archetype";
// import { CoreComponents } from "../core-components";

// queryArchetypes<
// Include extends ComponentKeys<C>,
// Exclude extends ComponentKeys<C> = never
// >(
// include: readonly Include[],
// options?: QueryOptions<Include, Exclude>
// ): readonly ReadonlyArchetype<Pick<C, Include>>[];


// export const createGetArchetypes = <C extends Components>(archetypes: readonly Archetype<C>[]) =>
//     function <Include extends keyof C, Exclude extends keyof C = never>(
//         components: readonly Include[],
//         options?: {
//             exclude?: readonly Exclude[]
//         }
//     ): Generator<Archetype<CoreComponents & { [K in Include]: C[K] }>> {
//         for (const archetype of archetypes) {
//             const hasAllRequired = components.every(comp => archetype.columns[comp] !== undefined);
//             const hasNoExcluded = !options?.exclude || options.exclude.every(comp => archetype.columns[comp] === undefined);
//             if (hasAllRequired && hasNoExcluded) {
//                 yield archetype as unknown as Archetype<CoreComponents & { [K in Include]: C[K] }>;
//             }
//         }
//     }
