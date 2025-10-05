import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { Rgba } from "data/index.js";
import { Volume } from "data/volume/volume.js";

export async function imageUrlToRgbaVolume(url: string): Promise<Volume<Rgba>> {
    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            
            img.onload = () => {
                try {
                    // Create canvas to extract pixel data
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    if (!ctx) {
                        reject(new Error("Could not get canvas context"));
                        return;
                    }
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    // Draw image to canvas
                    ctx.drawImage(img, 0, 0);
                    
                    // Get image data - this is a Uint8ClampedArray with guaranteed byte order
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const pixels = imageData.data; // Uint8ClampedArray: [R, G, B, A, R, G, B, A, ...]
                    
                    // Convert to Rgba values - read bytes directly, no endianness issues
                    // Fix vertical flip by reading rows from bottom to top
                    const rgbaValues: Rgba[] = [];
                    
                    for (let row = img.height - 1; row >= 0; row--) {
                        for (let col = 0; col < img.width; col++) {
                            const pixelIndex = (row * img.width + col) * 4;
                            const r = pixels[pixelIndex];     // Red (0-255)
                            const g = pixels[pixelIndex + 1]; // Green (0-255)
                            const b = pixels[pixelIndex + 2]; // Blue (0-255)
                            const a = pixels[pixelIndex + 3]; // Alpha (0-255)
                            
                            // Pack as Rgba expects: R << 0 | G << 8 | B << 16 | A << 24
                            const rgba = (r << 0) | (g << 8) | (b << 16) | (a << 24);
                            rgbaValues.push(rgba);
                        }
                    }
                    
                    // Create volume with RGBA data
                    const volume: Volume<Rgba> = {
                        size: [img.width, img.height, 1],
                        data: createTypedBuffer(Rgba.schema, rgbaValues)
                    };
                    
                    resolve(volume);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => {
                reject(new Error("Failed to load image"));
            };
            
            img.src = url;
            
        } catch (error) {
            reject(error);
        }
    });
}
