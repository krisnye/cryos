import { Database } from "@adobe/data/ecs";
import { Line3 } from "@adobe/data/math";
import { gridWorld } from "../grid-world.js";

export const movement = Database.Plugin.create({
    extends: gridWorld,
    systems: {
        applyVelocity: {
            create: (db) => {
                const dt = 1 / 60;

                return () => {
                    const tables = db.store.queryArchetypes(["position", "velocity"]);

                    if (tables.length === 0) {
                        return;
                    }

                    for (const table of tables) {
                        const position = table.columns.position.getTypedArray();
                        const velocity = table.columns.velocity.getTypedArray();
                        const rowCount = table.rowCount;

                        for (let i = 0; i < rowCount; i++) {
                            const baseIndex = i * 3;
                            const line: Line3 = {
                                a: [
                                    position[baseIndex + 0],
                                    position[baseIndex + 1],
                                    position[baseIndex + 2],
                                ],
                                b: [
                                    position[baseIndex + 0] + velocity[baseIndex + 0] * dt,
                                    position[baseIndex + 1] + velocity[baseIndex + 1] * dt,
                                    position[baseIndex + 2] + velocity[baseIndex + 2] * dt,
                                ],
                            };

                            const pick = db.resources.pick(line);

                            if (pick !== null) {
                                const particleRadius = 1;
                                position[baseIndex] = pick.worldPosition[0] + pick.faceNormal[0] * particleRadius;
                                position[baseIndex + 1] = pick.worldPosition[1] + pick.faceNormal[1] * particleRadius;
                                position[baseIndex + 2] = pick.worldPosition[2] + pick.faceNormal[2] * particleRadius;
                                velocity[baseIndex] = 0;
                                velocity[baseIndex + 1] = 0;
                                velocity[baseIndex + 2] = 0;
                            } else {
                                position[baseIndex] += velocity[baseIndex] * dt;
                                position[baseIndex + 1] += velocity[baseIndex + 1] * dt;
                                position[baseIndex + 2] += velocity[baseIndex + 2] * dt;
                            }
                        }
                    }
                };
            },
            schedule: { during: ["update"] },
        },
    },
});


