import { Phase } from "./phase.js";
import { Vec4 } from "@adobe/data/math";

export type MaterialIndex = number;

export type Material = {
    index: MaterialIndex;
    name: string;
    meta?: boolean;
    phase: Phase;
    color: Vec4;
    /** Density in kg/m³ (kilograms per cubic meter) */
    density: number;
    /** Viscosity in Pa·s (Pascal-seconds) */
    viscosity: number;
    /** Specific heat capacity in J/(kg·K) (Joules per kilogram per Kelvin) */
    specificHeatCapacity: number;
    /** Thermal conductivity in W/(m·K) (Watts per meter per Kelvin) */
    thermalConductivity: number;
}
