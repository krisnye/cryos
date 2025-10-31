import { Quat, Vec3 } from "@adobe/data/math";
import { Particle } from "../forest-store.js";

export interface TreeParams {
    /** Starting position of the tree trunk */
    position?: Vec3;
    /** Length of each branch segment */
    segmentLength?: number;
    /** Initial thickness of the trunk */
    initialThickness?: number;
    /** How much thickness reduces per recursion level (0-1) */
    thicknessDecay?: number;
    /** Maximum recursion depth */
    maxDepth?: number;
    /** Angle deviation from parent branch (in radians) */
    branchAngle?: number;
    /** Number of child branches per segment */
    branchCount?: number;
    /** Rotation twist around the branch axis (in radians) */
    twist?: number;
    /** Trunk color (brown) */
    trunkColor?: [number, number, number, number];
    /** Leaf/tip color (green) */
    leafColor?: [number, number, number, number];
}

interface BranchState {
    position: Vec3;
    direction: Vec3;
    thickness: number;
    depth: number;
}

/**
 * Creates a fractal tree made of particles.
 * Each particle represents a branch segment.
 */
export const createTree = (params: TreeParams = {}): Particle[] => {
    const {
        position = [0, 0, 0] as Vec3,
        segmentLength = 1.0,
        initialThickness = 0.3,
        thicknessDecay = 0.7,
        maxDepth = 6,
        branchAngle = Math.PI / 6, // 30 degrees
        branchCount = 2,
        twist = Math.PI / 4, // 45 degrees
        trunkColor = [0.25, 0.15, 0.08, 1.0] as [number, number, number, number], // Darker bark
        leafColor = [0.2, 0.7, 0.2, 1.0] as [number, number, number, number],
    } = params;

    const particles: Particle[] = [];

    const growBranch = (state: BranchState) => {
        const { position, direction, thickness, depth } = state;
        
        // Add randomness to branch termination - some branches end earlier
        const shouldTerminate = depth >= maxDepth - 1 
            || thickness < 0.02 
            || (depth >= maxDepth * 0.6 && Math.random() < (depth / maxDepth) * 0.3);
        
        // Add terminal leaf at the end of the branch
        if (shouldTerminate) {
            const leafSize = 0.8; // Fixed size for visibility
            // Create flattened leaf perpendicular to branch direction
            // The leaf should be a flat disc, with thin dimension along branch direction
            const normalizedDir = Vec3.normalize(direction);
            
            // Default particle is aligned with Z axis, we want to rotate it so Z aligns with branch direction
            const up: Vec3 = [0, 0, 1];
            const angle = Math.acos(Vec3.dot(up, normalizedDir));
            const axis = Vec3.normalize(Vec3.cross(up, normalizedDir));
            const rotation = Vec3.dot(axis, axis) > 0.001 
                ? Quat.fromAxisAngle(axis, angle)
                : Quat.identity;
            
            particles.push({
                position,
                // Large in X and Y, small in Z (perpendicular to branch when rotated)
                scale: [leafSize, leafSize, leafSize * 0.1],
                rotation,
                color: leafColor
            });
            return;
        }

        // Calculate end position of this segment
        const segmentEnd = Vec3.add(position, Vec3.scale(direction, segmentLength));
        const segmentMidpoint = Vec3.scale(Vec3.add(position, segmentEnd), 0.5);

        // Branches stay uniformly dark brown with slight variation based on depth
        const colorVariation = depth * 0.02; // Very subtle variation
        const color: [number, number, number, number] = [
            Math.min(trunkColor[0] + colorVariation, 0.3),
            Math.min(trunkColor[1] + colorVariation, 0.2),
            Math.min(trunkColor[2] + colorVariation, 0.12),
            1.0
        ];

        // Create a particle for this branch segment
        // Calculate rotation to align with branch direction
        const up: Vec3 = [0, 0, 1];
        const angle = Math.acos(Vec3.dot(up, Vec3.normalize(direction)));
        const axis = Vec3.normalize(Vec3.cross(up, direction));
        const rotation = Vec3.dot(axis, axis) > 0.001 
            ? Quat.fromAxisAngle(axis, angle)
            : Quat.identity;

        particles.push({
            position: segmentMidpoint,
            scale: [thickness, thickness, segmentLength],
            rotation,
            color
        });

        // Generate child branches
        if (depth < maxDepth - 1) {
            for (let i = 0; i < branchCount; i++) {
                // Calculate rotation angle around the parent branch
                const rotationAngle = (i / branchCount) * Math.PI * 2 + twist * depth;
                
                // Create a perpendicular vector for branching
                const perpendicular: Vec3 = [
                    Math.cos(rotationAngle),
                    Math.sin(rotationAngle),
                    0
                ];

                // Rotate the branch direction: tilt away from parent + rotate around parent
                // First tilt outward
                const tiltAxis = Vec3.normalize(Vec3.cross(direction, [0, 0, 1]));
                const tiltedDir = Vec3.normalize([
                    direction[0] + perpendicular[0] * Math.sin(branchAngle),
                    direction[1] + perpendicular[1] * Math.sin(branchAngle),
                    direction[2] * Math.cos(branchAngle)
                ]);

                growBranch({
                    position: segmentEnd,
                    direction: tiltedDir,
                    thickness: thickness * thicknessDecay,
                    depth: depth + 1
                });
            }
        }
    };

    // Start growing from the root
    growBranch({
        position,
        direction: [0, 0, 1], // Grow upward in +Z
        thickness: initialThickness,
        depth: 0
    });

    return particles;
};

