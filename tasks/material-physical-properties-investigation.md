# Investigation: Material Physical Properties for Heat Capacity & Sunlight Absorption

## Executive Summary

**Can we correctly model heat capacity and sunlight heating?**  
**Yes, structurally** — the schema and data are in place. **No, operationally** — thermal properties are not used in any simulation or rendering. This document assesses readiness and outlines what’s needed.

---

## Current State

### 1. Material Schema (`cryos/src/types/material/schema.ts`)

| Property | Type | Units | Purpose |
|----------|------|-------|---------|
| `density` | f32 | kg/m³ | Mass per unit volume |
| `specificHeatCapacity` | f32 | J/(kg·K) | Energy to raise 1 kg by 1 K |
| `thermalConductivity` | f32 | W/(m·K) | Heat flow between adjacent voxels |
| `irReflectance` | f32 | 0–1 | Infrared/solar reflectance (absorbed = 1 − irReflectance) |
| `irEmission` | f32 | 0–1 | Infrared emission factor |

### 2. Material Definitions (`definitions.ts`)

Values are physically plausible:

| Material | Density (kg/m³) | Specific Heat (J/(kg·K)) | Thermal Conductivity (W/(m·K)) |
|----------|-----------------|---------------------------|-------------------------------|
| Air | 0.001225 | 1006 | 0.024 |
| Water | 997 | 4200 | 0.66 |
| Rock | 2.65 | 800 | 4.0 |
| Steel | 7.85 | 490 | 50 |
| Concrete | 2.4 | 880 | 1.4 |
| Wood (hard) | 0.65 | 2000 | 0.16 |
| Sand | 2.1 | 830 | 0.2 |

### 3. PhysicalVoxel Temperature Storage

- **Bits 23–12**: temperature in Kelvin (0–4095 K)
- **Source**: `cryos/src/types/physical-voxel/layout.ts`, `pack.ts`, `unpack.ts`
- **Status**: Packed and unpacked, but not used in simulation or rendering

### 4. Shader Usage

- **Instanced PBR** (`instanced-pbr.wgsl.ts`): Material struct includes thermal fields but only `baseColor`, `metallic`, `roughness` are used for lighting
- **Scene**: `lightDirection`, `lightColor`, `ambientStrength` — no irradiance (W/m²) or sun-specific data

---

## Physics for Sunlight Heating

### Heat Capacity

```
Q = m × c × ΔT
```
- Q = energy (J)
- m = mass = ρ × V (density × volume)
- c = specific heat capacity (J/(kg·K))
- ΔT = temperature change (K)

**Example**: 1 m³ concrete (ρ=2400 kg/m³, c=880 J/(kg·K))  
- Heat capacity = 2400 × 880 = 2.1 MJ/K  
- 1 MJ absorbed → ΔT ≈ 0.48 K

### Solar Absorption

```
P_absorbed = α × I × A
```
- α = absorptivity ≈ 1 − irReflectance (0–1)
- I = solar irradiance (~1000 W/m² at Earth surface, direct sun)
- A = exposed surface area (m²)

**Example**: 1 m² concrete surface, α=0.9, I=1000 W/m²  
- P = 0.9 × 1000 × 1 = 900 W absorbed

### Temperature Rise Over Time

```
ΔT = (P × Δt) / (m × c) = (P × Δt) / (ρ × V × c)
```

For a surface voxel (e.g. 0.25 m × 0.25 m × 0.25 m = 0.0156 m³):  
- m = 2400 × 0.0156 ≈ 37.5 kg  
- c = 880 J/(kg·K)  
- Heat capacity = 33 kJ/K  
- 900 W for 1 s → 900 J → ΔT ≈ 0.027 K/s

---

## Gaps & Recommendations

### Gap 1: Thermal Properties Not Used

- **Current**: `density`, `specificHeatCapacity`, `thermalConductivity` exist but are unused
- **Recommendation**: Add a thermal simulation system that:
  1. Uses PhysicalVoxel temperature
  2. Computes solar absorption from `irReflectance` and sun direction/irradiance
  3. Updates temperature via `Q = m × c × ΔT`
  4. Optionally diffuses heat via `thermalConductivity`

### Gap 2: irReflectance / irEmission Semantics

- **Current**: Names suggest infrared reflectance/emission; exact meaning is undocumented
- **For sunlight**: Solar absorptivity α ≈ 1 − irReflectance (if irReflectance is solar reflectance)
- **Recommendation**: Document intended meaning; if IR-only, consider adding `solarAbsorptivity` or clarifying that `irReflectance` covers solar spectrum

### Gap 3: No Sun/Irradiance in Scene

- **Current**: `lightDirection`, `lightColor` — no irradiance (W/m²)
- **Recommendation**: Add `solarIrradiance: f32` (W/m²) to scene uniforms; default ~1000 for direct sun

### Gap 4: Temperature Not in Rendering

- **Current**: PhysicalVoxel temperature is stored but not used for visuals
- **Recommendation**: Optionally map temperature to color (e.g. blackbody tint, heat-map overlay) for feedback

### Gap 5: Exposed Surface Area

- **Current**: Face visibility is computed for meshing; solar flux needs which faces see the sun
- **Recommendation**: Reuse normal/face data; `N·L > 0` for sun-facing surfaces; scale absorbed power by projected area

---

## Feasibility Assessment

| Capability | Data Ready | Logic Needed | Effort |
|------------|------------|--------------|--------|
| Heat capacity (Q = mcΔT) | ✅ | Thermal sim system | Medium |
| Solar absorption (α × I × A) | ⚠️ α from irReflectance | Sun irradiance, face exposure | Medium |
| Temperature storage | ✅ PhysicalVoxel | — | Done |
| Heat diffusion | ✅ thermalConductivity | Diffusion solver | High |
| Visual temperature feedback | ✅ temperature in voxel | Shader mapping | Low |

---

## Suggested Next Steps

1. **Document** `irReflectance` / `irEmission` semantics in the material schema
2. **Add** `solarIrradiance` (and optionally `sunDirection`) to scene uniforms
3. **Implement** a minimal thermal tick: for sun-facing voxels, `ΔT = (α × I × A × Δt) / (ρ × V × c)`
4. **Wire** PhysicalVoxel temperature into the thermal tick (read/write via pack/unpack)
5. **Optional**: Temperature-to-color in the PBR shader for debugging/feedback

---

## References

- Material schema: `cryos/src/types/material/schema.ts`
- Material definitions: `cryos/src/types/material/definitions.ts`
- PhysicalVoxel layout: `cryos/src/types/physical-voxel/layout.ts`
- Solar irradiance: ~1000 W/m² (AM1.5, clear sky, sea level)
