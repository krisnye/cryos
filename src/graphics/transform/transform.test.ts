import { describe, it, expect } from "vitest";
import { Transform } from "./transform.js";
import { Vec3, Quat, Mat4x4 } from "@adobe/data/math";

const EPSILON = 1e-6;

const expectVec3Close = (a: Vec3, b: Vec3, epsilon = EPSILON) => {
    expect(Math.abs(a[0] - b[0])).toBeLessThan(epsilon);
    expect(Math.abs(a[1] - b[1])).toBeLessThan(epsilon);
    expect(Math.abs(a[2] - b[2])).toBeLessThan(epsilon);
};

describe("Transform", () => {
    describe("identity transform", () => {
        it("should not change a point when applying identity transform", () => {
            const point: Vec3 = [1, 2, 3];
            const result = Transform.transform(Transform.identity, point);
            expectVec3Close(result, point);
        });

        it("should match matrix transformation for identity", () => {
            const point: Vec3 = [1, 2, 3];
            const matrix = Transform.toMatrix(Transform.identity);
            const matrixResult = Mat4x4.multiplyVec3(matrix, point);
            const directResult = Transform.transform(Transform.identity, point);
            expectVec3Close(directResult, matrixResult);
        });
    });

    describe("translation only", () => {
        it("should translate a point correctly", () => {
            const transform: Transform = {
                position: [5, -3, 2],
                rotation: Quat.identity,
                scale: Vec3.one,
            };
            const point: Vec3 = [1, 2, 3];
            const result = Transform.transform(transform, point);
            expectVec3Close(result, [6, -1, 5]);
        });

        it("should match matrix transformation for translation", () => {
            const transform: Transform = {
                position: [5, -3, 2],
                rotation: Quat.identity,
                scale: Vec3.one,
            };
            const point: Vec3 = [1, 2, 3];
            const matrix = Transform.toMatrix(transform);
            const matrixResult = Mat4x4.multiplyVec3(matrix, point);
            const directResult = Transform.transform(transform, point);
            expectVec3Close(directResult, matrixResult);
        });
    });

    describe("scale only", () => {
        it("should scale a point correctly", () => {
            const transform: Transform = {
                position: Vec3.zero,
                rotation: Quat.identity,
                scale: [2, 3, 0.5],
            };
            const point: Vec3 = [1, 2, 4];
            const result = Transform.transform(transform, point);
            expectVec3Close(result, [2, 6, 2]);
        });

        it("should match matrix transformation for scale", () => {
            const transform: Transform = {
                position: Vec3.zero,
                rotation: Quat.identity,
                scale: [2, 3, 0.5],
            };
            const point: Vec3 = [1, 2, 4];
            const matrix = Transform.toMatrix(transform);
            const matrixResult = Mat4x4.multiplyVec3(matrix, point);
            const directResult = Transform.transform(transform, point);
            expectVec3Close(directResult, matrixResult);
        });
    });

    describe("rotation only", () => {
        it("should rotate a point 90 degrees around Z axis", () => {
            const transform: Transform = {
                position: Vec3.zero,
                rotation: Quat.fromAxisAngle([0, 0, 1], Math.PI / 2),
                scale: Vec3.one,
            };
            const point: Vec3 = [1, 0, 0];
            const result = Transform.transform(transform, point);
            expectVec3Close(result, [0, 1, 0]);
        });

        it("should rotate a point 90 degrees around Y axis", () => {
            const transform: Transform = {
                position: Vec3.zero,
                rotation: Quat.fromAxisAngle([0, 1, 0], Math.PI / 2),
                scale: Vec3.one,
            };
            const point: Vec3 = [1, 0, 0];
            const result = Transform.transform(transform, point);
            expectVec3Close(result, [0, 0, -1]);
        });

        it("should match matrix transformation for rotation", () => {
            const transform: Transform = {
                position: Vec3.zero,
                rotation: Quat.fromAxisAngle([0, 0, 1], Math.PI / 2),
                scale: Vec3.one,
            };
            const point: Vec3 = [1, 2, 3];
            const matrix = Transform.toMatrix(transform);
            const matrixResult = Mat4x4.multiplyVec3(matrix, point);
            const directResult = Transform.transform(transform, point);
            expectVec3Close(directResult, matrixResult);
        });
    });

    describe("combined transformations", () => {
        it("should apply scale, rotation, and translation in correct order", () => {
            const transform: Transform = {
                position: [10, 20, 30],
                rotation: Quat.fromAxisAngle([0, 0, 1], Math.PI / 2),
                scale: [2, 2, 2],
            };
            const point: Vec3 = [1, 0, 0];
            const result = Transform.transform(transform, point);
            // Scale: [2, 0, 0]
            // Rotate 90° around Z: [0, 2, 0]
            // Translate: [10, 22, 30]
            expectVec3Close(result, [10, 22, 30]);
        });

        it("should match matrix transformation for complex transform", () => {
            const transform: Transform = {
                position: [5, -3, 7],
                rotation: Quat.fromAxisAngle([1, 1, 0], Math.PI / 4),
                scale: [2, 0.5, 3],
            };
            const point: Vec3 = [1, 2, 3];
            const matrix = Transform.toMatrix(transform);
            const matrixResult = Mat4x4.multiplyVec3(matrix, point);
            const directResult = Transform.transform(transform, point);
            expectVec3Close(directResult, matrixResult);
        });

        it("should match matrix transformation with arbitrary rotation", () => {
            const transform: Transform = {
                position: [-2, 4, -1],
                rotation: Quat.fromEuler(0.5, 1.2, -0.3),
                scale: [1.5, 0.8, 2.2],
            };
            const point: Vec3 = [3, -1, 2];
            const matrix = Transform.toMatrix(transform);
            const matrixResult = Mat4x4.multiplyVec3(matrix, point);
            const directResult = Transform.transform(transform, point);
            expectVec3Close(directResult, matrixResult);
        });
    });

    describe("multiple points consistency", () => {
        it("should consistently match matrix transformation for various points", () => {
            const transform: Transform = {
                position: [1, 2, 3],
                rotation: Quat.fromAxisAngle([1, 0.5, 0.3], 1.5),
                scale: [2, 1.5, 0.75],
            };

            const testPoints: Vec3[] = [
                [0, 0, 0],
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1],
                [1, 1, 1],
                [-1, -1, -1],
                [5, -3, 2],
                [0.1, 0.2, 0.3],
            ];

            const matrix = Transform.toMatrix(transform);

            for (const point of testPoints) {
                const matrixResult = Mat4x4.multiplyVec3(matrix, point);
                const directResult = Transform.transform(transform, point);
                expectVec3Close(directResult, matrixResult);
            }
        });
    });

    describe("edge cases", () => {
        it("should handle zero point", () => {
            const transform: Transform = {
                position: [1, 2, 3],
                rotation: Quat.fromAxisAngle([0, 1, 0], Math.PI / 4),
                scale: [2, 3, 4],
            };
            const point: Vec3 = [0, 0, 0];
            const matrix = Transform.toMatrix(transform);
            const matrixResult = Mat4x4.multiplyVec3(matrix, point);
            const directResult = Transform.transform(transform, point);
            expectVec3Close(directResult, matrixResult);
        });

        it("should handle zero scale components", () => {
            const transform: Transform = {
                position: [1, 2, 3],
                rotation: Quat.fromAxisAngle([0, 1, 0], Math.PI / 4),
                scale: [0, 1, 1],
            };
            const point: Vec3 = [5, 5, 5];
            const matrix = Transform.toMatrix(transform);
            const matrixResult = Mat4x4.multiplyVec3(matrix, point);
            const directResult = Transform.transform(transform, point);
            expectVec3Close(directResult, matrixResult);
        });

        it("should handle negative scale", () => {
            const transform: Transform = {
                position: [0, 0, 0],
                rotation: Quat.identity,
                scale: [-1, 1, -1],
            };
            const point: Vec3 = [1, 2, 3];
            const matrix = Transform.toMatrix(transform);
            const matrixResult = Mat4x4.multiplyVec3(matrix, point);
            const directResult = Transform.transform(transform, point);
            expectVec3Close(directResult, matrixResult);
        });
    });

    describe("transformInverse", () => {
        it("should be the inverse of transform for identity", () => {
            const point: Vec3 = [1, 2, 3];
            const transformed = Transform.transform(Transform.identity, point);
            const result = Transform.transformInverse(Transform.identity, transformed);
            expectVec3Close(result, point);
        });

        it("should be the inverse of transform for translation only", () => {
            const transform: Transform = {
                position: [5, -3, 2],
                rotation: Quat.identity,
                scale: Vec3.one,
            };
            const point: Vec3 = [1, 2, 3];
            const transformed = Transform.transform(transform, point);
            const result = Transform.transformInverse(transform, transformed);
            expectVec3Close(result, point);
        });

        it("should be the inverse of transform for scale only", () => {
            const transform: Transform = {
                position: Vec3.zero,
                rotation: Quat.identity,
                scale: [2, 3, 0.5],
            };
            const point: Vec3 = [1, 2, 4];
            const transformed = Transform.transform(transform, point);
            const result = Transform.transformInverse(transform, transformed);
            expectVec3Close(result, point);
        });

        it("should be the inverse of transform for rotation only", () => {
            const transform: Transform = {
                position: Vec3.zero,
                rotation: Quat.fromAxisAngle([0, 0, 1], Math.PI / 2),
                scale: Vec3.one,
            };
            const point: Vec3 = [1, 2, 3];
            const transformed = Transform.transform(transform, point);
            const result = Transform.transformInverse(transform, transformed);
            expectVec3Close(result, point);
        });

        it("should be the inverse of transform for combined transformations", () => {
            const transform: Transform = {
                position: [5, -3, 7],
                rotation: Quat.fromAxisAngle([1, 1, 0], Math.PI / 4),
                scale: [2, 0.5, 3],
            };
            const point: Vec3 = [1, 2, 3];
            const transformed = Transform.transform(transform, point);
            const result = Transform.transformInverse(transform, transformed);
            expectVec3Close(result, point);
        });

        it("should handle multiple points correctly", () => {
            const transform: Transform = {
                position: [1, 2, 3],
                rotation: Quat.fromEuler(0.5, 1.2, -0.3),
                scale: [2, 1.5, 0.75],
            };

            const testPoints: Vec3[] = [
                [0, 0, 0],
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1],
                [1, 1, 1],
                [-1, -1, -1],
                [5, -3, 2],
            ];

            for (const point of testPoints) {
                const transformed = Transform.transform(transform, point);
                const result = Transform.transformInverse(transform, transformed);
                expectVec3Close(result, point);
            }
        });

        it("should match inverse matrix transformation", () => {
            const transform: Transform = {
                position: [2, -1, 3],
                rotation: Quat.fromAxisAngle([1, 0, 1], 0.8),
                scale: [1.5, 2, 0.8],
            };
            const point: Vec3 = [3, -1, 2];
            
            const matrix = Transform.toMatrix(transform);
            const inverseMatrix = Mat4x4.inverse(matrix);
            const matrixResult = Mat4x4.multiplyVec3(inverseMatrix, point);
            const directResult = Transform.transformInverse(transform, point);
            
            expectVec3Close(directResult, matrixResult);
        });

        it("should handle negative scale", () => {
            const transform: Transform = {
                position: [1, 2, 3],
                rotation: Quat.fromAxisAngle([0, 1, 0], Math.PI / 6),
                scale: [-2, 1, -1],
            };
            const point: Vec3 = [4, 5, 6];
            const transformed = Transform.transform(transform, point);
            const result = Transform.transformInverse(transform, transformed);
            expectVec3Close(result, point);
        });
    });
});

