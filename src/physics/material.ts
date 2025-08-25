import { Phase } from "./phase.js";
import { Vec4 } from "../math/vec4/vec4.js";

export type Material = {
    name: string;
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
