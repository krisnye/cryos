import { Vec3 } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { DenseVolume } from "../../types/dense-volume/dense-volume.js";
import { ColumnVolume } from "../../types/column-volume/column-volume.js";
import { Material } from "../../types/material/material.js";
import { PhysicalVoxel } from "../../types/physical-voxel/physical-voxel.js";

/**
 * Creates a ColumnVolume with varied terrain elevations and a sci-fi tower.
 * - 16x16 base with varied terrain: hills, valleys, plateaus with mixed materials (rock, dirt, sand)
 * - Sci-fi tower building with:
 *   - Energy conduits and glowing panels (cyan/blue/teal meta materials)
 *   - Multiple floor patterns (steel, glass, energy grids)
 *   - Vertical energy conduits every 5 floors
 *   - Tall antenna/spire on top with glowing energy nodes
 * 
 * This demonstrates sparse volume storage - most of the 16x16 area is empty air,
 * with only terrain columns and the tower columns containing voxels.
 */
export function createTerrainAndTowerVolume(): ColumnVolume<PhysicalVoxel> {
    const width = 16;
    const height = 16;
    const maxDepth = 60; // Tall enough for smaller tower + spire
    
    // Create a dense volume first, then convert to ColumnVolume
    // This is easier for complex structures
    const denseSize: Vec3 = [width, height, maxDepth];
    const capacity = width * height * maxDepth;
    const denseVolume: DenseVolume<PhysicalVoxel> = {
        type: "dense",
        size: denseSize,
        data: createTypedBuffer(PhysicalVoxel.schema, capacity),
    };

    // Initialize all voxels to air (0)
    for (let i = 0; i < capacity; i++) {
        denseVolume.data.set(i, PhysicalVoxel.pack(Material.ids.air));
    }
    
    // Material IDs for convenience
    const { air, concrete, steel, glass, rock, dirt, sand, metaCyan, metaBlue, metaTeal, metaWhite, metaGray, iron } = Material.ids;
    
    // Create interesting terrain with varied elevations and materials
    // Multiple height patterns: hills, valleys, plateaus
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Create multiple elevation patterns using noise-like functions
            const centerX = width / 2;
            const centerY = height / 2;
            
            // Pattern 1: Radial hills (higher near edges)
            const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
            const radialHeight = (1 - distFromCenter / maxDist) * 4;
            
            // Pattern 2: Perlin-like noise using sine waves
            const noise1 = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 2;
            const noise2 = Math.sin(x * 0.3 + y * 0.7) * 1.5;
            
            // Pattern 3: Corner peaks
            const cornerDist = Math.min(
                Math.sqrt(x ** 2 + y ** 2),
                Math.sqrt((width - x) ** 2 + y ** 2),
                Math.sqrt(x ** 2 + (height - y) ** 2),
                Math.sqrt((width - x) ** 2 + (height - y) ** 2)
            );
            const cornerHeight = Math.max(0, (8 - cornerDist) * 0.5);
            
            // Combine patterns
            const elevation = Math.floor(2 + radialHeight + noise1 + noise2 + cornerHeight);
            const clampedElevation = Math.max(1, Math.min(12, elevation));
            
            // Choose terrain material based on elevation and position
            let terrainMaterial = rock;
            if (clampedElevation <= 3) {
                // Low areas: sand/dirt
                terrainMaterial = (x + y) % 3 === 0 ? sand : dirt;
            } else if (clampedElevation >= 8) {
                // High peaks: rock
                terrainMaterial = rock;
            } else {
                // Mid elevations: mix of rock and dirt
                terrainMaterial = (x * 7 + y * 11) % 3 === 0 ? dirt : rock;
            }
            
            // Fill terrain column
            for (let z = 0; z < clampedElevation; z++) {
                const index = DenseVolume.getIndex(denseVolume, x, y, z);
                denseVolume.data.set(index, PhysicalVoxel.pack(terrainMaterial));
            }
        }
    }
    
    // Create sci-fi tower building at center (x=7-8, y=7-8, 2x2 base)
    const towerX = 7;
    const towerY = 7;
    const towerWidth = 2;
    const towerHeight = 2;
    const towerFloors = 12; // 12 floors (smaller tower)
    const floorHeight = 3; // 3 voxels per floor (0.75m)
    
    // Find terrain height at tower location to connect to ground
    const centerX = width / 2;
    const centerY = height / 2;
    const distFromCenter = Math.sqrt((towerX - centerX) ** 2 + (towerY - centerY) ** 2);
    const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
    const radialHeight = (1 - distFromCenter / maxDist) * 4;
    const noise1 = Math.sin(towerX * 0.5) * Math.cos(towerY * 0.5) * 2;
    const noise2 = Math.sin(towerX * 0.3 + towerY * 0.7) * 1.5;
    const cornerDist = Math.min(
        Math.sqrt(towerX ** 2 + towerY ** 2),
        Math.sqrt((width - towerX) ** 2 + towerY ** 2),
        Math.sqrt(towerX ** 2 + (height - towerY) ** 2),
        Math.sqrt((width - towerX) ** 2 + (height - towerY) ** 2)
    );
    const cornerHeight = Math.max(0, (8 - cornerDist) * 0.5);
    const terrainElevation = Math.floor(2 + radialHeight + noise1 + noise2 + cornerHeight);
    const groundLevel = Math.max(1, Math.min(12, terrainElevation)); // Connect to terrain
    
    // Tower foundation platform (steel with energy conduits) - starts at ground level
    // This will overwrite the terrain at the tower location, creating a solid connection
    for (let z = groundLevel; z < groundLevel + 2; z++) {
        for (let ty = 0; ty < towerHeight; ty++) {
            for (let tx = 0; tx < towerWidth; tx++) {
                const x = towerX + tx;
                const y = towerY + ty;
                const index = DenseVolume.getIndex(denseVolume, x, y, z);
                
                if (z === groundLevel) {
                    // Base layer: steel platform
                    denseVolume.data.set(index, steel);
                } else {
                    // Middle layer: energy conduits (glowing cyan)
                    if ((tx === 0 && ty === 0) || (tx === 1 && ty === 1)) {
                        denseVolume.data.set(index, PhysicalVoxel.pack(metaCyan));
                    } else {
                        denseVolume.data.set(index, steel);
                    }
                }
            }
        }
    }
    
    // Tower floors with sci-fi design
    for (let floor = 0; floor < towerFloors; floor++) {
        const floorZStart = groundLevel + 2 + (floor * floorHeight);
        const floorZEnd = floorZStart + floorHeight - 1;
        const floorType = floor % 4; // 4 different floor patterns
        
        // Floor structure
        for (let z = floorZStart; z <= floorZEnd; z++) {
            for (let ty = 0; ty < towerHeight; ty++) {
                for (let tx = 0; tx < towerWidth; tx++) {
                    const x = towerX + tx;
                    const y = towerY + ty;
                    const index = DenseVolume.getIndex(denseVolume, x, y, z);
                    
                    // Floor slab (bottom of each floor)
                    if (z === floorZStart) {
                        // Floor slabs with energy patterns
                        if (floorType === 0) {
                            // Pattern 1: Full steel floor
                            denseVolume.data.set(index, PhysicalVoxel.pack(steel));
                        } else if (floorType === 1) {
                            // Pattern 2: Steel with cyan energy lines
                            if (tx === 0 || ty === 0 || tx === towerWidth - 1 || ty === towerHeight - 1) {
                                denseVolume.data.set(index, PhysicalVoxel.pack(metaCyan));
                            } else {
                                denseVolume.data.set(index, PhysicalVoxel.pack(steel));
                            }
                        } else if (floorType === 2) {
                            // Pattern 3: Glass floor with steel frame
                            if (tx === 0 || tx === towerWidth - 1 || ty === 0 || ty === towerHeight - 1) {
                                denseVolume.data.set(index, PhysicalVoxel.pack(steel));
                            } else {
                                denseVolume.data.set(index, PhysicalVoxel.pack(glass));
                            }
                        } else {
                            // Pattern 4: Steel with blue energy grid
                            if ((tx + ty) % 2 === 0) {
                                denseVolume.data.set(index, PhysicalVoxel.pack(metaBlue));
                            } else {
                                denseVolume.data.set(index, PhysicalVoxel.pack(steel));
                            }
                        }
                    }
                    // Floor walls and windows
                    else if (z === floorZStart + 1 || z === floorZEnd) {
                        // Outer frame: always steel
                        if (tx === 0 || tx === towerWidth - 1 || ty === 0 || ty === towerHeight - 1) {
                            denseVolume.data.set(index, PhysicalVoxel.pack(steel));
                        }
                        // Inner: glass or energy panels
                        else {
                            if (floorType === 0 || floorType === 2) {
                                denseVolume.data.set(index, PhysicalVoxel.pack(glass));
                            } else {
                                // Energy panels for tech floors
                                denseVolume.data.set(index, metaTeal);
                            }
                        }
                    }
                    // Structural columns (steel) at corners
                    else {
                        const isCorner = (tx === 0 && ty === 0) || (tx === towerWidth - 1 && ty === 0) ||
                                        (tx === 0 && ty === towerHeight - 1) || (tx === towerWidth - 1 && ty === towerHeight - 1);
                        
                        if (isCorner) {
                            // Corner columns: steel with energy conduits
                            if (floor % 3 === 0) {
                                denseVolume.data.set(index, PhysicalVoxel.pack(metaCyan));
                            } else {
                                denseVolume.data.set(index, PhysicalVoxel.pack(steel));
                            }
                        } else {
                            // Interior air space
                            denseVolume.data.set(index, air);
                        }
                    }
                }
            }
        }
        
        // Add energy conduits running vertically every 5 floors
        if (floor % 5 === 0 && floor > 0) {
            for (let z = floorZStart - 1; z < floorZStart; z++) {
                // Energy conduit at center (for 2x2, use one corner)
                const centerIndex = DenseVolume.getIndex(denseVolume, towerX, towerY, z);
                denseVolume.data.set(centerIndex, PhysicalVoxel.pack(metaCyan));
            }
        }
        
        // Add hanging floors/balconies every 4 floors (occasional)
        if (floor % 4 === 0 && floor > 0 && floor < towerFloors - 1) {
            const balconyZ = floorZStart + 1; // Middle of the floor
            
            // Add hanging floors extending from each side of the tower
            // North side (positive Y)
            for (let tx = 0; tx < towerWidth; tx++) {
                const x = towerX + tx;
                const y = towerY + towerHeight; // One voxel north of tower
                if (y < height) {
                    const balconyIndex = DenseVolume.getIndex(denseVolume, x, y, balconyZ);
                    denseVolume.data.set(balconyIndex, PhysicalVoxel.pack(steel));
                    // Add a small extension
                    if (tx === 0 || tx === towerWidth - 1) {
                        const extY = towerY + towerHeight + 1;
                        if (extY < height) {
                            const extIndex = DenseVolume.getIndex(denseVolume, x, extY, balconyZ);
                            denseVolume.data.set(extIndex, PhysicalVoxel.pack(steel));
                        }
                    }
                }
            }
            
            // South side (negative Y)
            for (let tx = 0; tx < towerWidth; tx++) {
                const x = towerX + tx;
                const y = towerY - 1; // One voxel south of tower
                if (y >= 0) {
                    const balconyIndex = DenseVolume.getIndex(denseVolume, x, y, balconyZ);
                    denseVolume.data.set(balconyIndex, PhysicalVoxel.pack(steel));
                    // Add a small extension
                    if (tx === 0 || tx === towerWidth - 1) {
                        const extY = towerY - 2;
                        if (extY >= 0) {
                            const extIndex = DenseVolume.getIndex(denseVolume, x, extY, balconyZ);
                            denseVolume.data.set(extIndex, PhysicalVoxel.pack(steel));
                        }
                    }
                }
            }
            
            // East side (positive X)
            for (let ty = 0; ty < towerHeight; ty++) {
                const x = towerX + towerWidth; // One voxel east of tower
                const y = towerY + ty;
                if (x < width) {
                    const balconyIndex = DenseVolume.getIndex(denseVolume, x, y, balconyZ);
                    denseVolume.data.set(balconyIndex, PhysicalVoxel.pack(steel));
                    // Add a small extension
                    if (ty === 0 || ty === towerHeight - 1) {
                        const extX = towerX + towerWidth + 1;
                        if (extX < width) {
                            const extIndex = DenseVolume.getIndex(denseVolume, extX, y, balconyZ);
                            denseVolume.data.set(extIndex, PhysicalVoxel.pack(steel));
                        }
                    }
                }
            }
            
            // West side (negative X)
            for (let ty = 0; ty < towerHeight; ty++) {
                const x = towerX - 1; // One voxel west of tower
                const y = towerY + ty;
                if (x >= 0) {
                    const balconyIndex = DenseVolume.getIndex(denseVolume, x, y, balconyZ);
                    denseVolume.data.set(balconyIndex, PhysicalVoxel.pack(steel));
                    // Add a small extension
                    if (ty === 0 || ty === towerHeight - 1) {
                        const extX = towerX - 2;
                        if (extX >= 0) {
                            const extIndex = DenseVolume.getIndex(denseVolume, extX, y, balconyZ);
                            denseVolume.data.set(extIndex, PhysicalVoxel.pack(steel));
                        }
                    }
                }
            }
            
            // Add corner extensions for more interesting shape
            const corners = [
                [towerX - 1, towerY - 1], // SW corner
                [towerX + towerWidth, towerY - 1], // SE corner
                [towerX - 1, towerY + towerHeight], // NW corner
                [towerX + towerWidth, towerY + towerHeight], // NE corner
            ];
            
            for (const [cx, cy] of corners) {
                if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
                    const cornerIndex = DenseVolume.getIndex(denseVolume, cx, cy, balconyZ);
                    denseVolume.data.set(cornerIndex, PhysicalVoxel.pack(metaCyan)); // Glowing corner extensions
                }
            }
        }
    }
    
    // Tower top section with antenna/spire
    const topZ = groundLevel + 2 + (towerFloors * floorHeight);
    
    // Top platform (steel)
    for (let z = topZ; z < topZ + 2; z++) {
        for (let ty = 0; ty < towerHeight; ty++) {
            for (let tx = 0; tx < towerWidth; tx++) {
                const x = towerX + tx;
                const y = towerY + ty;
                const index = DenseVolume.getIndex(denseVolume, x, y, z);
                denseVolume.data.set(index, steel);
            }
        }
    }
    
    // Antenna/spire (narrow, tall structure)
    const spireX = towerX;
    const spireY = towerY;
    const spireStartZ = topZ + 2;
    const spireHeight = 5; // Smaller spire
    
    for (let z = spireStartZ; z < spireStartZ + spireHeight; z++) {
        // Main spire: steel with energy core
        const spireIndex = DenseVolume.getIndex(denseVolume, spireX, spireY, z);
        if (z % 2 === 0) {
            denseVolume.data.set(spireIndex, PhysicalVoxel.pack(metaCyan));
        } else {
            denseVolume.data.set(spireIndex, PhysicalVoxel.pack(steel));
        }
    }
    
    // Spire tip (glowing energy)
    const tipZ = spireStartZ + spireHeight;
    const tipIndex = DenseVolume.getIndex(denseVolume, spireX, spireY, tipZ);
    denseVolume.data.set(tipIndex, PhysicalVoxel.pack(metaCyan));
    
    // Convert dense volume to ColumnVolume (sparse representation)
    return ColumnVolume.create(denseVolume);
}

