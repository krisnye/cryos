import { Vec3, Quat } from "@adobe/data/math";
import { Material } from "../material/material.js";

/**
 * Properties for creating a particle entity.
 * Represents the combined shape of all particle archetypes:
 * - Particle: position, material
 * - ParticleScale: position, material, scale
 * - ParticleRotation: position, material, rotation
 * - ParticleScaleRotation: position, material, scale, rotation
 */
export interface Particle {
    position: Vec3;
    material: Material.Id;
    scale?: Vec3;
    rotation?: Quat;
}

export * as Particle from "./public.js";
