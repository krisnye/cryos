import { Vec3 } from "@adobe/data/math";
import { HelloModelStore } from "../services/state-service/hello-model-store.js";

export const physicsSystem = (db: HelloModelStore) => {

    // const centersOfGravity = db.select(db.archetypes.CenterOfGravity.components).map(
    //     (entity) => {
    //         return db.read(entity, db.archetypes.CenterOfGravity)!
    //     }
    // )

    // const computeForceAtPosition = (position: Vec3) => {
    //     let force: Vec3 = [0, 0, 0];
    //     for (const centerOfGravity of centersOfGravity) {
    //         const distance = Vec3.subtract(position, centerOfGravity.position);
    //         const distanceSquared = Vec3.dot(distance, distance);
    //         force = Vec3.add(force, Vec3.scale(distance, -centerOfGravity.mass / distanceSquared));
    //     }
    //     return force;
    // }

    // // Handle particle physics with collision detection
    // for (const table of db.queryArchetypes(db.archetypes.Particle.components)) {
    //     for (let i = 0; i < table.rowCount; i++) {
    //         const velocity = table.columns.velocity.get(i);
    //         const position = table.columns.position.get(i);
    //         const particleScale = table.columns.scale.get(i);
            
    //         // Apply gravity forces
    //         const force = computeForceAtPosition(position);
    //         let newVelocity = Vec3.add(velocity, force);
    //         let newPosition = Vec3.add(position, newVelocity);
            
    //         // Check for collisions with centers of gravity
    //         for (const centerOfGravity of centersOfGravity) {
    //             const distance = Vec3.subtract(newPosition, centerOfGravity.position);
    //             const distanceSquared = Vec3.dot(distance, distance);
    //             const combinedRadius = centerOfGravity.scale + particleScale;
    //             const combinedRadiusSquared = combinedRadius * combinedRadius;
                
    //             // If collision detected
    //             if (distanceSquared < combinedRadiusSquared) {
    //                 // Calculate collision normal (unit vector from center to particle)
    //                 const distanceMagnitude = Math.sqrt(distanceSquared);
    //                 const normal: Vec3 = distanceMagnitude > 0 ? Vec3.scale(distance, 1 / distanceMagnitude) : [1, 0, 0];
                    
    //                 // Push particle to exactly the collision boundary
    //                 newPosition = Vec3.add(centerOfGravity.position, Vec3.scale(normal, combinedRadius));
                    
    //                 // Bounce with coefficient of restitution 1.0 (perfectly elastic)
    //                 const velocityAlongNormal = Vec3.dot(newVelocity, normal);
    //                 if (velocityAlongNormal < 0) { // Only bounce if moving towards center
    //                     const bounceImpulse = Vec3.scale(normal, -2 * velocityAlongNormal);
    //                     newVelocity = Vec3.add(newVelocity, bounceImpulse);
    //                 }
    //             }
    //         }
            
    //         table.columns.velocity.set(i, newVelocity);
    //         table.columns.position.set(i, newPosition);
    //     }
    // }

    // // now we will render the particles
    // const canvas = db.resources.canvas;
    // if (canvas) {
    //     const ctx = canvas.getContext("2d");
    //     if (ctx) {
    //         ctx.clearRect(0, 0, canvas.width, canvas.height);
    //         for (const table of db.queryArchetypes(db.archetypes.Renderable.components)) {
    //             for (let i = 0; i < table.rowCount; i++) {
    //                 const position = table.columns.position.get(i);
    //                 const color = table.columns.color.get(i);
    //                 ctx.fillStyle = `rgba(${Math.floor(color[0] * 255)}, ${Math.floor(color[1] * 255)}, ${Math.floor(color[2] * 255)}, ${color[3]})`;
    //                 const scale = table.columns.scale.get(i);
    //                 ctx.beginPath();
    //                 ctx.arc(position[0], position[1], Math.max(0.5, scale), 0, 2 * Math.PI);
    //                 ctx.closePath();
    //                 ctx.fill();
    //             }
    //         }
    //     }
    // }
}
