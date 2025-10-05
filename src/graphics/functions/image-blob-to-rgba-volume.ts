import { Rgba } from "data/index.js";
import { Volume } from "data/volume/volume.js";
import { imageUrlToRgbaVolume } from "./image-url-to-rgba-volume.js";

export async function imageBlobToRgbaVolume(blob: Blob): Promise<Volume<Rgba>> {
    // Check if blob is an image
    if (!blob.type.startsWith('image/')) {
        throw new Error(`File is not an image: ${blob.type}`);
    }

    // Create URL from blob and delegate to URL function
    const imageUrl = URL.createObjectURL(blob);

    try {
        return await imageUrlToRgbaVolume(imageUrl);
    } finally {
        // Always clean up the blob URL
        URL.revokeObjectURL(imageUrl);
    }
}