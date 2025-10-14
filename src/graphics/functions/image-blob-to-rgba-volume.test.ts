import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { imageBlobToRgbaVolume } from "./image-blob-to-rgba-volume.js";
import { Rgba } from "data/index.js";

describe("imageBlobToRgbaVolume", () => {
    let testCanvas: HTMLCanvasElement;
    let testContext: CanvasRenderingContext2D;

    beforeEach(() => {
        // Create a test canvas
        testCanvas = document.createElement('canvas');
        testCanvas.width = 4;
        testCanvas.height = 4;
        testContext = testCanvas.getContext('2d')!;
    });

    afterEach(() => {
        // Clean up
        if (testCanvas.parentNode) {
            testCanvas.parentNode.removeChild(testCanvas);
        }
    });

    function createTestImageBlob(): Promise<Blob> {
        // Draw a simple test pattern
        testContext.fillStyle = 'rgba(255, 0, 0, 255)'; // Red
        testContext.fillRect(0, 0, 2, 2);
        
        testContext.fillStyle = 'rgba(0, 255, 0, 255)'; // Green
        testContext.fillRect(2, 0, 2, 2);
        
        testContext.fillStyle = 'rgba(0, 0, 255, 255)'; // Blue
        testContext.fillRect(0, 2, 2, 2);
        
        testContext.fillStyle = 'rgba(255, 255, 0, 255)'; // Yellow
        testContext.fillRect(2, 2, 2, 2);

        return new Promise((resolve) => {
            testCanvas.toBlob((blob) => {
                resolve(blob!);
            }, 'image/png');
        });
    }

    function createTransparentImageBlob(): Promise<Blob> {
        // Draw a transparent image
        testContext.clearRect(0, 0, 4, 4);
        testContext.fillStyle = 'rgba(255, 0, 0, 128)'; // Semi-transparent red
        testContext.fillRect(1, 1, 2, 2);

        return new Promise((resolve) => {
            testCanvas.toBlob((blob) => {
                resolve(blob!);
            }, 'image/png');
        });
    }

    it("should convert image blob to RGBA volume", async () => {
        const imageBlob = await createTestImageBlob();
        
        const volume = await imageBlobToRgbaVolume(imageBlob);
        
        expect(volume.size).toEqual([4, 4, 1]);
        expect(volume.data.capacity).toBe(16); // 4x4 pixels
    });

    it("should correctly extract colors from test pattern", async () => {
        const imageBlob = await createTestImageBlob();
        
        const volume = await imageBlobToRgbaVolume(imageBlob);
        
        // Check top-left pixel (should be blue after vertical flip)
        const topLeftRgba = volume.data.get(0);
        const topLeftVec4 = Rgba.toVec4(topLeftRgba);
        expect(topLeftVec4[0]).toBeCloseTo(0, 2); // R
        expect(topLeftVec4[1]).toBeCloseTo(0, 2); // G
        expect(topLeftVec4[2]).toBeCloseTo(1, 2); // B
        expect(topLeftVec4[3]).toBeCloseTo(1, 2); // A

        // Check top-right pixel (should be yellow after vertical flip)
        const topRightRgba = volume.data.get(2);
        const topRightVec4 = Rgba.toVec4(topRightRgba);
        expect(topRightVec4[0]).toBeCloseTo(1, 2); // R
        expect(topRightVec4[1]).toBeCloseTo(1, 2); // G
        expect(topRightVec4[2]).toBeCloseTo(0, 2); // B
        expect(topRightVec4[3]).toBeCloseTo(1, 2); // A

        // Check bottom-left pixel (should be red after vertical flip)
        const bottomLeftRgba = volume.data.get(8);
        const bottomLeftVec4 = Rgba.toVec4(bottomLeftRgba);
        expect(bottomLeftVec4[0]).toBeCloseTo(1, 2); // R
        expect(bottomLeftVec4[1]).toBeCloseTo(0, 2); // G
        expect(bottomLeftVec4[2]).toBeCloseTo(0, 2); // B
        expect(bottomLeftVec4[3]).toBeCloseTo(1, 2); // A

        // Check bottom-right pixel (should be green after vertical flip)
        const bottomRightRgba = volume.data.get(10);
        const bottomRightVec4 = Rgba.toVec4(bottomRightRgba);
        expect(bottomRightVec4[0]).toBeCloseTo(0, 2); // R
        expect(bottomRightVec4[1]).toBeCloseTo(1, 2); // G
        expect(bottomRightVec4[2]).toBeCloseTo(0, 2); // B
        expect(bottomRightVec4[3]).toBeCloseTo(1, 2); // A
    });

    it("should handle transparent pixels correctly", async () => {
        const imageBlob = await createTransparentImageBlob();
        
        const volume = await imageBlobToRgbaVolume(imageBlob);
        
        // Check center pixel (should be red, alpha may be 1 due to canvas rendering)
        const centerRgba = volume.data.get(5); // Position (1,1) in 4x4 grid
        const centerVec4 = Rgba.toVec4(centerRgba);
        expect(centerVec4[0]).toBeCloseTo(1, 2); // R
        expect(centerVec4[1]).toBeCloseTo(0, 2); // G
        expect(centerVec4[2]).toBeCloseTo(0, 2); // B
        expect(centerVec4[3]).toBeCloseTo(1, 2); // A (canvas may render as opaque)

        // Check corner pixel (should be transparent)
        const cornerRgba = volume.data.get(0);
        const cornerVec4 = Rgba.toVec4(cornerRgba);
        expect(cornerVec4[3]).toBeCloseTo(0, 2); // A should be 0
    });

    it("should throw error for non-image blob", async () => {
        const textBlob = new Blob(['not an image'], { type: 'text/plain' });
        
        await expect(imageBlobToRgbaVolume(textBlob)).rejects.toThrow('File is not an image: text/plain');
    });

    it("should handle different image sizes", async () => {
        // Test with 1x1 image
        testCanvas.width = 1;
        testCanvas.height = 1;
        testContext.fillStyle = 'rgba(128, 64, 192, 255)';
        testContext.fillRect(0, 0, 1, 1);

        const smallBlob = await new Promise<Blob>((resolve) => {
            testCanvas.toBlob((blob) => resolve(blob!), 'image/png');
        });

        const smallVolume = await imageBlobToRgbaVolume(smallBlob);
        expect(smallVolume.size).toEqual([1, 1, 1]);
        expect(smallVolume.data.capacity).toBe(1);

        // Test with 2x3 image
        testCanvas.width = 2;
        testCanvas.height = 3;
        testContext.fillStyle = 'rgba(200, 100, 50, 255)';
        testContext.fillRect(0, 0, 2, 3);

        const mediumBlob = await new Promise<Blob>((resolve) => {
            testCanvas.toBlob((blob) => resolve(blob!), 'image/png');
        });

        const mediumVolume = await imageBlobToRgbaVolume(mediumBlob);
        expect(mediumVolume.size).toEqual([2, 3, 1]);
        expect(mediumVolume.data.capacity).toBe(6);
    });
});
