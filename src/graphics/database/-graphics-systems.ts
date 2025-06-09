// import { CoreComponents, Extensions, Database } from "ecs";
// import { staticResources } from "ecs/extensions/static-resources";

// type UpdateSystem = (commandEncoder: GPUCommandEncoder) => void;
// type RenderSystem = (renderPassEncoder: GPURenderPassEncoder) => void;

// type GraphicSystem = {
//     update: UpdateSystem,
//     render?: RenderSystem,
// } | {
//     update?: UpdateSystem,
//     render: RenderSystem,
// }

// export type GraphicSystems = { [name: string]: GraphicSystem }

// export const graphicsSystems = (systems: GraphicSystems) => {
//     return <C extends CoreComponents, E extends Extensions>(
//         db: Database<C, E>
//     ): Database<C, E> => {
//         const updateSystems: Record<string, UpdateSystem> = {};
//         const renderSystems: Record<string, RenderSystem> = {};
//         for (const [name, system] of Object.entries(systems)) {
//             if (system.update) {
//                 updateSystems[name] = system.update;
//             }
//             if (system.render) {
//                 renderSystems[name] = system.render;
//             }
//         }
//         return db
//             .withExtension(
//                 staticResources({ updateSystems, renderSystems })
//             )
//     };
// }
