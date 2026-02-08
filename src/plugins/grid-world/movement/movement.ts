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

                            const collisionAlpha = hasGridWorld ? pickWorldCollision(db, line) : null;

                            if (collisionAlpha !== null) {
                                const t = Math.max(0, collisionAlpha - 0.0001);
                                position[baseIndex] = line.a[0] + (line.b[0] - line.a[0]) * t;
                                position[baseIndex + 1] = line.a[1] + (line.b[1] - line.a[1]) * t;
                                position[baseIndex + 2] = line.a[2] + (line.b[2] - line.a[2]) * t;
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


