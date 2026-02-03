import { Database } from "@adobe/data/ecs";
import { physics } from "../../physics/physics.js";

export const movement = Database.Plugin.create({
    extends: physics,
    systems: {
        applyVelocity: {
            create: (db) => {
                // Fixed timestep for 60fps (seconds per frame)
                const dt = 1 / 60;

                return () => {
                    // Query all entities that have both position and velocity
                    const tables = db.store.queryArchetypes(["position", "velocity"]);

                    if (tables.length === 0) {
                        return;
                    }

                    for (const table of tables) {
                        const position = table.columns.position.getTypedArray() as Float32Array;
                        const velocity = table.columns.velocity.getTypedArray() as Float32Array;
                        const rowCount = table.rowCount;

                        // Vec3 layout: [x0, y0, z0, x1, y1, z1, ...]
                        for (let i = 0; i < rowCount; i++) {
                            const baseIndex = i * 3;
                            position[baseIndex] += velocity[baseIndex] * dt;
                            position[baseIndex + 1] += velocity[baseIndex + 1] * dt;
                            position[baseIndex + 2] += velocity[baseIndex + 2] * dt;
                        }
                    }
                };
            },
            schedule: { during: ["update"] },
        },
    },
});


