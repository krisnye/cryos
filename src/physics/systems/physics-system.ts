import { SystemFactory } from "systems/system-factory.js";
import { GraphicsService } from "graphics/graphics-service.js";
import { Vec3 } from "@adobe/data/math";
import { Mutable } from "@adobe/data";

export const physicsSystem: SystemFactory<GraphicsService> = (service) => {
    const { store } = service;
    return [{
        name: "gravitySystem",
        phase: "physics",
        run: () => {
            const gravitySources: { position: Vec3; mass: number }[] = [];
            for (const table of store.queryArchetypes(["mass", "position", "gravitySource"])) {
                for (let i = 0; i < table.rowCount; i++) {
                    const mass = table.columns.mass.get(i);
                    const gravitySource = table.columns.gravitySource.get(i);
                    if (gravitySource) {
                        gravitySources.push({ position: table.columns.position.get(i), mass });
                    }
                }
            }
            const { gravitationalConstant, updateFrame } = store.resources;
            const deltaTime = updateFrame.deltaTime;
            let total = 0;
            // mass is not necessary on a target because it cancels out in the equation
            for (const table of store.queryArchetypes(["position", "gravityTarget", "velocity"])) {
                for (let i = 0; i < table.rowCount; i++) {
                    total++;
                    const velocity = table.columns.velocity.get(i);
                    let acceleration: Mutable<Vec3> | Vec3 = [0, 0, 0];
                    for (const gravitySource of gravitySources) {
                        const distance = Vec3.subtract(table.columns.position.get(i), gravitySource.position);
                        const distanceSquared = Vec3.dot(distance, distance);
                        const r = Math.sqrt(distanceSquared);
                        acceleration = Vec3.add(acceleration, Vec3.scale(distance, -gravitationalConstant * gravitySource.mass / (distanceSquared * r)));
                    }
                    table.columns.velocity.set(i, Vec3.add(velocity, Vec3.scale(acceleration, deltaTime)));
                }
            }
            console.log(`physicsSystem: ${total} gravity targets, gravity sources: ${gravitySources.length}`);
        }
    },
    {
        name: "movementSystem",
        phase: "physics",
        dependencies: ["gravitySystem"],
        run: () => {
            const deltaTime = store.resources.updateFrame.deltaTime;
            // let total = 0;
            for (const table of store.queryArchetypes(["position", "velocity"])) {
                for (let i = 0; i < table.rowCount; i++) {
                    // total++;
                    // this is not maximally efficient.
                    // we can get typed arrays and iterate.
                    // then theoretically, when we care we could use WASM and SIMD.
                    const position = table.columns.position.get(i);
                    const velocity = table.columns.velocity.get(i);
                    const newPosition = Vec3.add(position, Vec3.scale(velocity, deltaTime));
                    table.columns.position.set(i, newPosition);
                }
            }
            // console.log(`physicsSystem: ${total} particles`);
        }
    }];
};
