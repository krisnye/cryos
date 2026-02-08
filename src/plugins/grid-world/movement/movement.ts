import { Database } from "@adobe/data/ecs";
import { Line3 } from "@adobe/data/math";
import { pickWorldCollision } from "./collision.js";
import { gridWorld } from "../grid-world.js";

export const movement = Database.Plugin.create({
    extends: gridWorld,
    systems: {
        applyVelocity: {
            create: (db) => {
                const dt = 1 / 60;
                const hasGridWorld = "worldChunks" in db.resources;

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

                            const collision = hasGridWorld ? pickWorldCollision(db, line) : null;

                            if (collision !== null) {
                                const particleRadius = 1;
                                position[baseIndex] = collision.worldHitPosition[0] + collision.faceNormal[0] * particleRadius;
                                position[baseIndex + 1] = collision.worldHitPosition[1] + collision.faceNormal[1] * particleRadius;
                                position[baseIndex + 2] = collision.worldHitPosition[2] + collision.faceNormal[2] * particleRadius;
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


