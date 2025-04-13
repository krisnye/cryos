import { createDatabase } from "../../../data/ecs/createDatabase"
import { addGameExtensions } from "../../../data/ecs/extensions/addGameExtensions"
import { Particle, ParticleSchema } from "../types/Particle"
import { GraphicsContext } from "../../../data/graphics/GraphicsContext";
import { Camera } from "../../../data/graphics/Camera/Camera";
import { Vec3, Vec3_normalize } from "../../../data/Vec3";
import { TrueSchema } from "../../../data/True";

export const createStateService = (graphicsContext: GraphicsContext) => {
    return addGameExtensions(createDatabase(), graphicsContext)
        .withComponents({
            particle: ParticleSchema,
            staticFlag: TrueSchema,
        })
        .withArchetypes({
            particles: ["id", "particle"],
            particlesStatic: ["id", "particle", "staticFlag"]
        })
        .withResources({
            sceneBuffer: null as unknown as GPUBuffer,
            pressedKeys: new Set<string>(),
            camera: {
                aspect: graphicsContext.canvas.width / graphicsContext.canvas.height,
                fieldOfView: Math.PI / 4,
                nearPlane: 0.1,
                farPlane: 100.0,
                position: [0, 0, 20],
                target: [0, 0, 0],
                up: [0, 1, 0],
            } satisfies Camera,
            lightDirection: Vec3_normalize([1, 2, 5.0]),
            ambientStrength: 0.5,
            lightColor: [1.2, 1.2, 1.2] as Vec3,
        })
        .withActions({
            createParticle(this, particle: Particle) {
                return this.archetypes.particles.create({ particle });
            },
        })
        .simplifyTypes();
}