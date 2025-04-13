
// import { Assert } from "../../../types/meta/Assert";
// import { Primitive } from "../../../types/Primitive";
// import { Vec3, Vec3Schema } from "../../Vec3/Vec3";
// import { Archetype } from "../Archetype/Archetype";
// import { CoreComponents } from "../CoreComponents";
// import { createDatabase } from "../createDatabase";
// import { Database } from "../Database";
// import { Extensions } from "../Extensions";
// import { Entity } from "../Entity";
// import { Equal } from "../../../types";

// export const addAsyncComputedComponent = <
//     C extends CoreComponents,
//     E extends Extensions,
//     const K extends Partial<C> & CoreComponents,
//     const N extends string,
// >(
//     db: Database<C,E>,
//     options: {
//         archetype: Archetype<K>,
//         name: N,
//         group: (componentValues: Omit<K, "id"> ) => Primitive
//     }
// ) => {

//     // const groupToComponent = new Map<Primitive, string>();
//     // const groupToArchetype = new Map<Primitive, Archetype<K>>();
//     // const getArchetype = (group: Primitive) => {
//     //     let archetype = groupToArchetype.get(group);
//     //     if (!archetype) {
//     //         const component = `group_${options.name}_${group}`;
//     //         db.withComponents({
//     //             [component]: { const: group },
//     //         });
//     //         groupToComponent.set(group, component);
//     //         archetype = db.getArchetype([component, ...options.archetype.components] as any) as any;
//     //         groupToArchetype.set(group, archetype!);
//     //     }
//     //     return archetype!;
//     // }
//     // return db
//     //     .withResources({
//     //         [`${options.name}GroupToComponent` as const]: groupToComponent,
//     //         [`${options.name}GroupToArchetype` as const]: groupToArchetype,
//     //     } as { // This as syntax is necessary to make the type fields work, otherwise they are [string]
//     //         [K in `${typeof options.name}GroupToComponent`]: typeof groupToComponent
//     //     } & {
//     //         [K in `${typeof options.name}GroupToArchetype`]: typeof groupToArchetype
//     //     })
//     //     .withActions({
//     //         [`create${(options.name)}` as const]: (componentValues: { [P in keyof Omit<K, "id">]: K[P] }) => {
//     //             const group = options.group(componentValues);
//     //             const archetype = getArchetype(group);
//     //             const component = groupToComponent.get(group)!;
//     //             componentValues[component] = component;
//     //             const entity = archetype.createEntity(componentValues);
//     //             return entity;
//     //         }
//     //     } as any as {
//     //         [P in `create${(typeof options.name)}`]: (componentValues: { [P in keyof Omit<K, "id">]: K[P] }) => Entity
//     //     })
// }

// // function typeChecks() {
// //     const db = createDatabase().withComponents({ position: Vec3Schema } as const).withArchetypes({ particle: ["id", "position"]} as const);
// //     const db2 = addGroupArchetype(db, {
// //         archetype: db.archetypes.particle,
// //         name: "Particle",
// //         group: (componentValues) => componentValues.position[0].toString()
// //     }).simplifyTypes();
// //     type Actions = (typeof db2)["actions"];
// //     type Resources = (typeof db2)["resources"];
// //     type CheckActions = Assert<Equal<Actions, {
// //         createParticle: (componentValues: { position: readonly [number, number, number] }) => Entity
// //     }>>;
// //     type ResourcesParticleGroupToComponent = Resources["ParticleGroupToComponent"];
// //     type CheckResources = Assert<Equal<Resources, {
// //         ParticleGroupToComponent: Map<Primitive, string>
// //         ParticleGroupToArchetype: Map<Primitive, Archetype<CoreComponents & Pick<CoreComponents & { position: Vec3 }, "id" | "position">>>
// //     }>>;
// // }

