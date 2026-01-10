import { Database, Entity } from "@adobe/data/ecs";
import { F32, Vec3, Vec4 } from "@adobe/data/math";
import { True } from "@adobe/data/schema";
import { graphics } from "plugins/graphics.js";

export const material = Database.Plugin.create({
    components: {
        material: True.schema,
        baseColor: Vec3.schema,
        metallic: { ...F32.schema, default: 0, min: 0, max: 1 },
        roughness: { ...F32.schema, default: 0, min: 0, max: 1 },
        transparent: True.schema,
        density: F32.schema,
        viscosity: F32.schema,
        specificHeatCapacity: F32.schema,
        thermalConductivity: F32.schema,
    },
    resources: {
        materialLookup: { default: new Map<string, Entity>() },
    },
    archetypes: {
        Material:            ["material", "name", "baseColor", "metallic", "roughness", "density", "viscosity", "specificHeatCapacity", "thermalConductivity"],
        TransparentMaterial: ["material", "name", "baseColor", "metallic", "roughness", "density", "viscosity", "specificHeatCapacity", "thermalConductivity", "transparent"],
    },
    transactions: {
        createMaterial(t, props: {
            name: string;
            baseColor: Vec3;
            metallic: number;
            roughness: number;
            transparent: boolean;
            density: number;
            viscosity: number;
            specificHeatCapacity: number;
            thermalConductivity: number;
        }) {
            const { name, transparent, ...rest } = props;
            const materialEntity = t.resources.materialLookup.get(name);
            if (materialEntity) {
                throw new Error(`Material ${name} already exists`);
            }
            let newMaterialEntity: Entity;
            if (transparent) {
                newMaterialEntity = t.archetypes.TransparentMaterial.insert({ material: true, name, ...rest, transparent: true });
            } else {
                newMaterialEntity = t.archetypes.Material.insert({ material: true, name, ...rest });
            }
            t.resources.materialLookup.set(name, newMaterialEntity);
            return newMaterialEntity;
        },
    },
    extends: graphics
})
